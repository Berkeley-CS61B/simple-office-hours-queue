import { createRouter } from './context';
import { z } from 'zod';

export const adminRouter = createRouter()
  .mutation('createAssigmnent', {
    input: z.object({
      name: z.string(),
    }),
    async resolve({ input, ctx }) {
      return ctx.prisma.assignment.create({
        data: {
          name: input.name,
        },
      });
    },
  })
  .mutation('createLocation', {
    input: z.object({
      name: z.string(),
    }),
    async resolve({ input, ctx }) {
      return ctx.prisma.location.create({
        data: {
          name: input.name,
        },
      });
    },
  })
  .query('getAllAssignments', {
    async resolve({ ctx }) {
      return ctx.prisma.assignment.findMany();
    },
  })
  .query('getActiveAssignments', {
    async resolve({ ctx }) {
      const assignment = await ctx.prisma.assignment.findMany({
        where: {
          active: true,
        },
      });
      return assignment;
    },
  })
  .query('getAllLocations', {
    async resolve({ ctx }) {
      return ctx.prisma.location.findMany();
    },
  })
  .query('getActiveLocations', {
    async resolve({ ctx }) {
      return ctx.prisma.location.findMany({
        where: {
          active: true,
        },
      });
    },
  });
