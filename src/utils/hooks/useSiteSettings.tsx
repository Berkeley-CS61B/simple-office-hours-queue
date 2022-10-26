import { SiteSettings, SiteSettingsValues } from '@prisma/client';
import { useState } from 'react';
import { trpc } from '../trpc';

/**
 * Custom hook to get site settings.
 */
const useSiteSettings = () => {
  const [siteSettings, setSiteSettings] = useState<Map<SiteSettings, SiteSettingsValues>>();

  const { isLoading } = trpc.admin.getSettings.useQuery(undefined, {
    refetchOnWindowFocus: false,

    onSuccess: data => {
      setSiteSettings(
        new Map<SiteSettings, SiteSettingsValues>(
          Object.entries(data).map(([key, value]) => [key as SiteSettings, value as SiteSettingsValues]),
        ),
      );
      //   setSiteSettings(data);
    },
  });

  return { siteSettings, isLoading };
};

export default useSiteSettings;
