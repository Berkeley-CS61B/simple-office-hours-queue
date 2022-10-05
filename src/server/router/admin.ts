import { createRouter } from './context';
import { z } from 'zod';

export const adminRouter = createRouter()
.mutation('createAssigmnent', {
  input: z.object({
    name: z.string(),
  }),
  async resolve({ input, ctx }) {},
});
