import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const userRouter = router({
  getUserRole: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const fullUser = await ctx.prisma.user.findFirst({
      where: {
        id: input.id,
      },
    });
    return fullUser?.role;
  }),
  getUserName: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const fullUser = await ctx.prisma.user.findFirst({
      where: {
        id: input.id,
      },
    });
    return fullUser?.name;
  }),
});
