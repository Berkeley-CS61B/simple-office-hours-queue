import {
  Assignment,
  ChatMessage,
  Location,
  SiteSettings,
  SiteSettingsValues,
  Ticket,
  TicketStatus,
  TicketType,
  User,
  UserRole,
  VariableSiteSettings,
} from "@prisma/client";
import { TRPCClientError } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import Ably from "ably/promises";
import { z } from "zod";
import { EMAIL_REGEX } from "../../../utils/constants";
import {
  protectedNotStudentProcedure,
  protectedProcedure,
  protectedStaffProcedure,
  router,
} from "../trpc";

const isPrivilegedRole = (role: UserRole) => {
  return role === UserRole.STAFF || role === UserRole.INTERN;
};

const isUserInTicketGroup = async (
  ticketId: number,
  userId: string,
  ctx: any,
) => {
  const userInGroup = await ctx.prisma.ticket.findFirst({
    where: {
      id: ticketId,
      usersInGroup: {
        some: {
          id: userId,
        },
      },
    },
    select: {
      id: true,
    },
  });
  return !!userInGroup;
};

const getTicketAccessContext = async (ticket: Ticket, ctx: any) => {
  const isPrivileged = isPrivilegedRole(ctx.session.user.role);
  const isOwner = ticket.createdByUserId === ctx.session.user.id;
  const isInGroup =
    !isPrivileged && !isOwner
      ? await isUserInTicketGroup(ticket.id, ctx.session.user.id, ctx)
      : false;

  return {
    isPrivileged,
    isOwner,
    isInGroup,
  };
};

const ensureTicketAccess = async ({
  ticketId,
  ctx,
  allowPublic = true,
  requireParticipant = false,
}: {
  ticketId: number;
  ctx: any;
  allowPublic?: boolean;
  requireParticipant?: boolean;
}) => {
  const ticket = await ctx.prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
  }

  const { isPrivileged, isOwner, isInGroup } = await getTicketAccessContext(
    ticket,
    ctx,
  );
  const canAccess =
    isPrivileged || isOwner || isInGroup || (allowPublic && ticket.isPublic);
  const isParticipant = isPrivileged || isOwner || isInGroup;

  if (!canAccess || (requireParticipant && !isParticipant)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You are not authorized to access this ticket",
    });
  }

  return {
    ticket,
    isPrivileged,
    isOwner,
    isInGroup,
    isParticipant,
  };
};

const sanitizeTicketForStudent = ({
  ticket,
  userId,
  joinedTicketIds,
}: {
  ticket: TicketWithNames;
  userId: string;
  joinedTicketIds: Set<number>;
}) => {
  const isOwner = ticket.createdByUserId === userId;
  const isInGroup = joinedTicketIds.has(ticket.id);
  const canViewPrivateDetails = isOwner || isInGroup;
  const canViewTicketDetails = canViewPrivateDetails || ticket.isPublic;

  return {
    ...ticket,
    createdByUserId: isOwner ? ticket.createdByUserId : "",
    createdByName: canViewPrivateDetails ? ticket.createdByName : null,
    createdByEmail: null,
    createdByPronunciation: null,
    helpedByUserId: canViewPrivateDetails ? ticket.helpedByUserId : null,
    helpedByName: canViewPrivateDetails ? ticket.helpedByName : null,
    description: canViewTicketDetails ? ticket.description : null,
    locationDescription: canViewTicketDetails ? ticket.locationDescription : null,
    staffNotes: null,
  };
};

