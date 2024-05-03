import {
  SiteSettings,
  SiteSettingsValues,
  VariableSiteSettings,
} from "@prisma/client";
import { TRPCClientError } from "@trpc/client";
import Ably from "ably/promises";
import { z } from "zod";
import { EMAIL_DOMAIN_REGEX_OR_EMPTY } from "../../../utils/constants";
import {
  ImportUsersMethodPossiblities,
  settingsToDefault,
} from "../../../utils/utils";
import { protectedProcedure, protectedStaffProcedure, router } from "../trpc";

export const adminRouter = router({
  createAssignment: protectedStaffProcedure
    .input(
      z.object({
        name: z.string(),
        isPriority: z.boolean(),
        categoryId: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.assignment.create({
        data: {
          name: input.name,
          isPriority: input.isPriority,
          category: {
            connect: {
              id: input.categoryId,
            },
          },
        },
      });
    }),

  createLocation: protectedStaffProcedure
    .input(z.object({ name: z.string(), categoryIds: z.array(z.number()) }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.location.create({
        data: {
          name: input.name,
          categories: {
            connect: input.categoryIds.map((id) => ({ id })),
          },
        },
      });
    }),

  editAssignment: protectedStaffProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        isActive: z.boolean(),
        isHidden: z.boolean(),
        isPriority: z.boolean().optional(),
        categoryId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.assignment.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          category: { connect: { id: input.categoryId } },
          isActive: input.isActive,
          isHidden: input.isHidden,
          ...(input.isPriority !== undefined && {
            isPriority: input.isPriority,
          }),
        },
      });
    }),

  createCategory: protectedStaffProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.category.create({
        data: {
          name: input.name,
        },
      });
    }),

  editLocation: protectedStaffProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        isActive: z.boolean(),
        isHidden: z.boolean(),
        categoryIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existingLocation = await ctx.prisma.location.findUnique({
        where: { id: input.id },
        select: { categories: { select: { id: true } } },
      });

      const categoriesToDisconnect = existingLocation
        ? existingLocation.categories
            .map((category) => category.id)
            .filter((id) => !input.categoryIds.includes(id))
        : [];

      return ctx.prisma.location.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          isActive: input.isActive,
          isHidden: input.isHidden,
          categories: {
            disconnect: categoriesToDisconnect.map((id) => ({ id })),
            connect: input.categoryIds.map((id) => ({ id })),
          },
        },
      });
    }),

  setArePublicTicketsEnabled: protectedStaffProcedure
    .input(
      z.object({
        shouldBeEnabled: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.settings.upsert({
        where: {
          setting: SiteSettings.ARE_PUBLIC_TICKETS_ENABLED,
        },
        update: {
          value: input.shouldBeEnabled
            ? SiteSettingsValues.TRUE
            : SiteSettingsValues.FALSE,
        },
        create: {
          setting: SiteSettings.ARE_PUBLIC_TICKETS_ENABLED,
          value: input.shouldBeEnabled
            ? SiteSettingsValues.TRUE
            : SiteSettingsValues.FALSE,
        },
      });
    }),

  setIsPendingStageEnabled: protectedStaffProcedure
    .input(
      z.object({
        shouldBeEnabled: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.settings.upsert({
        where: {
          setting: SiteSettings.IS_PENDING_STAGE_ENABLED,
        },
        update: {
          value: input.shouldBeEnabled
            ? SiteSettingsValues.TRUE
            : SiteSettingsValues.FALSE,
        },
        create: {
          setting: SiteSettings.IS_PENDING_STAGE_ENABLED,
          value: input.shouldBeEnabled
            ? SiteSettingsValues.TRUE
            : SiteSettingsValues.FALSE,
        },
      });
    }),

  openOrCloseQueue: protectedStaffProcedure
    .input(
      z.object({
        shouldOpen: z.boolean(),
        personalQueueName: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // If we're opening/closing a personal queue, do that instead of the site-wide queue
      if (input.personalQueueName) {
        await ctx.prisma.personalQueue.update({
          where: {
            name: input.personalQueueName,
          },
          data: {
            isOpen: input.shouldOpen,
          },
        });
      }

      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get("settings");
      if (input.personalQueueName) {
        await channel.publish(
          `queue-open-close-${input.personalQueueName}`,
          input.shouldOpen ? SiteSettingsValues.TRUE : SiteSettingsValues.FALSE,
        );
      } else {
        await channel.publish(
          "queue-open-close",
          input.shouldOpen ? SiteSettingsValues.TRUE : SiteSettingsValues.FALSE,
        );
      }

      if (input.personalQueueName) {
        return;
      }

      await ctx.prisma.settings.upsert({
        where: {
          setting: SiteSettings.IS_QUEUE_OPEN,
        },
        update: {
          value: input.shouldOpen
            ? SiteSettingsValues.TRUE
            : SiteSettingsValues.FALSE,
        },
        create: {
          setting: SiteSettings.IS_QUEUE_OPEN,
          value: input.shouldOpen
            ? SiteSettingsValues.TRUE
            : SiteSettingsValues.FALSE,
        },
      });
    }),

  setImportUsersMethod: protectedStaffProcedure
    .input(
      z.object({
        method: z.nativeEnum(ImportUsersMethodPossiblities),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (
        !Object.values(ImportUsersMethodPossiblities).includes(input.method)
      ) {
        throw new TRPCClientError("Invalid import users method");
      }

      await ctx.prisma.settings.upsert({
        where: {
          setting: SiteSettings.IMPORT_USERS_METHOD,
        },
        update: {
          value: input.method,
        },
        create: {
          setting: SiteSettings.IMPORT_USERS_METHOD,
          value: input.method,
        },
      });
    }),

  setEmailDomain: protectedStaffProcedure
    .input(
      z.object({
        domain: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!EMAIL_DOMAIN_REGEX_OR_EMPTY.test(input.domain)) {
        throw new TRPCClientError("Invalid email domain");
      }

      await ctx.prisma.variableSettings.upsert({
        where: {
          setting: VariableSiteSettings.EMAIL_DOMAIN,
        },
        update: {
          value: input.domain,
        },
        create: {
          setting: VariableSiteSettings.EMAIL_DOMAIN,
          value: input.domain,
        },
      });
    }),

  setCooldownTime: protectedStaffProcedure
    .input(
      z.object({
        cooldownTime: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.cooldownTime < 0) {
        throw new TRPCClientError("Cooldown time cannot be negative");
      }

      await ctx.prisma.variableSettings.upsert({
        where: {
          setting: VariableSiteSettings.COOLDOWN_TIME,
        },
        update: {
          value: input.cooldownTime.toString(),
        },
        create: {
          setting: VariableSiteSettings.COOLDOWN_TIME,
          value: input.cooldownTime.toString(),
        },
      });
    }),

  getCoolDownTime: protectedProcedure.query(async ({ ctx }) => {
    const setting = await ctx.prisma.variableSettings.upsert({
      where: {
        setting: VariableSiteSettings.COOLDOWN_TIME,
      },
      update: {},
      create: {
        setting: VariableSiteSettings.COOLDOWN_TIME,
        value: "0",
      },
    });
    return parseInt(setting.value);
  }),

  getEmailDomain: protectedStaffProcedure.query(async ({ ctx }) => {
    const setting = await ctx.prisma.variableSettings.upsert({
      where: {
        setting: VariableSiteSettings.EMAIL_DOMAIN,
      },
      update: {},
      create: {
        setting: VariableSiteSettings.EMAIL_DOMAIN,
        value: "",
      },
    });
    return setting.value;
  }),

  getImportUsersMethod: protectedStaffProcedure.query(async ({ ctx }) => {
    const setting = await ctx.prisma.settings.upsert({
      where: {
        setting: SiteSettings.IMPORT_USERS_METHOD,
      },
      update: {}, // This is blank because this query is acting like a findOrCreate
      create: {
        setting: SiteSettings.IMPORT_USERS_METHOD,
        value: settingsToDefault[SiteSettings.IMPORT_USERS_METHOD],
      },
    });

    if (setting.value === SiteSettingsValues.IMPORT_STAFF_AND_STUDENTS) {
      return ImportUsersMethodPossiblities.IMPORT_STAFF_AND_STUDENTS;
    }
    if (setting.value === SiteSettingsValues.IMPORT_STAFF) {
      return ImportUsersMethodPossiblities.IMPORT_STAFF;
    }
    throw new TRPCClientError("Invalid import users method");
  }),

  getAllAssignments: protectedStaffProcedure.query(async ({ ctx }) => {
    return ctx.prisma.assignment.findMany();
  }),

  getAllLocations: protectedStaffProcedure.query(async ({ ctx }) => {
    return ctx.prisma.location.findMany();
  }),

  getActiveAssignments: protectedProcedure
    .input(
      z.object({
        categoryId: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return ctx.prisma.assignment.findMany({
        where: {
          isActive: true,
          categoryId: input.categoryId,
        },
      });
    }),

  getActiveLocations: protectedProcedure
    .input(
      z.object({
        categoryId: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return ctx.prisma.location.findMany({
        where: {
          OR: [
            {
              isActive: true,
              categories: {
                some: {
                  id: input.categoryId,
                },
              },
            },
            {
              isActive: true,
              categories: {
                none: {},
              },
            },
          ],
        },
      });
    }),

  getCategoriesForLocation: protectedProcedure
    .input(
      z.object({
        locationId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.location.findUnique({
        where: { id: input.locationId },
        include: {
          categories: true,
        },
        // filter by locationId here
      });
    }),

  getAllCategories: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.category.findMany();
  }),

  // This is used inside of the useSiteSettings custom hook
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.settings.findMany();
    // Add missing settings to the database if they dont exist. I initially
    // had upsert, but it was very slow so I changed it to manually add
    for (const setting of Object.keys(settingsToDefault)) {
      if (!settings.some((s) => s.setting === setting)) {
        await ctx.prisma.settings.create({
          data: {
            setting: setting as SiteSettings,
            value: settingsToDefault[setting as SiteSettings],
          },
        });
      }
    }
    return settings;
  }),
});
