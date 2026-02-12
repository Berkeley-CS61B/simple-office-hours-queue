import { TicketStatus } from "@prisma/client";
import { TRPCClientError } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  protectedProcedure,
  protectedStaffProcedure,
  router,
} from "../trpc";

const ensureCanManageQueue = async ({
  queueName,
  ctx,
  ownerOnly,
}: {
  queueName: string;
  ctx: any;
  ownerOnly: boolean;
}) => {
  const queue = await ctx.prisma.personalQueue.findUnique({
    where: { name: queueName },
    select: {
      ownerId: true,
      allowStaffToOpen: true,
    },
  });

  if (!queue) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Queue not found" });
  }

  if (ownerOnly && queue.ownerId !== ctx.session.user.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Only the queue owner can perform this action",
    });
  }

  if (
    !ownerOnly &&
    queue.ownerId !== ctx.session.user.id &&
    !queue.allowStaffToOpen
  ) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message:
        "You are not allowed to open or close this queue unless the owner allows it",
    });
  }
};

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

  // Returns personal queue names mapping to isOpen, and the number of open tickets in each queue
  getPersonalQueueStats: protectedProcedure.query(async ({ ctx }) => {
    const personalQueues = await ctx.prisma.personalQueue.findMany({
      select: {
        name: true,
        isOpen: true,
        Ticket: {
          select: {
            status: true,
          },
          where: {
            status: TicketStatus.OPEN,
          },
        },
      },
    });

    return personalQueues.map((queue) => ({
      queueName: queue.name,
      isQueueOpen: queue.isOpen,
      numOpenTickets: queue.Ticket.length,
    }));
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
        throw new TRPCClientError(
          "Queue with this name already exists or you already have a queue.",
        );
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
      await ensureCanManageQueue({
        queueName: input.queueName,
        ctx,
        ownerOnly: false,
      });

      return ctx.prisma.personalQueue.update({
        where: {
          name: input.queueName,
        },
        data: {
          isOpen: input.shouldOpen,
        },
      });
    }),

  editQueueName: protectedStaffProcedure
    .input(
      z.object({
        queueName: z.string(),
        newName: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ensureCanManageQueue({
        queueName: input.queueName,
        ctx,
        ownerOnly: true,
      });

      // Dont allow users to create a queue with the same name as an existing queue
      const queueExists = await ctx.prisma.personalQueue.findFirst({
        where: { name: input.newName },
      });

      if (queueExists) {
        throw new TRPCClientError("Queue with this name already exists");
      }

      return ctx.prisma.personalQueue.update({
        where: {
          name: input.queueName,
        },
        data: {
          name: input.newName,
        },
      });
    }),

  editAllowStaffToOpen: protectedStaffProcedure
    .input(
      z.object({
        queueName: z.string(),
        allowStaffToOpen: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ensureCanManageQueue({
        queueName: input.queueName,
        ctx,
        ownerOnly: true,
      });

      return ctx.prisma.personalQueue.update({
        where: {
          name: input.queueName,
        },
        data: {
          allowStaffToOpen: input.allowStaffToOpen,
        },
      });
    }),
});
