import { useState } from 'react';
import { SiteSettings, SiteSettingsValues } from '@prisma/client';
import { trpc } from '../trpc';

/**
 * Custom hook to get site settings
 */
const useSiteSettings = () => {
  return trpc.admin.getSettings.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

};

export default useSiteSettings;
