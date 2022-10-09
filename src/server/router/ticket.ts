import { createRouter } from './context';
import { z } from 'zod';
import Ably from 'ably/promises';
import { Assignment, ChatMessage, Location, Ticket, TicketStatus, User } from '@prisma/client';

export const ticketRouter = createRouter()
  .mutation('createTicket', {
    input: z.object({
      description: z.string().optional(),
      assignmentId: z.number(),
      locationId: z.number(),
    }),
    async resolve({ ctx, input }) {
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
        },
      });

      const ticketWithNames: TicketWithNames[] = await convertTicketToTicketWithNames([ticket], ctx);

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets');
      await channel.publish('new-ticket', ticketWithNames[0]);

      return ticketWithNames[0];
    },
  })
  // Concierge can approve a ticket
  .mutation('approveTickets', {
    input: z.object({
      ticketIds: z.array(z.number()),
    }),
    async resolve({ input, ctx }) {
      const approvedTickets: Ticket[] = [];

      for (const ticketId of input.ticketIds) {
        const ticket: Ticket = await ctx.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.OPEN },
        });
        approvedTickets.push(ticket);
      }

      await convertTicketToTicketWithNames(approvedTickets, ctx).then(tickets => {
        const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
        const channel = ably.channels.get('tickets'); // Change to include queue id
        channel.publish('tickets-approved', tickets);

        // Uses ticket inner page channel
        for (const ticket of tickets) {
          const channel = ably.channels.get(`ticket-${ticket.id}`);
          channel.publish('ticket-approved', ticket);
        }
        return tickets;
      });
    },
  })
  .mutation('assignTickets', {
    input: z.object({
      ticketIds: z.array(z.number()),
    }),
    async resolve({ input, ctx }) {
      const assignedTickets: Ticket[] = [];

      for (const ticketId of input.ticketIds) {
        const ticket: Ticket = await ctx.prisma.ticket.update({
          where: { id: ticketId },
          data: {
            status: TicketStatus.ASSIGNED,
            helpedBy: {
              connect: {
                id: ctx.session?.user?.id,
              },
            },
          },
        });
        assignedTickets.push(ticket);
      }

      await convertTicketToTicketWithNames(assignedTickets, ctx).then(tickets => {
        const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
        const channel = ably.channels.get('tickets'); // Change to include queue id
        channel.publish('tickets-assigned', tickets);

        // Uses ticket inner page channel
        for (const ticket of tickets) {
          const channel = ably.channels.get(`ticket-${ticket.id}`);
          channel.publish('ticket-assigned', ticket);
        }
        return tickets;
      });
    },
  })
  .mutation('resolveTickets', {
    input: z.object({
      ticketIds: z.array(z.number()),
    }),
    async resolve({ input, ctx }) {
      const resolvedTickets: Ticket[] = [];

      for (const ticketId of input.ticketIds) {
        const ticket: Ticket = await ctx.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.RESOLVED },
        });
        resolvedTickets.push(ticket);
      }

      await convertTicketToTicketWithNames(resolvedTickets, ctx).then(tickets => {
        const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
        const channel = ably.channels.get('tickets'); // Change to include queue id
        channel.publish('tickets-resolved', tickets);

        // Uses ticket inner page channel
        for (const ticket of tickets) {
          const channel = ably.channels.get(`ticket-${ticket.id}`);
          channel.publish('ticket-resolved', ticket);
        }
        return tickets;
      });
    },
  })
  .mutation('requeueTickets', {
    input: z.object({
      ticketIds: z.array(z.number()),
    }),
    async resolve({ input, ctx }) {
      const requeuedTickets: Ticket[] = [];

      for (const ticketId of input.ticketIds) {
        const ticket: Ticket = await ctx.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.OPEN },
        });
        requeuedTickets.push(ticket);
      }

      await convertTicketToTicketWithNames(requeuedTickets, ctx).then(tickets => {
        const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
        const channel = ably.channels.get('tickets'); // Change to include queue id
        channel.publish('tickets-requeued', tickets);

        // Uses ticket inner page channel
        for (const ticket of tickets) {
          const channel = ably.channels.get(`ticket-${ticket.id}`);
          channel.publish('ticket-requeued', ticket);
        }
        return tickets;
      });
    },
  })
  .mutation('reopenTickets', {
    input: z.object({
      ticketIds: z.array(z.number()),
    }),
    async resolve({ input, ctx }) {
      const reopenedTickets: Ticket[] = [];

      for (const ticketId of input.ticketIds) {
        const ticket: Ticket = await ctx.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.OPEN },
        });
        reopenedTickets.push(ticket);
      }

      await convertTicketToTicketWithNames(reopenedTickets, ctx).then(tickets => {
        const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
        const channel = ably.channels.get('tickets'); // Change to include queue id
        channel.publish('tickets-reopened', tickets);

        // Uses ticket inner page channel
        for (const ticket of tickets) {
          const channel = ably.channels.get(`ticket-${ticket.id}`);
          channel.publish('ticket-reopened', ticket);
        }
        return tickets;
      });
    },
  })
  .mutation('sendChatMessage', {
    input: z.object({
      ticketId: z.number(),
      message: z.string(),
    }),
    async resolve({ input, ctx }) {
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
      channel.publish('chat-message', chatMessageWithUserName);
      return chatMessage;
    },
  })
  .query('getTicket', {
    input: z.object({
      id: z.number(),
    }),
    async resolve({ input, ctx }) {
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
    },
  })
  .query('getTicketsWithStatus', {
    input: z.object({
      status: z.nativeEnum(TicketStatus),
    }),
    async resolve({ input, ctx }) {
      const tickets = await ctx.prisma.ticket.findMany({
        where: {
          status: input.status,
        },
      });

      const ticketsWithNames: TicketWithNames[] = await convertTicketToTicketWithNames(tickets, ctx);

      return ticketsWithNames;
    },
  })
  .query('getChatMessages', {
    input: z.object({
      ticketId: z.number(),
    }),
    async resolve({ input, ctx }) {
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
    },
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
