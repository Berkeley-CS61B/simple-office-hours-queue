// src/server/trpc/router/_app.ts
import { router } from "../trpc";
import { adminRouter } from "./admin";
import { queueRouter } from "./queue";
import { ticketRouter } from "./ticket";
import { userRouter } from "./user";

export const appRouter = router({
  admin: adminRouter,
  ticket: ticketRouter,
  user: userRouter,
  queue: queueRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
