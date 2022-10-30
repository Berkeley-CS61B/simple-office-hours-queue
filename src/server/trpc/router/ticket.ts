import Ably from 'ably/promises';
import {
  Assignment,
  ChatMessage,
  Location,
  SiteSettings,
  SiteSettingsValues,
  Ticket,
  TicketStatus,
  User,
} from '@prisma/client';
import { router, protectedProcedure, protectedStaffProcedure } from '../trpc';
import { z } from 'zod';

export const ticketRouter = router({
  createTicket: protectedProcedure
    .input(
      z.object({
        description: z.string().optional(),
        assignmentId: z.number(),
        locationId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Limits students to 1 ticket at a time
      const doesStudentHaveActiveTicket = await ctx.prisma.ticket.findFirst({
        where: {
          createdByUserId: ctx.session.user.id,
          OR: [{ status: TicketStatus.PENDING }, { status: TicketStatus.OPEN }, { status: TicketStatus.ASSIGNED }],
        },
      });

      if (doesStudentHaveActiveTicket) {
        return;
      }

      const pendingStageEnabled = await ctx.prisma.settings.findUnique({
        where: {
          setting: SiteSettings.IS_PENDING_STAGE_ENABLED,
        },
      });

      const ticket = await ctx.prisma.ticket.create({
        data: {
          description: input.description,
          assignment: {
            connect: {
              id: input.assignmentId,
            },
          },
          location: {
            connect: {
              id: input.locationId,
            },
          },
          createdBy: {
            connect: {
              id: ctx?.session?.user?.id,
            },
          },
          // If pending stage is enabled, set status to pending
          status: pendingStageEnabled?.value === SiteSettingsValues.TRUE ? TicketStatus.PENDING : TicketStatus.OPEN,
        },
      });

      const ticketWithNames: TicketWithNames[] = await convertTicketToTicketWithNames([ticket], ctx);

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      await channel.publish('new-ticket', ticketWithNames[0]);

      return ticketWithNames[0];
    }),

  approveTickets: protectedStaffProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const approvedTickets: Ticket[] = [];

      for (const ticketId of input.ticketIds) {
        const ticket: Ticket = await ctx.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.OPEN },
        });
        approvedTickets.push(ticket);
      }

      await convertTicketToTicketWithNames(approvedTickets, ctx).then(async tickets => {
        const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
        const channel = ably.channels.get('tickets'); // Change to include queue id
        await channel.publish('tickets-approved', tickets);

        // Uses ticket inner page channel
        for (const ticket of tickets) {
          const channel = ably.channels.get(`ticket-${ticket.id}`);
          await channel.publish('ticket-approved', ticket);
        }
        return tickets;
      });
    }),

  assignTickets: protectedStaffProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const assignedTickets: Ticket[] = [];

      for (const ticketId of input.ticketIds) {
        const ticket: Ticket = await ctx.prisma.ticket.update({
          where: { id: ticketId },
          data: {
            status: TicketStatus.ASSIGNED,
            helpedAt: new Date(),
            helpedBy: {
              connect: {
                id: ctx.session?.user?.id,
              },
            },
          },
        });
        assignedTickets.push(ticket);
      }

      await convertTicketToTicketWithNames(assignedTickets, ctx).then(async tickets => {
        const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
        const channel = ably.channels.get('tickets'); // Change to include queue id
        await channel.publish('tickets-assigned', tickets);

        // Uses ticket inner page channel
        for (const ticket of tickets) {
          const channel = ably.channels.get(`ticket-${ticket.id}`);
          await channel.publish('ticket-assigned', ticket);
        }
        return tickets;
      });
    }),

  resolveTickets: protectedStaffProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const resolvedTickets: Ticket[] = [];

      for (const ticketId of input.ticketIds) {
        const ticket: Ticket = await ctx.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.RESOLVED, resolvedAt: new Date() },
        });
        resolvedTickets.push(ticket);
      }

      await convertTicketToTicketWithNames(resolvedTickets, ctx).then(async tickets => {
        const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
        const channel = ably.channels.get('tickets'); // Change to include queue id
        await channel.publish('tickets-resolved', tickets);

        // Uses ticket inner page channel
        for (const ticket of tickets) {
          const channel = ably.channels.get(`ticket-${ticket.id}`);
          await channel.publish('ticket-resolved', ticket);
        }
        return tickets;
      });
    }),

  // We only allow the creator of the ticket to close it
  closeTicket: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const ticket = await ctx.prisma.ticket.findUnique({
        where: {
          id: input.ticketId,
        },
      });
      if (ticket?.createdByUserId !== ctx.session?.user?.id) {
        throw new Error('You are not authorized to close this ticket');
      }

      const closedTicket: Ticket = await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: { status: TicketStatus.CLOSED },
      });

      await convertTicketToTicketWithNames([closedTicket], ctx).then(async ticketsWithNames => {
        const ticketWithName: TicketWithNames = ticketsWithNames[0]!;
        const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
        const channel = ably.channels.get('tickets'); // Change to include queue id
        await channel.publish('ticket-closed', ticketWithName);

        // Uses ticket inner page channel
        const innerChannel = ably.channels.get(`ticket-${ticket.id}`);
        await innerChannel.publish('ticket-closed', ticketWithName);
        return ticketWithName;
      });
    }),

  requeueTickets: protectedStaffProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const requeuedTickets: Ticket[] = [];

      for (const ticketId of input.ticketIds) {
        const ticket: Ticket = await ctx.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.OPEN },
        });
        requeuedTickets.push(ticket);
      }

      await convertTicketToTicketWithNames(requeuedTickets, ctx).then(async tickets => {
        const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
        const channel = ably.channels.get('tickets'); // Change to include queue id
        await channel.publish('tickets-requeued', tickets);

        // Uses ticket inner page channel
        for (const ticket of tickets) {
          const channel = ably.channels.get(`ticket-${ticket.id}`);
          await channel.publish('ticket-requeued', ticket);
        }
        return tickets;
      });
    }),

  reopenTickets: protectedStaffProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const reopenedTickets: Ticket[] = [];

      for (const ticketId of input.ticketIds) {
        const ticket: Ticket = await ctx.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.OPEN },
        });
        reopenedTickets.push(ticket);
      }

      await convertTicketToTicketWithNames(reopenedTickets, ctx).then(async tickets => {
        const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
        const channel = ably.channels.get('tickets'); // Change to include queue id
        await channel.publish('tickets-reopened', tickets);

        // Uses ticket inner page channel
        for (const ticket of tickets) {
          const channel = ably.channels.get(`ticket-${ticket.id}`);
          await channel.publish('ticket-reopened', ticket);
        }
        return tickets;
      });
    }),

  sendChatMessage: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        message: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const chatMessage = await ctx.prisma.chatMessage.create({
        data: {
          message: input.message,
          author: {
            connect: {
              id: ctx.session?.user?.id,
            },
          },
          ticket: {
            connect: {
              id: input.ticketId,
            },
          },
        },
      });

      // Add userName to the chatMessage
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: ctx.session?.user?.id,
        },
      });
      const chatMessageWithUserName: ChatMessageWithUserName = {
        ...chatMessage,
        userName: user?.name!,
      };

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get(`ticket-${input.ticketId}`);
      await channel.publish('chat-message', chatMessageWithUserName);
      return chatMessage;
    }),

  clearQueue: protectedStaffProcedure.mutation(async ({ ctx }) => {
    // Closes all open, pending, and assigned tickets.
    // Note: This is slower than using updateMany but it allows us to push to Ably
    const closedTickets: Ticket[] = [];

    const tickets = await ctx.prisma.ticket.findMany({
      where: {
        status: {
          in: [TicketStatus.OPEN, TicketStatus.PENDING, TicketStatus.ASSIGNED],
        },
      },
    });

    for (const ticket of tickets) {
      const closedTicket: Ticket = await ctx.prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.CLOSED },
      });
      closedTickets.push(closedTicket);
    }

    await convertTicketToTicketWithNames(closedTickets, ctx).then(async tickets => {
      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets'); // Change to include queue id
      await channel.publish('all-tickets-closed', tickets);

      for (const ticket of tickets) {
        const channel = ably.channels.get(`ticket-${ticket.id}`);
        await channel.publish('ticket-closed', ticket);
      }
      return tickets;
    });
  }),

  setStaffNotes: protectedStaffProcedure
    .input(
      z.object({
        ticketId: z.number(),
        notes: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const ticket = await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: { staffNotes: input.notes },
      });

      await convertTicketToTicketWithNames([ticket], ctx).then(async tickets => {
        const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);

        // Uses ticket inner page channel
        for (const ticket of tickets) {
          const channel = ably.channels.get(`ticket-${ticket.id}`);
          await channel.publish('ticket-staffnote', ticket);
        }
        return tickets;
      });
    }),

  getTicket: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const ticket: Ticket | null = await ctx.prisma.ticket.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!ticket) {
        return null;
      }

      const ticketsWithNames: TicketWithNames[] = await convertTicketToTicketWithNames([ticket], ctx);

      return ticketsWithNames[0];
    }),

  getTicketsWithStatus: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(TicketStatus),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tickets = await ctx.prisma.ticket.findMany({
        where: {
          status: input.status,
        },
      });

      const ticketsWithNames: TicketWithNames[] = await convertTicketToTicketWithNames(tickets, ctx);

      return ticketsWithNames;
    }),

  getTicketsWithUserId: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        shouldSortByCreatedAt: z.boolean().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const helpedTicketsNoName = await ctx.prisma.ticket.findMany({
        where: {
          helpedByUserId: input.userId,
        },
        ...(input.shouldSortByCreatedAt && { orderBy: { createdAt: 'desc' } }),
      });

      const createdTicketsNoName = await ctx.prisma.ticket.findMany({
        where: {
          createdByUserId: input.userId,
        },
		...(input.shouldSortByCreatedAt && { orderBy: { createdAt: 'desc' } }),
      });

      const createdTickets = await convertTicketToTicketWithNames(createdTicketsNoName, ctx);
      const helpedTickets = await convertTicketToTicketWithNames(helpedTicketsNoName, ctx);

      return {
        helpedTickets,
        createdTickets,
      };
    }),

  getChatMessages: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const messages: ChatMessage[] = await ctx.prisma.chatMessage.findMany({
        where: {
          ticketId: input.ticketId,
        },
      });

      //   Add user name to each message
      const messagesWithUser: ChatMessageWithUserName[] = await Promise.all(
        messages.map(async (message: ChatMessage) => {
          const user = await ctx.prisma.user.findUnique({
            where: {
              id: message.userId,
            },
          });
          return {
            ...message,
            userName: user?.name!,
          };
        }),
      );

      messagesWithUser.sort((a, b) => {
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      return messagesWithUser;
    }),
});

