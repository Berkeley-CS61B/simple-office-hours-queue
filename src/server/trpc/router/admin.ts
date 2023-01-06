import Ably from 'ably/promises';
import { router, protectedStaffProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { SiteSettings, SiteSettingsValues } from '@prisma/client';
import { settingsToDefault } from '../../../utils/utils';

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
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
      const channel = ably.channels.get('settings');
      await channel.publish('queue-open-close', input.shouldOpen ? SiteSettingsValues.TRUE : SiteSettingsValues.FALSE);
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
