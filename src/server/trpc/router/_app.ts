// src/server/trpc/router/_app.ts
import { router } from "../trpc";
import { adminRouter } from "./admin";
import { ticketRouter } from "./ticket";

export const appRouter = router({
  admin: adminRouter,
  ticket: ticketRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
