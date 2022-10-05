// src/server/router/index.ts
import { createRouter } from './context';
import superjson from 'superjson';

import { protectedExampleRouter } from './protected-example-router';
import { userRouter } from './user';
import { ticketRouter } from './ticket';
import { adminRouter } from './admin';

export const appRouter = createRouter()
  .transformer(superjson)
  .merge('user.', userRouter)
  .merge('ticket.', ticketRouter)
  .merge('auth.', protectedExampleRouter)
  .merge('admin.', adminRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
