// src/server/trpc/router/_app.ts
import { router } from "../trpc";
import { adminRouter } from "./admin";
import { queueRouter } from "./queue";
import { statsRouter } from "./stats";
import { ticketRouter } from "./ticket";
import { userRouter } from "./user";

export const appRouter = router({
  admin: adminRouter,
  ticket: ticketRouter,
  user: userRouter,
  queue: queueRouter,
  stats: statsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
