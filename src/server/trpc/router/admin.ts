import Ably from 'ably/promises';
import { router, protectedStaffProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { SiteSettings, SiteSettingsValues } from '@prisma/client';
import { settingsToDefault } from '../../../utils/utils';
import { TRPCError } from '@trpc/server';

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

  editLocation: protectedStaffProcedure
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

  deleteLocation: protectedStaffProcedure
    .input(
	  z.object({
		id: z.number(),
	  }),
	)
	.mutation(async ({ input, ctx }) => {
	  return ctx.prisma.location.delete({
		where: {
		  id: input.id,
		},
	  });
	}),
	 
  deleteAssignment: protectedStaffProcedure
    .input(
	  z.object({
		id: z.number(),
	  }),
	)
	.mutation(async ({ input, ctx }) => {
	  return ctx.prisma.assignment.delete({
		where: {
		  id: input.id,
		},
	  });
	}),

  setSiteSettings: protectedStaffProcedure
    .input(
      z.object({
        // Map each key in SiteSettings to type SiteSettingsValues, where theyre all optional
        ...Object.fromEntries(
          Object.keys(SiteSettings).map(key => [key, z.optional(z.nativeEnum(SiteSettingsValues))]),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      for (const key in input) {
        if (!Object.keys(SiteSettings).includes(key)) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Invalid settings key: ${key}`,
          });
        }

        const setting = key as SiteSettings;
        await ctx.prisma.settings.upsert({
          where: {
            setting,
          },
          update: {
            value: input[setting],
          },
          create: {
            setting,
            value: input[setting] ?? settingsToDefault[setting],
          },
        });

        if (setting === SiteSettings.IS_QUEUE_OPEN) {
          const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
          const channel = ably.channels.get('settings');
          await channel.publish('queue-open-close', input[setting]);
        }
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
        active: true,
      },
    });
  }),

  getActiveLocations: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.location.findMany({
      where: {
        active: true,
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
