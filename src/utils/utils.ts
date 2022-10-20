import { SiteSettings, SiteSettingsValues } from '@prisma/client';

export const uppercaseFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Maps settings to their default value
export const settingsToDefault = {
  [SiteSettings.IS_PENDING_STAGE_ENABLED]: SiteSettingsValues.TRUE,
  [SiteSettings.IS_QUEUE_OPEN]: SiteSettingsValues.FALSE,
};

/** Returns the time difference in minutes between a date and now */
export const timeDifferenceInMinutes = (date: Date | null) : number => {
  if (!date) return -1;
  const now = new Date();
  const difference = now.getTime() - date.getTime();
  return Math.round(difference / 60000);
};
