import { router, publicProcedure, protectedNotStudentProcedure } from '../trpc';
import { TicketStatus, TicketType } from '@prisma/client';
import { z } from 'zod';

export const statsRouter = router({
  getTicketStats: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.ticket.findMany({
      select: {
        createdAt: true,
        helpedAt: true,
        resolvedAt: true,
        status: true,
        ticketType: true,
        description: true,
        isPublic: true,
        locationId: true,
		    assignmentId: true,
      },
    });
  }),
  getInfiniteTicketStats: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(10000).nullish(),
      cursor: z.number().nullish(),
    }))
    .query(async ({ input, ctx }) => {
      const limit = input.limit ?? 1000;
      const { cursor } = input;
      const items = await ctx.prisma.ticket.findMany({
        take: limit + 1,
        select: {
          id: true,
          createdAt: true,
          helpedAt: true,
          resolvedAt: true,
          status: true,
          ticketType: true,
          description: true,
          isPublic: true,
          locationId: true,
          assignmentId: true,
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          id: 'asc',
        },
      })
      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop()
        nextCursor = nextItem?.id;
      }
      return {
        items,
        nextCursor,
      };
    }
  ),
  getTicketStatsHelpedByUser: protectedNotStudentProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.ticket.findMany({
        select: {
          createdAt: true,
          helpedAt: true,
          resolvedAt: true,
          status: true,
          ticketType: true,
          description: true,
          isPublic: true,
          locationId: true,
          assignmentId: true,
        },
        where: {
          helpedByUserId: ctx.session?.user?.id
        },
      });
    }
  ),
  getInfiniteTicketStatsHelpedByUser: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(10000).nullish(),
      cursor: z.number().nullish(),
    }))
    .query(async ({ input, ctx }) => {
      const limit = input.limit ?? 1000;
      const { cursor } = input;
      const items = await ctx.prisma.ticket.findMany({
        take: limit + 1,
        select: {
          id: true,
          createdAt: true,
          helpedAt: true,
          resolvedAt: true,
          status: true,
          ticketType: true,
          description: true,
          isPublic: true,
          locationId: true,
          assignmentId: true,
        },
        where: {
          helpedByUserId: ctx.session?.user?.id
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          id: 'asc',
        },
      })
      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop()
        nextCursor = nextItem?.id;
      }
      return {
        items,
        nextCursor,
      };
    }
  ),
});

export interface TicketStats {
  createdAt: Date | null,
  helpedAt: Date | null,
  resolvedAt: Date | null,
  status: TicketStatus,
  ticketType: TicketType,
  description: string | null,
  isPublic: boolean,
  locationId: number,
  assignmentId: number,
}