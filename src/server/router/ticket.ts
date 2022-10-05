import { createRouter } from './context';
import { z } from 'zod';
import Ably from 'ably/promises';
import { Assignment, ChatMessage, Location, Ticket, TicketStatus, User } from '@prisma/client';

export const ticketRouter = createRouter()
  .mutation('createTicket', {
    input: z.object({
      description: z
        .string()
        .min(1)
        .max(1000)
        .optional(),
      assignmentId: z.number(),
      locationId: z.number(),
    }),
    async resolve({ input, ctx }) {
      const { description, assignmentId, locationId } = input;
      const ticket = await ctx.prisma.ticket
        .create({
          data: {
            description,
            assignment: {
              connect: {
                id: assignmentId,
              },
            },
            location: {
              connect: {
                id: locationId,
              },
            },
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
