import { SiteSettings, SiteSettingsValues } from '@prisma/client';
import { TicketWithNames } from '../server/trpc/router/ticket';

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

export const getActivityTableColumns = (title: string) => {
  return [
    {
      Header: title,
      columns: [
        {
          Header: 'Description',
          accessor: 'description',
        },
        {
          Header: 'Assignment',
          accessor: 'assignmentName',
        },
        {
          Header: 'Location',
          accessor: 'locationName',
        },
        {
          Header: 'Created by',
          accessor: 'createdByName',
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

export const EMAIL_REGEX =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
