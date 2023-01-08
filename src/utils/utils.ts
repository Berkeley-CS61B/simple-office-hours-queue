import { SiteSettings, SiteSettingsValues } from '@prisma/client';
import { TicketWithNames } from '../server/trpc/router/ticket';

export const uppercaseFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Maps settings to their default value
export const settingsToDefault = {
  [SiteSettings.IS_PENDING_STAGE_ENABLED]: SiteSettingsValues.TRUE,
  [SiteSettings.IS_QUEUE_OPEN]: SiteSettingsValues.FALSE,
  [SiteSettings.ARE_PUBLIC_TICKETS_ENABLED]: SiteSettingsValues.TRUE,
  [SiteSettings.IMPORT_USERS_METHOD]: SiteSettingsValues.IMPORT_STAFF,
};

/** Returns the time difference in minutes between a first and second (first - second) */
export const timeDifferenceInMinutes = (first: Date | null, second: Date | null): number => {
  if (!first || !second) return -1;
  const difference = first.getTime() - second.getTime();
  return Math.round(difference / 60000);
};

export const getActivityTableColumns = (title: string, shouldShowCreatedBy: boolean) => {
  return [
    {
      Header: title,
      columns: [
        {
          Header: 'Description',
          accessor: 'description',
        },
        {
          Header: 'Created At',
          accessor: 'createdAt',
        },
        {
          Header: 'Assignment',
          accessor: 'assignmentName',
        },
        {
          Header: 'Location',
          accessor: 'locationName',
        },
        shouldShowCreatedBy
          ? {
              Header: 'Created by',
              accessor: 'createdByName',
            }
          : {
              Header: 'Helped by',
              accessor: 'helpedByName',
            },
        {
          Header: 'Duration (m)',
          accessor: 'duration',
        },
        {
          Header: 'Link',
          accessor: 'id',
        },
      ],
    },
  ];
};

export const addDurationToTickets = (tickets: TicketWithNames[]) => {
  return tickets.map(ticket => {
    return {
      ...ticket,
      duration: timeDifferenceInMinutes(ticket.resolvedAt, ticket.helpedAt),
    };
  });
};

/** Takes in a string and returns that string without any spaces
 * Only allow letters, digits, underscores, and hyphens */
export const sanitizeString = (str: string) => str.replace(/[^a-zA-Z0-9-_]/g, '');

// I don't think there's a way to inclue this enum in the SiteSettingsValues enum
export const ImportUsersMethodPossiblities = {
    IMPORT_STAFF:"IMPORT_STAFF",
    IMPORT_STAFF_AND_STUDENTS:"IMPORT_STAFF_AND_STUDENTS",
}
