import { router, publicProcedure } from '../trpc';

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
      },
    });
  }),
});