export const ticketRouter = router({
  createTicket: protectedProcedure
    .input(
      z.object({
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
        assignmentId: z.number(),
        locationId: z.number(),
        locationDescription: z.string().optional(),
        personalQueueName: z.string().optional(),
        ticketType: z.nativeEnum(TicketType),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Limits students to 1 ticket at a time per queue
      const doesStudentHaveActiveTicket = await ctx.prisma.ticket.findFirst({
        where: {
          createdByUserId: ctx.session.user.id,
          OR: [
            { status: TicketStatus.PENDING },
            { status: TicketStatus.OPEN },
            { status: TicketStatus.ASSIGNED },
            { status: TicketStatus.ABSENT },
          ],
          ...(input.personalQueueName
            ? { personalQueueName: input.personalQueueName }
            : { personalQueueName: null }),
          ...(input.personalQueueName && {
            personalQueueName: input.personalQueueName,
          }),
        },
      });

      const isQueueOpen = await ctx.prisma.settings.findFirst({
        where: { setting: SiteSettings.IS_QUEUE_OPEN },
      });

      if (input.personalQueueName) {
        // TODO: Check if personal queue is open and reassign isQueueOpen
      }

      // When you're not on a personal queue, make sure the queue is open
      if (
        input.personalQueueName === undefined &&
        isQueueOpen?.value === SiteSettingsValues.FALSE &&
        ctx.session.user.role === UserRole.STUDENT
      ) {
        return;
      }

      if (
        doesStudentHaveActiveTicket &&
        ctx.session.user.role === UserRole.STUDENT
      ) {
        return;
      }

      const pendingStageEnabled = await ctx.prisma.settings.findUnique({
        where: {
          setting: SiteSettings.IS_PENDING_STAGE_ENABLED,
        },
      });

      const assignment = await ctx.prisma.assignment.findUnique({
        where: {
          id: input.assignmentId,
        },
      });

      if (!assignment || !assignment.isActive) {
        return;
      }

      const location = await ctx.prisma.location.findUnique({
        where: {
          id: input.locationId,
        },
      });

      if (!location || !location.isActive) {
        return;
      }

      const publicTicketsEnabled = await ctx.prisma.settings.findUnique({
        where: {
          setting: SiteSettings.ARE_PUBLIC_TICKETS_ENABLED,
        },
      });

      // Ensure that public tickets are enabled if the ticket is public. This is necessary because
      //  the client might have a stale value for the setting.
      const isPublic =
        publicTicketsEnabled?.value === SiteSettingsValues.TRUE
          ? input.isPublic
          : false;

      // If a ticket is made with a priority assigment, it's a priority ticket
      const isPriority = assignment?.isPriority;

      // Check if the user has made a ticket within the cooldown period
      const cooldownTimeResult = await ctx.prisma.variableSettings.findUnique({
        where: { setting: VariableSiteSettings.COOLDOWN_TIME },
      });

      // in minutes
      const cooldownTime = parseInt(cooldownTimeResult?.value ?? "0");

      const lastTicket = await ctx.prisma.ticket.findFirst({
        where: {
          createdByUserId: ctx.session.user.id,
          resolvedAt: {
            gte: new Date(Date.now() - cooldownTime * 60 * 1000),
          },
        },
      });

      if (lastTicket && ctx.session.user.role !== UserRole.STAFF) {
        return;
      }

      const ticket = await ctx.prisma.ticket.create({
        data: {
          description: input.description,
          isPublic: isPublic,
          locationDescription: input.locationDescription,
          usersInGroup: isPublic
            ? { connect: [{ id: ctx.session.user.id }] }
            : undefined,
          isPriority: isPriority,
          ticketType: input.ticketType,
          assignment: {
            connect: {
              id: input.assignmentId,
            },
          },
          location: {
            connect: {
              id: input.locationId,
            },
          },
          createdBy: {
            connect: {
              id: ctx?.session?.user?.id,
            },
          },
          // If pending stage is enabled, set status to pending
          status:
            pendingStageEnabled?.value === SiteSettingsValues.TRUE
              ? TicketStatus.PENDING
              : TicketStatus.OPEN,
          // If personal queue name is provided, connect to it
          ...(input.personalQueueName && {
            PersonalQueue: {
              connect: {
                name: input.personalQueueName,
              },
            },
          }),
        },
      });

      // Add the ticket to User.ticketsJoined if it is public
      if (isPublic) {
        await ctx.prisma.user.update({
          where: { id: ctx.session.user.id },
          data: {
            ticketsJoined: { connect: { id: ticket.id } },
          },
        });
      }

      const ticketWithNames: TicketWithNames[] =
        await convertTicketToTicketWithNames([ticket], ctx);

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get("tickets");
      await channel.publish("new-ticket", undefined);

      /***** Removing staff broadcast for now *****/
      //   if (isPriority && ticket.personalQueueId === null) {
      //     const staffChannel = ably.channels.get('staff-broadcast');
      //     await staffChannel.publish('tickets-marked-as-priority', 'There is a new priority ticket');
      //   }

      return ticketWithNames[0];
    }),

  editTicket: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        ticket: z.object({
          description: z.string().nullable(),
          locationDescription: z.string().nullable(),
          locationId: z.number(),
          assignmentId: z.number(),
          isPublic: z.boolean(),
          ticketType: z.nativeEnum(TicketType),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { isPrivileged, isOwner } = await ensureTicketAccess({
        ticketId: input.ticketId,
        ctx,
        allowPublic: false,
      });

      if (!isPrivileged && !isOwner) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to edit this ticket",
        });
      }

      await ctx.prisma.ticket.update({
        where: {
          id: input.ticketId,
        },
        data: {
          description: input.ticket.description,
          locationDescription: input.ticket.locationDescription,
          location: {
            connect: {
              id: input.ticket.locationId,
            },
          },
          assignment: {
            connect: {
              id: input.ticket.assignmentId,
            },
          },
          isPublic: input.ticket.isPublic,
          ticketType: input.ticket.ticketType,
        },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const ticketChannel = ably.channels.get(`ticket-${input.ticketId}`);
      await ticketChannel.publish("ticket-edited", { id: input.ticketId });

      const channel = ably.channels.get("tickets");
      await channel.publish("ticket-edited", { id: input.ticketId });
    }),

  approveTickets: protectedStaffProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.updateMany({
        where: { id: { in: input.ticketIds } },
        data: { status: TicketStatus.OPEN },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get("tickets");
      await channel.publish("tickets-approved", undefined);

      // Use inner ticket channel
      for (const id of input.ticketIds) {
        const channel = ably.channels.get(`ticket-${id}`);
        await channel.publish("ticket-approved", undefined);
      }
    }),

  assignTickets: protectedNotStudentProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const ticketsToAssign: number[] = [];
      for (const ticketId of input.ticketIds) {
        const ticket = await ctx.prisma.ticket.findFirst({
          where: { id: ticketId },
        });
        // If the ticket is already assigned, skip it
        if (!ticket || ticket?.status === TicketStatus.ASSIGNED) {
          break;
        }
        ticketsToAssign.push(ticket.id);
      }

      for (const ticketId of ticketsToAssign) {
        // updateMany is not working here, so we have to use update
        await ctx.prisma.ticket.update({
          where: { id: ticketId },
          data: {
            status: TicketStatus.ASSIGNED,
            helpedAt: new Date(),
            helpedBy: {
              connect: {
                id: ctx.session?.user?.id,
              },
            },
          },
        });
      }

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get("tickets");
      await channel.publish("tickets-assigned", undefined);

      // Uses ticket inner page channel
      for (const id of ticketsToAssign) {
        const channel = ably.channels.get(`ticket-${id}`);
        await channel.publish("ticket-assigned", undefined);
      }

      return ticketsToAssign;
    }),

  // Assigns a ticket to the current user
  takeOverTicket: protectedNotStudentProcedure
    .input(
      z.object({
        ticketId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: {
          status: TicketStatus.ASSIGNED,
          helpedAt: new Date(),
          helpedBy: {
            connect: {
              id: ctx.session?.user?.id,
            },
          },
        },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get("tickets");
      await channel.publish("tickets-assigned", undefined);

      // Uses ticket inner page channel
      const ticketChannel = ably.channels.get(`ticket-${input.ticketId}`);
      await ticketChannel.publish("ticket-assigned", undefined);
    }),

  resolveTickets: protectedNotStudentProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.updateMany({
        where: { id: { in: input.ticketIds } },
        data: { status: TicketStatus.RESOLVED, resolvedAt: new Date() },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get("tickets");
      await channel.publish("tickets-resolved", undefined);

      // Uses ticket inner page channel
      for (const id of input.ticketIds) {
        const channel = ably.channels.get(`ticket-${id}`);
        await channel.publish("ticket-resolved", undefined);
      }
    }),

  markAsAbsent: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        markOrUnmark: z.boolean(), // True for mark, false for unmark
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { isPrivileged } = await ensureTicketAccess({
        ticketId: input.ticketId,
        ctx,
        allowPublic: false,
      });

      if (ctx.session.user.role === UserRole.STUDENT) {
        if (input.markOrUnmark) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Students cannot mark tickets as absent",
          });
        }
      } else if (!isPrivileged) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only staff and interns can mark tickets as absent",
        });
      }

      await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: {
          status: input.markOrUnmark ? TicketStatus.ABSENT : TicketStatus.OPEN,
          markedAbsentAt: input.markOrUnmark ? new Date() : null,
        },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get("tickets");
      await channel.publish("tickets-marked-as-absent", undefined);

      // Uses ticket inner page channel
      const innerChannel = ably.channels.get(`ticket-${input.ticketId}`);
      await innerChannel.publish("ticket-marked-as-absent", {
        isAbsent: input.markOrUnmark,
      });
    }),

  markAsPriority: protectedNotStudentProcedure
    .input(
      z.object({
        ticketId: z.number(),
        isPriority: z.boolean(), // True for mark, false for unmark
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: { isPriority: input.isPriority },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get("tickets");
      await channel.publish("tickets-marked-as-priority", undefined);

      const ticketChannel = ably.channels.get(`ticket-${input.ticketId}`);
      await ticketChannel.publish("ticket-marked-as-priority", undefined);

      /***** Removing staff broadcast for now *****/

      //   if (input.isPriority && ticket.personalQueueId === null) {
      //       const staffChannel = ably.channels.get('staff-broadcast');
      //       await staffChannel.publish('tickets-marked-as-priority', 'There is a new priority ticket');
      //   }
    }),

  closeTickets: protectedProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const tickets = await ctx.prisma.ticket.findMany({
        where: {
          id: { in: input.ticketIds },
        },
      });

      // We only allow the creator of the ticket to close it
      for (const ticket of tickets) {
        if (
          ticket?.createdByUserId !== ctx.session?.user?.id &&
          ctx.session?.user?.role !== UserRole.STAFF
        ) {
          throw new TRPCClientError(
            "You are not authorized to close this ticket",
          );
        }
      }

      await ctx.prisma.ticket.updateMany({
        where: { id: { in: input.ticketIds } },
        data: { status: TicketStatus.CLOSED },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get("tickets");
      await channel.publish("ticket-closed", { ticketIds: input.ticketIds });

      // Uses ticket inner page channel
      for (const id of input.ticketIds) {
        const innerChannel = ably.channels.get(`ticket-${id}`);
        await innerChannel.publish("ticket-closed", { id });
      }
    }),

  requeueTickets: protectedNotStudentProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      for (const ticketId of input.ticketIds) {
        await ctx.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.OPEN },
        });
      }

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get("tickets");
      await channel.publish("tickets-requeued", undefined);

      // Uses ticket inner page channel
      for (const id of input.ticketIds) {
        const channel = ably.channels.get(`ticket-${id}`);
        await channel.publish("ticket-requeued", undefined);
      }
    }),

  reopenTickets: protectedNotStudentProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.updateMany({
        where: { id: { in: input.ticketIds } },
        data: { status: TicketStatus.OPEN },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get("tickets");
      await channel.publish("tickets-reopened", undefined);

      // Uses ticket inner page channel
      for (const id of input.ticketIds) {
        const channel = ably.channels.get(`ticket-${id}`);
        await channel.publish("ticket-reopened", undefined);
      }
    }),

  joinTicketGroup: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const ticket = await ctx.prisma.ticket.findUnique({
        where: { id: input.ticketId },
      });
      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      const isPrivileged = isPrivilegedRole(ctx.session.user.role);
      if (!ticket.isPublic && !isPrivileged) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You can only join public tickets",
        });
      }

      await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: {
          usersInGroup: {
            connect: {
              id: ctx.session?.user?.id,
            },
          },
        },
      });

      await ctx.prisma.user.update({
        where: { id: ctx.session?.user?.id },
        data: {
          ticketsJoined: {
            connect: {
              id: input.ticketId,
            },
          },
        },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get("tickets");
      await channel.publish("ticket-joined", { id: input.ticketId });

      // Uses ticket inner page channel
      const innerChannel = ably.channels.get(`ticket-${input.ticketId}`);
      await innerChannel.publish("ticket-joined", { id: input.ticketId });
    }),

  leaveTicketGroup: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: {
          usersInGroup: {
            disconnect: {
              id: ctx.session?.user?.id,
            },
          },
        },
      });

      await ctx.prisma.user.update({
        where: { id: ctx.session?.user?.id },
        data: {
          ticketsJoined: {
            disconnect: {
              id: input.ticketId,
            },
          },
        },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get("tickets");
      await channel.publish("ticket-left", { id: input.ticketId });

      // Uses ticket inner page channel
      const innerChannel = ably.channels.get(`ticket-${input.ticketId}`);
      await innerChannel.publish("ticket-left", { id: input.ticketId });
    }),

  sendChatMessage: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        message: z.string(),
        visibleToStudents: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ensureTicketAccess({
        ticketId: input.ticketId,
        ctx,
        allowPublic: true,
        requireParticipant: true,
      });

      if (
        !input.visibleToStudents &&
        ctx.session.user.role === UserRole.STUDENT
      ) {
        throw new TRPCClientError(
          "You are not authorized to send this message",
        );
      }

      const chatMessage = await ctx.prisma.chatMessage.create({
        data: {
          message: input.message,
          visibleToStudents: input.visibleToStudents,
          author: {
            connect: {
              id: ctx.session?.user?.id,
            },
          },
          ticket: {
            connect: {
              id: input.ticketId,
            },
          },
        },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get(`ticket-${input.ticketId}`);
      await channel.publish("chat-message", undefined);

      // Students cannot subscribe to ticket-* channels; notify through a
      // student-accessible channel so ticket chat can refresh in real time.
      const ticketsChannel = ably.channels.get("tickets");
      await ticketsChannel.publish("ticket-chat-message", {
        ticketId: input.ticketId,
      });
      return chatMessage;
    }),

  clearQueue: protectedStaffProcedure
    .input(
      z.object({
        personalQueueName: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Closes all open, pending, and assigned tickets.

      // Get tickets for pushing to Ably
      const tickets = await ctx.prisma.ticket.findMany({
        where: {
          status: {
            in: [TicketStatus.OPEN, TicketStatus.PENDING, TicketStatus.ABSENT],
          },
          ...(input.personalQueueName
            ? { personalQueueName: input.personalQueueName }
            : { personalQueueName: null }),
        },
      });

      // Close tickets
      await ctx.prisma.ticket.updateMany({
        where: {
          status: {
            in: [
              TicketStatus.OPEN,
              TicketStatus.PENDING,
              TicketStatus.ASSIGNED,
              TicketStatus.ABSENT,
            ],
          },
          ...(input.personalQueueName
            ? { personalQueueName: input.personalQueueName }
            : { personalQueueName: null }),
        },
        data: {
          status: TicketStatus.CLOSED,
        },
      });

      // Push to Ably
      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get("tickets");
      await channel.publish("all-tickets-closed", undefined);

      for (const ticket of tickets) {
        const channel = ably.channels.get(`ticket-${ticket.id}`);
        await channel.publish("ticket-closed", undefined);
      }
    }),

  toggleIsPublic: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        isPublic: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { isPrivileged, isOwner } = await ensureTicketAccess({
        ticketId: input.ticketId,
        ctx,
        allowPublic: false,
      });

      if (!isPrivileged && !isOwner) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to update ticket visibility",
        });
      }

      await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: { isPublic: input.isPublic },
      });

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get("tickets");
      await channel.publish("ticket-toggle-public", { id: input.ticketId });

      // Uses ticket inner page channel
      const innerChannel = ably.channels.get(`ticket-${input.ticketId}`);
      await innerChannel.publish("ticket-toggle-public", { id: input.ticketId });
    }),

  getTicket: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { ticket, isPrivileged, isOwner, isInGroup } =
        await ensureTicketAccess({
          ticketId: input.id,
          ctx,
          allowPublic: true,
        });

      const ticketsWithNames: TicketWithNames[] =
        await convertTicketToTicketWithNames([ticket], ctx);
      const ticketWithNames = ticketsWithNames[0];

      if (!ticketWithNames) {
        return null;
      }

      if (!isPrivileged && !isOwner && !isInGroup) {
        return sanitizeTicketForStudent({
          ticket: ticketWithNames,
          userId: ctx.session.user.id,
          joinedTicketIds: new Set<number>(
            isInGroup ? [ticketWithNames.id] : [],
          ),
        });
      }

      return ticketWithNames;
    }),

  getUserCooldownTime: protectedProcedure.query(async ({ ctx }) => {
    // If there is a cooldown timer and the user is a student, return how long the student
    // has to wait before making another ticket. The wait time is returned in milliseconds and is
    // calculated by (lastTicketResolvedAt + cooldownTime) - Date.now()
    if (ctx.session.user.role !== UserRole.STUDENT) {
      return null;
    }

    const cooldownTimeResult = await ctx.prisma.variableSettings.findUnique({
      where: { setting: VariableSiteSettings.COOLDOWN_TIME },
    });

    const cooldownTime = parseInt(cooldownTimeResult?.value ?? "0");

    if (!cooldownTime) {
      return null;
    }

    const lastTicket = await ctx.prisma.ticket.findFirst({
      where: {
        createdByUserId: ctx.session.user.id,
        resolvedAt: {
          gte: new Date(Date.now() - cooldownTime * 60 * 1000),
        },
      },
    });

    if (!lastTicket || !lastTicket.resolvedAt) {
      return null;
    }

    return (
      lastTicket.resolvedAt.getTime() + cooldownTime * 60 * 1000 - Date.now()
    );
  }),

  getTicketsWithStatus: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(TicketStatus),
        personalQueueName: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const isStudent = ctx.session.user.role === UserRole.STUDENT;
      const isOpenOrAssigned =
        input.status === TicketStatus.OPEN ||
        input.status === TicketStatus.ASSIGNED;

      const studentVisibilityFilter = isStudent
        ? isOpenOrAssigned
          ? {
              OR: [
                { isPublic: true },
                { createdByUserId: ctx.session.user.id },
                { usersInGroup: { some: { id: ctx.session.user.id } } },
              ],
            }
          : {
              OR: [
                { createdByUserId: ctx.session.user.id },
                { usersInGroup: { some: { id: ctx.session.user.id } } },
              ],
            }
        : {};

      const tickets = await ctx.prisma.ticket.findMany({
        where: {
          status: input.status,
          // If personal queue name is provided, only return tickets that are in that queue.
          // Otherwise, return all tickets with the given status where the queue is not personal.
          ...(input.personalQueueName
            ? { personalQueueName: input.personalQueueName }
            : { personalQueueName: null }),
          ...studentVisibilityFilter,
        },
      });

      const ticketsWithNames: TicketWithNames[] =
        await convertTicketToTicketWithNames(tickets, ctx);

      if (ctx.session.user.role !== UserRole.STUDENT) {
        return ticketsWithNames;
      }

      const joinedTickets = await ctx.prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          ticketsJoined: {
            select: {
              id: true,
            },
          },
        },
      });
      const joinedTicketIds = new Set<number>(
        joinedTickets?.ticketsJoined.map((ticket) => ticket.id) ?? [],
      );

      return ticketsWithNames.map((ticket) =>
        sanitizeTicketForStudent({
          ticket,
          userId: ctx.session.user.id,
          joinedTicketIds,
        }),
      );
    }),

  /* For global log */
  getAllTickets: protectedStaffProcedure
    .input(
      z.object({
        page: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // With page size = 50
      const tickets = await ctx.prisma.ticket.findMany({
        skip: 50 * (input.page - 1),
        take: 50,
        orderBy: { createdAt: "desc" },
      });

      return convertTicketToTicketWithNames(tickets, ctx);
    }),

  getTicketsWithUserId: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        shouldSortByCreatedAt: z.boolean().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (
        ctx.session.user.role === UserRole.STUDENT &&
        input.userId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to view these tickets",
        });
      }

      return await getUserTicketsFromId(
        input.userId,
        input.shouldSortByCreatedAt,
        ctx,
      );
    }),

  getTicketsWithUserEmail: protectedProcedure
    .input(
      z.object({
        userEmail: z.string(),
        shouldSortByCreatedAt: z.boolean().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const currentUserEmail = ctx.session.user.email?.toLowerCase();
      if (
        ctx.session.user.role === UserRole.STUDENT &&
        input.userEmail.toLowerCase() !== currentUserEmail
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to view these tickets",
        });
      }

      if (!input.userEmail.match(EMAIL_REGEX)) {
        return null;
      }

      const user = await ctx.prisma.user.findUnique({
        where: { email: input.userEmail },
        select: { id: true },
      });

      if (!user) {
        return null;
      }

      return await getUserTicketsFromId(
        user.id,
        input.shouldSortByCreatedAt,
        ctx,
      );
    }),

  getUsersInTicketGroup: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { isPrivileged, isOwner, isInGroup } = await ensureTicketAccess({
        ticketId: input.ticketId,
        ctx,
        allowPublic: true,
      });

      const users = await ctx.prisma.user.findMany({
        where: {
          ticketsJoined: {
            some: { id: input.ticketId },
          },
        },
        select: {
          id: true,
          name: true,
          preferredName: true,
        },
      });

      const canViewNames = isPrivileged || isOwner || isInGroup;
      return users.map((user) => ({
        id:
          canViewNames || user.id === ctx.session.user.id
            ? user.id
            : "",
        name: canViewNames ? user.name : null,
        preferredName: canViewNames ? user.preferredName : null,
      }));
    }),

  getChatMessages: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      await ensureTicketAccess({
        ticketId: input.ticketId,
        ctx,
        allowPublic: true,
        requireParticipant: true,
      });

      const userRole = ctx.session.user.role;
      const messages: ChatMessage[] = await ctx.prisma.chatMessage.findMany({
        where: {
          ticketId: input.ticketId,
          ...(userRole === UserRole.STUDENT && { visibleToStudents: true }),
        },
      });

      // Add user name to each message
      const messagesWithUser: ChatMessageWithUserName[] = await Promise.all(
        messages.map(async (message: ChatMessage) => {
          const user = await ctx.prisma.user.findUnique({
            where: {
              id: message.userId,
            },
          });
          return {
            ...message,
            userName: user?.preferredName ?? user?.name!,
            userRole: user?.role!,
          };
        }),
      );

      messagesWithUser.sort((a, b) => {
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      return messagesWithUser;
    }),
});

