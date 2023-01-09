import { router, protectedStaffProcedure, protectedProcedure } from '../trpc';
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

  updateUserRole: protectedProcedure.mutation(async ({ ctx }) => {
    const curUserRole = await ctx.prisma.confirmedUser.findUnique({
      where: {
        email: ctx.session.user.email!,
      },
      select: {
        role: true,
      },
    });

    // Delete the user from the 'ConfirmedUser' table since they are now in 'User'
    if (!!curUserRole) {
      await ctx.prisma.confirmedUser.delete({
        where: {
          email: ctx.session.user.email!,
        },
      });
    }

    // Not in the 'ConfirmedUser' table or is a student (no update needed)
    if (!curUserRole || curUserRole.role === UserRole.STUDENT) {
      return null;
    }

    return ctx.prisma.user.update({
      where: {
        email: ctx.session.user.email!,
      },
      data: {
        role: curUserRole?.role,
      },
    });
  }),

  setPreferredName: protectedProcedure
    .input(
      z.object({
        preferredName: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.user.update({
        where: {
          email: ctx.session.user.email!,
        },
        data: {
          preferredName: input.preferredName,
        },
      });
    }),
});
