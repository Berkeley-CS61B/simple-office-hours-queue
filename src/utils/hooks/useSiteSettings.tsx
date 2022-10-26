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
      const map = new Map<SiteSettings, SiteSettingsValues>();
      data.forEach(setting => {
        map.set(setting.setting, setting.value);
      });
      setSiteSettings(map);
    },
  });

  return { siteSettings, isLoading };
};

export default useSiteSettings;
