import { router, protectedStaffProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const queueRouter = router({
  getQueueByName: protectedProcedure
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

  getCurrentUserQueue: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.personalQueue.findFirst({
      where: {
        owner: {
          id: ctx.session.user.id,
        },
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
      // Dont allow users to create a queue with the same name as an existing queue
      // or if they already have a queue
      const queueExists = await ctx.prisma.personalQueue.findFirst({
        where: {
          OR: [
            { name: input.name },
            {
              owner: { id: ctx.session.user.id },
            },
          ],
        },
      });

      if (queueExists) {
        throw new Error('Queue already exists');
      }

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
