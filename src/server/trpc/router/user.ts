import { router, protectedStaffProcedure } from '../trpc';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const userRouter = router({
  addUsers: protectedStaffProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.nativeEnum(UserRole),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.confirmedUser.create({
        data: {
          email: input.email,
          role: input.role,
        },
      });
      return user;
    }),
});
