import Ably from 'ably/promises';
import { router, protectedStaffProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { SiteSettings, SiteSettingsValues, VariableSiteSettings } from '@prisma/client';
import { settingsToDefault, ImportUsersMethodPossiblities } from '../../../utils/utils';
import { TRPCClientError } from '@trpc/client';
import { EMAIL_DOMAIN_REGEX_OR_EMPTY } from '../../../utils/constants';

export const adminRouter = router({
  createAssignment: protectedStaffProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.assignment.create({
        data: {
          name: input.name,
        },
      });
    }),

  createLocation: protectedStaffProcedure.input(z.object({ name: z.string() })).mutation(async ({ input, ctx }) => {
    return ctx.prisma.location.create({
      data: {
        name: input.name,
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
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.assignment.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          isActive: input.isActive,
          isHidden: input.isHidden,
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
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.location.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          isActive: input.isActive,
          isHidden: input.isHidden,
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
          value: input.shouldBeEnabled ? SiteSettingsValues.TRUE : SiteSettingsValues.FALSE,
        },
        create: {
          setting: SiteSettings.ARE_PUBLIC_TICKETS_ENABLED,
          value: input.shouldBeEnabled ? SiteSettingsValues.TRUE : SiteSettingsValues.FALSE,
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
          value: input.shouldBeEnabled ? SiteSettingsValues.TRUE : SiteSettingsValues.FALSE,
        },
        create: {
          setting: SiteSettings.IS_PENDING_STAGE_ENABLED,
          value: input.shouldBeEnabled ? SiteSettingsValues.TRUE : SiteSettingsValues.FALSE,
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
      const channel = ably.channels.get('settings');
      if (input.personalQueueName) {
        await channel.publish(
          'queue-open-close-' + input.personalQueueName,
          input.shouldOpen ? SiteSettingsValues.TRUE : SiteSettingsValues.FALSE,
        );
      } else {
        await channel.publish(
          'queue-open-close',
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
          value: input.shouldOpen ? SiteSettingsValues.TRUE : SiteSettingsValues.FALSE,
        },
        create: {
          setting: SiteSettings.IS_QUEUE_OPEN,
          value: input.shouldOpen ? SiteSettingsValues.TRUE : SiteSettingsValues.FALSE,
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
      if (!Object.values(ImportUsersMethodPossiblities).includes(input.method)) {
        throw new TRPCClientError('Invalid import users method');
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
        throw new TRPCClientError('Invalid email domain');
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

  getEmailDomain: protectedStaffProcedure.query(async ({ ctx }) => {
    const setting = await ctx.prisma.variableSettings.upsert({
      where: {
        setting: VariableSiteSettings.EMAIL_DOMAIN,
      },
      update: {},
      create: {
        setting: VariableSiteSettings.EMAIL_DOMAIN,
        value: '',
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
    } else if (setting.value === SiteSettingsValues.IMPORT_STAFF) {
      return ImportUsersMethodPossiblities.IMPORT_STAFF;
    } else {
      throw new TRPCClientError('Invalid import users method');
    }
  }),

  getAllAssignments: protectedStaffProcedure.query(async ({ ctx }) => {
    return ctx.prisma.assignment.findMany();
  }),

  getAllLocations: protectedStaffProcedure.query(async ({ ctx }) => {
    return ctx.prisma.location.findMany();
  }),

  getActiveAssignments: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.assignment.findMany({
      where: {
        isActive: true,
      },
    });
  }),

  getActiveLocations: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.location.findMany({
      where: {
        isActive: true,
      },
    });
  }),

  // This is used inside of the useSiteSettings custom hook
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.settings.findMany();
    // Add missing settings to the database if they dont exist. I initially
    // had upsert, but it was very slow so I changed it to manually add
    for (const setting of Object.keys(settingsToDefault)) {
      if (!settings.some(s => s.setting === setting)) {
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
