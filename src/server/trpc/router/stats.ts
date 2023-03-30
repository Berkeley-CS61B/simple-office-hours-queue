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
    }),
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