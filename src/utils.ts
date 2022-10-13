import { SiteSettings, SiteSettingsValues } from "@prisma/client";

export const uppercaseFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Maps settings to their default value
export const settingsToDefault = {
	[SiteSettings.IS_PENDING_STAGE_ENABLED]: SiteSettingsValues.TRUE,
	[SiteSettings.IS_QUEUE_OPEN]: SiteSettingsValues.FALSE,
}