const convertTicketToTicketWithNames = async (tickets: Ticket[], ctx: any) => {
  const ticketsWithNames: TicketWithNames[] = await Promise.all(
    tickets.map(async (ticket: Ticket) => {
      const location: Location = await ctx.prisma.location.findUnique({
        where: {
          id: ticket.locationId,
        },
      });
      const assignment: Assignment = await ctx.prisma.assignment.findUnique({
        where: {
          id: ticket.assignmentId,
        },
      });
      let helpedBy: User | undefined = undefined;
      if (ticket.helpedByUserId) {
        helpedBy = await ctx.prisma.user.findUnique({
          where: {
            id: ticket.helpedByUserId,
          },
        });
      }
      const createdBy: User = await ctx.prisma.user.findUnique({
        where: {
          id: ticket.createdByUserId,
        },
      });

      return {
        ...ticket,
        locationName: location?.name,
        assignmentName: assignment?.name,
        helpedByName: helpedBy?.preferredName ?? helpedBy?.name,
        createdByName: createdBy?.preferredName ?? createdBy.name,
        createdByEmail: createdBy.email,
        createdByPronunciation: createdBy?.preferredPronunciation ?? "",
        assignmentCategoryId: assignment?.categoryId,
        locationDescription: ticket.locationDescription,
      };
    }),
  );

  return ticketsWithNames;
};

