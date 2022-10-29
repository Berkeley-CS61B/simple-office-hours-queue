import { SiteSettings, SiteSettingsValues } from '@prisma/client';

export const uppercaseFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Maps settings to their default value
export const settingsToDefault = {
  [SiteSettings.IS_PENDING_STAGE_ENABLED]: SiteSettingsValues.TRUE,
  [SiteSettings.IS_QUEUE_OPEN]: SiteSettingsValues.FALSE,
};

/** Returns the time difference in minutes between a first and second (first - second) */
export const timeDifferenceInMinutes = (first: Date | null, second: Date | null): number => {
  if (!first || !second) return -1;
  const difference = first.getTime() - second.getTime();
  return Math.round(difference / 60000);
};

export const EMAIL_REGEX =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
