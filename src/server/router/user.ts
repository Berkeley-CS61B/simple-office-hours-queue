import { createRouter } from './context';
import { z } from 'zod';

export const userRouter = createRouter()
  .query('getUserRole', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input, ctx }) {
      const fullUser = await ctx.prisma.user.findFirst({
        where: {
          id: input.id,
        },
      });
      return fullUser?.role;
    },
  })
  .query('getUserName', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input, ctx }) {
      const fullUser = await ctx.prisma.user.findFirst({
        where: {
          id: input.id,
        },
      });
      return fullUser?.name;
    },
  });
