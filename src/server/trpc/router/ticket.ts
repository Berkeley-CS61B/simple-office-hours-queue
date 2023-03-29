import Ably from 'ably/promises';
import {
  Assignment,
  ChatMessage,
  Location,
  SiteSettings,
  SiteSettingsValues,
  Ticket,
  TicketStatus,
  TicketType,
  User,
  UserRole,
} from '@prisma/client';
import { router, protectedProcedure, protectedStaffProcedure, protectedNotStudentProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCClientError } from '@trpc/client';

export const ticketRouter = router({
  createTicket: protectedProcedure
    .input(
      z.object({
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
        assignmentId: z.number(),
        locationId: z.number(),
        locationDescription: z.string().optional(),
        personalQueueName: z.string().optional(),
        ticketType: z.nativeEnum(TicketType),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Limits students to 1 ticket at a time per queue
      const doesStudentHaveActiveTicket = await ctx.prisma.ticket.findFirst({
        where: {
          createdByUserId: ctx.session.user.id,
          OR: [
            { status: TicketStatus.PENDING },
            { status: TicketStatus.OPEN },
            { status: TicketStatus.ASSIGNED },
            { status: TicketStatus.ABSENT },
          ],
          ...(input.personalQueueName ? { personalQueueName: input.personalQueueName } : { personalQueueName: null }),
          ...(input.personalQueueName && { personalQueueName: input.personalQueueName }),
        },
      });

      const isQueueOpen = await ctx.prisma.settings.findFirst({
        where: { setting: SiteSettings.IS_QUEUE_OPEN },
      });

      if (input.personalQueueName) {
        // TODO: Check if personal queue is open and reassign isQueueOpen
      }

      // When you're not on a personal queue, make sure the queue is open
      if (
        input.personalQueueName === undefined &&
        isQueueOpen?.value === SiteSettingsValues.FALSE &&
        ctx.session.user.role === UserRole.STUDENT
      ) {
        return;
      }

      if (doesStudentHaveActiveTicket && ctx.session.user.role === UserRole.STUDENT) {
        return;
      }

      const pendingStageEnabled = await ctx.prisma.settings.findUnique({
        where: {
          setting: SiteSettings.IS_PENDING_STAGE_ENABLED,
        },
      });

      const assignment = await ctx.prisma.assignment.findUnique({
        where: {
          id: input.assignmentId,
        },
      });

      if (!assignment || !assignment.isActive) {
        return;
      }

      // If a ticket is made with a priority assigment, it's a priority ticket
      const isPriority = assignment?.isPriority;

      const ticket = await ctx.prisma.ticket.create({
        data: {
          description: input.description,
          isPublic: input.isPublic ?? false,
          locationDescription: input.locationDescription,
          usersInGroup: input.isPublic ? { connect: [{ id: ctx.session.user.id }] } : undefined,
          isPriority: isPriority,
          ticketType: input.ticketType,
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
          // If personal queue name is provided, connect to it
          ...(input.personalQueueName && {
            PersonalQueue: {
              connect: {
                name: input.personalQueueName,
              },
            },
          }),
        },
      });

      // Add the ticket to User.ticketsJoined if it is public
      if (input.isPublic) {
        await ctx.prisma.user.update({
          where: { id: ctx.session.user.id },
          data: {
            ticketsJoined: { connect: { id: ticket.id } },
          },
        });
      }

      const ticketWithNames: TicketWithNames[] = await convertTicketToTicketWithNames([ticket], ctx);

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      await channel.publish('new-ticket', undefined);

      /***** Removing staff broadcast for now *****/
      //   if (isPriority && ticket.personalQueueId === null) {
      //     const staffChannel = ably.channels.get('staff-broadcast');
      //     await staffChannel.publish('tickets-marked-as-priority', 'There is a new priority ticket');
      //   }

      return ticketWithNames[0];
    }),

  editTicketDescription: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        description: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.update({
        where: {
          id: input.ticketId,
        },
        data: {
          description: input.description,
        },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const ticketChannel = ably.channels.get(`ticket-${input.ticketId}`);
      await ticketChannel.publish('ticket-description-changed', undefined);

      const channel = ably.channels.get(`tickets`);
      await channel.publish('ticket-description-changed', undefined);
    }),

  editTicketLocationDescription: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        locationDescription: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.update({
        where: {
          id: input.ticketId,
        },
        data: {
          locationDescription: input.locationDescription,
        },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const ticketChannel = ably.channels.get(`ticket-${input.ticketId}`);
      await ticketChannel.publish('ticket-location-description-changed', undefined);
    }),

  approveTickets: protectedStaffProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.updateMany({
        where: { id: { in: input.ticketIds } },
        data: { status: TicketStatus.OPEN },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      await channel.publish('tickets-approved', undefined);

      // Use inner ticket channel
      for (const id of input.ticketIds) {
        const channel = ably.channels.get(`ticket-${id}`);
        await channel.publish('ticket-approved', undefined);
      }
    }),

  assignTickets: protectedNotStudentProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const ticketsToAssign: number[] = [];
      for (const ticketId of input.ticketIds) {
        const ticket = await ctx.prisma.ticket.findFirst({
          where: { id: ticketId },
        });
        // If the ticket is already assigned, skip it
        if (!ticket || ticket?.status === TicketStatus.ASSIGNED) {
          break;
        }
        ticketsToAssign.push(ticket.id);
      }

      for (const ticketId of ticketsToAssign) {
        // updateMany is not working here, so we have to use update
        await ctx.prisma.ticket.update({
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
      }

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      await channel.publish('tickets-assigned', undefined);

      // Uses ticket inner page channel
      for (const id of ticketsToAssign) {
        const channel = ably.channels.get(`ticket-${id}`);
        await channel.publish('ticket-assigned', undefined);
      }

      return ticketsToAssign;
    }),

  // Assigns a ticket to the current user
  takeOverTicket: protectedNotStudentProcedure
    .input(
      z.object({
        ticketId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
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

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      channel.publish('tickets-assigned', undefined);

      // Uses ticket inner page channel
      const ticketChannel = ably.channels.get(`ticket-${input.ticketId}`);
      ticketChannel.publish('ticket-assigned', undefined);
    }),

  resolveTickets: protectedNotStudentProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.updateMany({
        where: { id: { in: input.ticketIds } },
        data: { status: TicketStatus.RESOLVED, resolvedAt: new Date() },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      await channel.publish('tickets-resolved', undefined);

      // Uses ticket inner page channel
      for (const id of input.ticketIds) {
        const channel = ably.channels.get(`ticket-${id}`);
        await channel.publish('ticket-resolved', undefined);
      }
    }),

  markAsAbsent: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        markOrUnmark: z.boolean(), // True for mark, false for unmark
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: { status: input.markOrUnmark ? TicketStatus.ABSENT : TicketStatus.OPEN, markedAbsentAt: new Date() },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      await channel.publish('tickets-marked-as-absent', undefined);

      // Uses ticket inner page channel
      const innerChannel = ably.channels.get(`ticket-${input.ticketId}`);
      await innerChannel.publish('ticket-marked-as-absent', undefined);
    }),

  markAsPriority: protectedNotStudentProcedure
    .input(
      z.object({
        ticketId: z.number(),
        isPriority: z.boolean(), // True for mark, false for unmark
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: { isPriority: input.isPriority },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      await channel.publish('tickets-marked-as-priority', undefined);

      const ticketChannel = ably.channels.get(`ticket-${input.ticketId}`);
      await ticketChannel.publish('ticket-marked-as-priority', undefined);

      /***** Removing staff broadcast for now *****/

      //   if (input.isPriority && ticket.personalQueueId === null) {
      //       const staffChannel = ably.channels.get('staff-broadcast');
      //       await staffChannel.publish('tickets-marked-as-priority', 'There is a new priority ticket');
      //   }
    }),

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

      // We only allow the creator of the ticket to close it
      if (ticket?.createdByUserId !== ctx.session?.user?.id && ctx.session?.user?.role !== UserRole.STAFF) {
        throw new TRPCClientError('You are not authorized to close this ticket');
      }

      await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: { status: TicketStatus.CLOSED },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      await channel.publish('ticket-closed', undefined);

      // Uses ticket inner page channel
      const innerChannel = ably.channels.get(`ticket-${input.ticketId}`);
      await innerChannel.publish('ticket-closed', undefined);
    }),

  requeueTickets: protectedNotStudentProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      for (const ticketId of input.ticketIds) {
        await ctx.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.OPEN },
        });
      }

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      await channel.publish('tickets-requeued', undefined);

      // Uses ticket inner page channel
      for (const id of input.ticketIds) {
        const channel = ably.channels.get(`ticket-${id}`);
        await channel.publish('ticket-requeued', undefined);
      }
    }),

  reopenTickets: protectedNotStudentProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.updateMany({
        where: { id: { in: input.ticketIds } },
        data: { status: TicketStatus.OPEN },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      await channel.publish('tickets-reopened', undefined);

      // Uses ticket inner page channel
      for (const id of input.ticketIds) {
        const channel = ably.channels.get(`ticket-${id}`);
        await channel.publish('ticket-reopened', undefined);
      }
    }),

  joinTicketGroup: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: {
          usersInGroup: {
            connect: {
              id: ctx.session?.user?.id,
            },
          },
        },
      });

      await ctx.prisma.user.update({
        where: { id: ctx.session?.user?.id },
        data: {
          ticketsJoined: {
            connect: {
              id: input.ticketId,
            },
          },
        },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      await channel.publish('ticket-joined', { id: input.ticketId });

      // Uses ticket inner page channel
      const innerChannel = ably.channels.get(`ticket-${input.ticketId}`);
      await innerChannel.publish('ticket-joined', { id: input.ticketId });
    }),

  leaveTicketGroup: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: {
          usersInGroup: {
            disconnect: {
              id: ctx.session?.user?.id,
            },
          },
        },
      });

      await ctx.prisma.user.update({
        where: { id: ctx.session?.user?.id },
        data: {
          ticketsJoined: {
            disconnect: {
              id: input.ticketId,
            },
          },
        },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      await channel.publish('ticket-left', { id: input.ticketId });

      // Uses ticket inner page channel
      const innerChannel = ably.channels.get(`ticket-${input.ticketId}`);
      await innerChannel.publish('ticket-left', { id: input.ticketId });
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
        userName: user?.preferredName ?? user?.name!,
        userRole: user?.role!,
      };

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get(`ticket-${input.ticketId}`);
      await channel.publish('chat-message', chatMessageWithUserName);
      return chatMessage;
    }),

  clearQueue: protectedStaffProcedure
    .input(
      z.object({
        personalQueueName: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Closes all open, pending, and assigned tickets.

      // Get tickets for pushing to Ably
      const tickets = await ctx.prisma.ticket.findMany({
        where: {
          status: {
            in: [TicketStatus.OPEN, TicketStatus.PENDING, TicketStatus.ASSIGNED, TicketStatus.ABSENT],
          },
          ...(input.personalQueueName ? { personalQueueName: input.personalQueueName } : { personalQueueName: null }),
        },
      });

      // Close tickets
      await ctx.prisma.ticket.updateMany({
        where: {
          status: {
            in: [TicketStatus.OPEN, TicketStatus.PENDING, TicketStatus.ASSIGNED, TicketStatus.ABSENT],
          },
          ...(input.personalQueueName ? { personalQueueName: input.personalQueueName } : { personalQueueName: null }),
        },
        data: {
          status: TicketStatus.CLOSED,
        },
      });

      // Push to Ably
      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      await channel.publish('all-tickets-closed', undefined);

      for (const ticket of tickets) {
        const channel = ably.channels.get(`ticket-${ticket.id}`);
        await channel.publish('ticket-closed', undefined);
      }
    }),

  setStaffNotes: protectedNotStudentProcedure
    .input(
      z.object({
        ticketId: z.number(),
        notes: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: { staffNotes: input.notes },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);

      // Uses ticket inner page channel
      const channel = ably.channels.get(`ticket-${input.ticketId}`);
      await channel.publish('ticket-staffnote', undefined);
    }),

  toggleIsPublic: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        isPublic: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: { isPublic: input.isPublic },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      await channel.publish('ticket-toggle-public', undefined);

      // Uses ticket inner page channel
      const innerChannel = ably.channels.get(`ticket-${input.ticketId}`);
      await innerChannel.publish('ticket-toggle-public', undefined);
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
        personalQueueName: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tickets = await ctx.prisma.ticket.findMany({
        where: {
          status: input.status,
          // If personal queue name is provided, only return tickets that are in that queue.
          // Otherwise, return all tickets with the given status where the queue is not personal.
          ...(input.personalQueueName ? { personalQueueName: input.personalQueueName } : { personalQueueName: null }),
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

  getUsersInTicketGroup: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          ticketsJoined: {
            some: { id: input.ticketId },
          },
        },
      });

      return users;
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
            userName: user?.preferredName ?? user?.name!,
            userRole: user?.role!,
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
        helpedByName: helpedBy?.preferredName ?? helpedBy?.name,
        createdByName: createdBy?.preferredName ?? createdBy.name,
        createdByEmail: createdBy.email,
      };
    }),
  );

  return ticketsWithNames;
};

export interface ChatMessageWithUserName extends ChatMessage {
  userName: string;
  userRole: UserRole;
}

// Includes the name of users, location, and assignment
export interface TicketWithNames extends Ticket {
  helpedByName: string | null | undefined;
  createdByName: string | null;
  createdByEmail: string | null;
  assignmentName: string;
  locationName: string;
}
