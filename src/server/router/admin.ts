import { createRouter } from './context';
import { SiteSettings, SiteSettingsValues } from '@prisma/client';
import { z } from 'zod';

export const adminRouter = createRouter()
  .mutation('createAssigmnent', {
    input: z.object({
      name: z.string(),
    }),
    async resolve({ input, ctx }) {
      return ctx.prisma.assignment.create({
        data: {
          name: input.name,
        },
      });
    },
  })
  .mutation('createLocation', {
    input: z.object({
      name: z.string(),
    }),
    async resolve({ input, ctx }) {
      return ctx.prisma.location.create({
        data: {
          name: input.name,
        },
      });
    },
  })
  .mutation('editAssignment', {
    input: z.object({
      id: z.number(),
      name: z.string(),
      active: z.boolean(),
    }),
    async resolve({ input, ctx }) {
      return ctx.prisma.assignment.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          active: input.active,
        },
      });
    },
  })
  .mutation('editLocation', {
    input: z.object({
      id: z.number(),
      name: z.string(),
      active: z.boolean(),
    }),
    async resolve({ input, ctx }) {
      return ctx.prisma.location.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          active: input.active,
        },
      });
    },
  })
  .mutation('setIsPendingStageEnabled', {
    input: z.object({
      setting: z.nativeEnum(SiteSettings),
      value: z.nativeEnum(SiteSettingsValues),
    }),
    async resolve({ input, ctx }) {
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
    },
  })
  .query('getAllAssignments', {
    async resolve({ ctx }) {
      return ctx.prisma.assignment.findMany();
    },
  })
  .query('getActiveAssignments', {
    async resolve({ ctx }) {
      const assignment = await ctx.prisma.assignment.findMany({
        where: {
          active: true,
        },
      });
      return assignment;
    },
  })
  .query('getAllLocations', {
    async resolve({ ctx }) {
      return ctx.prisma.location.findMany();
    },
  })
  .query('getActiveLocations', {
    async resolve({ ctx }) {
      return ctx.prisma.location.findMany({
        where: {
          active: true,
        },
      });
    },
  })
  .query('getIsPendingStageEnabled', {
    async resolve({ ctx }) {
      let setting;
      setting = ctx.prisma.settings.findUnique({
        where: {
          setting: SiteSettings.isPendingStageEnabled,
        },
      });
      if (!setting) {
        setting = ctx.prisma.settings.create({
          data: {
            setting: SiteSettings.isPendingStageEnabled,
            value: SiteSettingsValues.TRUE, // Default will be true
          },
        });
      }
	  return setting;
    },
  });
