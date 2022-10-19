import { router, protectedStaffProcedure } from '../trpc';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const userRouter = router({
  addUsers: protectedStaffProcedure
    .input(
      z.array(
        z.object({
          email: z.string().email(),
          role: z.nativeEnum(UserRole),
        }),
      ),
    )
    .mutation(async ({ input, ctx }) => {
      const users = await ctx.prisma.confirmedUser.createMany({
        data: input,
        skipDuplicates: true,
      });
      return users;
    }),
});
