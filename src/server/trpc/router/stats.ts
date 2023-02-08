import { router, publicProcedure } from '../trpc';

export const statsRouter = router({
  getTicketStats: publicProcedure.query(async ({ ctx }) => {
    // Only return the createdAt, helpedAt, and resolvedAt fields
    //  if all three are not present
    return ctx.prisma.ticket.findMany({
      select: {
        createdAt: true,
        helpedAt: true,
        resolvedAt: true,
      },
    });
  }),
});
