import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { SiteSettings, SiteSettingsValues } from '@prisma/client';
import { settingsToDefault } from '../../../utils';

export const adminRouter = router({
  createAssignment: publicProcedure
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

  createLocation: publicProcedure.input(z.object({ name: z.string() })).mutation(async ({ input, ctx }) => {
    return ctx.prisma.location.create({
      data: {
        name: input.name,
      },
    });
  }),

  editAssignment: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        active: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.assignment.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          active: input.active,
        },
      });
    }),

  editLocation: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        active: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.location.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          active: input.active,
        },
      });
    }),

  setIsPendingStageEnabled: publicProcedure
    .input(
      z.object({
        setting: z.nativeEnum(SiteSettings),
        value: z.nativeEnum(SiteSettingsValues),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.settings.upsert({
        where: {
          setting: input.setting,
        },
        update: {
          value: input.value,
        },
        create: {
          setting: input.setting,
          value: input.value,
        },
      });
    }),

  getAllAssignments: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.assignment.findMany();
  }),

  getAllLocations: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.location.findMany();
  }),

  getActiveAssignments: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.assignment.findMany({
      where: {
        active: true,
      },
    });
  }),

  getActiveLocations: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.location.findMany({
      where: {
        active: true,
      },
    });
  }),

  getSettings: publicProcedure.query(async ({ ctx }) => {
    const settings: Map<SiteSettings, SiteSettingsValues> = new Map();
    for (const setting of Object.values(SiteSettings)) {
      // Create the setting with the default value if it doesn't exist
      const settingValue = await ctx.prisma.settings.upsert({
        where: {
          setting,
        },
        update: {},
        create: {
          setting,
          value: settingsToDefault[setting],
        },
      });
      settings.set(setting, settingValue.value);
    }
    return settings;
  }),
});
