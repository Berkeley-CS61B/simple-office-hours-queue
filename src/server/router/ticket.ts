import { createRouter } from './context';
import { z } from 'zod';
import Ably from 'ably/promises';
import { ChatMessage, Ticket, TicketStatus } from '@prisma/client';

export const ticketRouter = createRouter()
  .mutation('createTicket', {
    input: z.object({
      description: z
        .string()
        .min(1)
        .max(1000)
        .optional(),
      assignment: z
        .string()
        .min(1)
        .max(250),
      location: z
        .string()
        .min(1)
        .max(250),
    }),
    async resolve({ input, ctx }) {
      const { description, assignment, location } = input;
      const ticket = await ctx.prisma.ticket
        .create({
          data: {
            description,
            assignment,
            location,
            createdBy: {
              connect: {
                id: ctx.session?.user?.id,
              },
            },
          },
        })
        .then(ticket => {
          const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
          const channel = ably.channels.get('tickets'); // Change to include queue id
          channel.publish('new-ticket', ticket);
        });
      return ticket;
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

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets'); // Change to include queue id
      channel.publish('tickets-approved', approvedTickets);

      // Creates channel for each ticket for the inner page
      for (const ticket of approvedTickets) {
        const channel = ably.channels.get(`ticket-${ticket.id}`);
        channel.publish('ticket-approved', ticket);
      }

      return approvedTickets;
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

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets'); // Change to include queue id
      channel.publish('tickets-assigned', assignedTickets);

      // Creates channel for each ticket for the inner page
      for (const ticket of assignedTickets) {
        const channel = ably.channels.get(`ticket-${ticket.id}`);
        channel.publish('ticket-assigned', ticket);
      }

      return assignedTickets;
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

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets'); // Change to include queue id
      channel.publish('tickets-resolved', resolvedTickets);

      // Creates channel for each ticket for the inner page
      for (const ticket of resolvedTickets) {
        const channel = ably.channels.get(`ticket-${ticket.id}`);
        channel.publish('ticket-resolved', ticket);
      }

      return resolvedTickets;
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

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets'); // Change to include queue id
      channel.publish('tickets-requeued', requeuedTickets);

      // Creates channel for each ticket for the inner page
      for (const ticket of requeuedTickets) {
        const channel = ably.channels.get(`ticket-${ticket.id}`);
        channel.publish('ticket-requeued', ticket);
      }

      return requeuedTickets;
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

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('tickets'); // Change to include queue id
      channel.publish('tickets-reopened', reopenedTickets);

      // Creates channel for each ticket for the inner page
      for (const ticket of reopenedTickets) {
        const channel = ably.channels.get(`ticket-${ticket.id}`);
        channel.publish('ticket-reopened', ticket);
      }

      return reopenedTickets;
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

	//   Add userName to the chatMessage
	  const user = await ctx.prisma.user.findUnique({
		  where: {
			  id: ctx.session?.user?.id
		  }
	  })
	  const chatMessageWithUserName : ChatMessageWithUserName = {
		  ...chatMessage,
		  userName: user?.name!
	  }

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get(`ticket-${input.ticketId}`);
      channel.publish('chat-message', chatMessageWithUserName);
      return chatMessage;
    },
  })
  .mutation('editInfo', {
    input: z.object({
      id: z.number(),
      description: z
        .string()
        .min(1)
        .max(1000),
      assignment: z
        .string()
        .min(1)
        .max(250),
      location: z
        .string()
        .min(1)
        .max(250),
    }),
    async resolve({ input, ctx }) {
      const { id, description, assignment, location } = input;
      const ticket = await ctx.prisma.ticket
        .update({
          where: {
            id,
          },
          data: {
            description,
            assignment,
            location,
          },
        })
        .then(ticket => {
          const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
          const channel = ably.channels.get('tickets'); // Change to include queue id
          channel.publish('ticket-edited', ticket);
        });
      return ticket;
    },
  })
  .query('getTicket', {
    input: z.object({
      id: z.number(),
    }),
    async resolve({ input, ctx }) {
      const ticket = await ctx.prisma.ticket.findUnique({
        where: {
          id: input.id,
        },
      });

      return ticket;
    },
  })
  .query('getTicketsWithStatus', {
    input: z.object({
      status: z.nativeEnum(TicketStatus),
    }),
    async resolve({ input, ctx }) {
      return ctx.prisma.ticket.findMany({
        where: {
          status: input.status,
        },
      });
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

export interface ChatMessageWithUserName extends ChatMessage {
  userName: string;
}
