import { router, protectedStaffProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const queueRouter = router({
  getQueue: protectedProcedure
    .input(
      z.object({
        queueName: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return ctx.prisma.personalQueue.findUnique({
        where: {
          name: input.queueName,
        },
      });
    }),

  createQueue: protectedStaffProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.personalQueue.create({
        data: {
          name: input.name,
          owner: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });
    }),

  openOrCloseQueue: protectedStaffProcedure
    .input(
      z.object({
        queueName: z.string(),
        shouldOpen: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.personalQueue.update({
        where: {
          name: input.queueName,
        },
        data: {
          isOpen: input.shouldOpen,
        },
      });
    }),
});
