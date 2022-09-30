import { createRouter } from "./context";
import { z } from "zod";
import Ably from "ably/promises";
import { TicketStatus } from "@prisma/client";

export const ticketRouter = createRouter()
  .mutation("createTicket", {
    input: z.object({
      description: z.string().min(1).max(1000).optional(),
      assignment: z.string().min(1).max(250),
      location: z.string().min(1).max(250),
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
        .then((ticket) => {
          const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
          const channel = ably.channels.get("tickets"); // Change to include queue id
          channel.publish("new-ticket", ticket);
        });
      return ticket;
    },
  })
  // Concierge can approve a ticket
  .mutation("approveTicket", {
    input: z.object({
      id: z.number(),
    }),
    async resolve({ input, ctx }) {
      const { id } = input;
      const ticket = await ctx.prisma.ticket.update({
        where: {
          id,
        },
        data: {
          status: TicketStatus.OPEN,
        },
      }).then(() => {
		// console.log("changed")
		const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
		const channel = ably.channels.get("tickets"); // Change to include queue id
		channel.publish("ticket-approved", { id });
	  });
      return ticket;
    },
  })
  .query("getTicketsWithStatus", {
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
  });