const convertTicketToTicketWithNames = async (tickets: Ticket[], ctx: any) => {
  const ticketsWithNames: TicketWithNames[] = await Promise.all(
    tickets.map(async (ticket: Ticket) => {
      const location: Location = await ctx.prisma.location.findUnique({
        where: {
          id: ticket.locationId,
        },
      });
      const assignment: Assignment = await ctx.prisma.assignment.findUnique({
        where: {
          id: ticket.assignmentId,
        },
      });
      let helpedBy: User | undefined = undefined;
      if (ticket.helpedByUserId) {
        helpedBy = await ctx.prisma.user.findUnique({
          where: {
            id: ticket.helpedByUserId,
          },
        });
      }
      const createdBy: User = await ctx.prisma.user.findUnique({
        where: {
          id: ticket.createdByUserId,
        },
      });
      return {
        ...ticket,
        locationName: location?.name,
        assignmentName: assignment?.name,
        helpedByName: helpedBy?.name,
        createdByName: createdBy.name,
      };
    }),
  );

  return ticketsWithNames;
};

export interface ChatMessageWithUserName extends ChatMessage {
  userName: string;
}

// Includes the name of users, location, and assignment
export interface TicketWithNames extends Ticket {
  helpedByName: string | null | undefined;
  createdByName: string | null;
  assignmentName: string;
  locationName: string;
}