/** Given a user ID, return the helped and created tickets */
const getUserTicketsFromId = async (
  userId: string,
  shouldSortByCreatedAt: boolean | undefined,
  ctx: any,
) => {
  const helpedTicketsNoName = await ctx.prisma.ticket.findMany({
    where: {
      helpedByUserId: userId,
    },
    ...(shouldSortByCreatedAt && { orderBy: { createdAt: "desc" } }),
  });

  const createdTicketsNoName = await ctx.prisma.ticket.findMany({
    where: {
      createdByUserId: userId,
    },
    ...(shouldSortByCreatedAt && { orderBy: { createdAt: "desc" } }),
  });

  const createdTickets = await convertTicketToTicketWithNames(
    createdTicketsNoName,
    ctx,
  );
  const helpedTickets = await convertTicketToTicketWithNames(
    helpedTicketsNoName,
    ctx,
  );

  return {
    helpedTickets,
    createdTickets,
  };
};

export interface ChatMessageWithUserName extends ChatMessage {
  userName: string;
  userRole: UserRole;
}

// Includes the name of users, location, and assignment
export interface TicketWithNames extends Ticket {
  helpedByName: string | null | undefined;
  createdByName: string | null;
  createdByEmail: string | null;
  createdByPronunciation: string | null;
  assignmentName: string;
  locationName: string;
  assignmentCategoryId: number;
  locationDescription: string | null;
  isOnline: boolean;
  template: string;
}
