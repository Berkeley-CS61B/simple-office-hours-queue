import { createRouter } from './context'
import { z } from 'zod'
import Ably from 'ably/promises'
import { TicketStatus } from '@prisma/client'

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
      console.log('createTicket', ctx.session?.user?.id)
      const { description, assignment, location } = input
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
          const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!)
          const channel = ably.channels.get('tickets') // Change to include queue id
          channel.publish('new-ticket', ticket)
        })
      return ticket
    },
  })
  // Concierge can approve a ticket
  .mutation('approveTickets', {
    input: z.object({
      ticketIds: z.array(z.number()),
    }),
    async resolve({ input, ctx }) {
      const approvedTickets = []

      for (const ticketId of input.ticketIds) {
        const ticket = await ctx.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.OPEN },
        })
        approvedTickets.push(ticket)
      }

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!)
      const channel = ably.channels.get('tickets') // Change to include queue id
      channel.publish('ticket-approved', approvedTickets)

      return approvedTickets
    },
  })
  .mutation('helpTicket', {
    input: z.object({
      id: z.number(),
    }),
    async resolve({ input, ctx }) {
      const { id } = input
      const ticket = await ctx.prisma.ticket
        .update({
          where: { id },
          data: {
            status: TicketStatus.ASSIGNED,
            helpedBy: {
              connect: { id: ctx.session?.user?.id },
            },
          },
        })
        .then(ticket => {
          const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!)
          const channel = ably.channels.get('tickets') // Change to include queue id
          channel.publish('ticket-assigned', ticket)
        })
      return ticket
    },
  })
  .mutation('resolveTicket', {
    input: z.object({
      id: z.number(),
    }),
    async resolve({ input, ctx }) {
      const { id } = input
      const ticket = await ctx.prisma.ticket
        .update({
          where: { id },
          data: { status: TicketStatus.RESOLVED },
        })
        .then(ticket => {
          const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!)
          const channel = ably.channels.get('tickets') // Change to include queue id
          channel.publish('ticket-resolved', ticket)
        })
      return ticket
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
      const { id, description, assignment, location } = input
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
          const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!)
          const channel = ably.channels.get('tickets') // Change to include queue id
          channel.publish('ticket-edited', ticket)
        })
      return ticket
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
      })

      return ticket
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
      })
    },
  })
