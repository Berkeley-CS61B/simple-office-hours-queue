// src/server/trpc/router/_app.ts
import { router } from "../trpc";
import { adminRouter } from "./admin";
import { ticketRouter } from "./ticket";
import { userRouter } from "./user";

export const appRouter = router({
  user: userRouter,
  admin: adminRouter,
  ticket: ticketRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
