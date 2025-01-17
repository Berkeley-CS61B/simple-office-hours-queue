import { SiteSettings, SiteSettingsValues } from "@prisma/client";
import { TicketStats } from "../server/trpc/router/stats";
import { TicketWithNames } from "../server/trpc/router/ticket";

export const uppercaseFirstLetter = (str: string | undefined) => {
  if (str === undefined) {
    return "";
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Taken from https://stackoverflow.com/questions/53879088/join-an-array-by-commas-and-and
export const joinArrayAsString = (arr: string[]) => {
  if (arr.length === 1) return arr[0];
  const firsts = arr.slice(0, arr.length - 1);
  const last = arr[arr.length - 1];
  return `${firsts.join(", ")} and ${last}`;
};

// Maps settings to their default value
export const settingsToDefault = {
  [SiteSettings.IS_PENDING_STAGE_ENABLED]: SiteSettingsValues.TRUE,
  [SiteSettings.IS_QUEUE_OPEN]: SiteSettingsValues.FALSE,
  [SiteSettings.ARE_PUBLIC_TICKETS_ENABLED]: SiteSettingsValues.TRUE,
  [SiteSettings.IMPORT_USERS_METHOD]: SiteSettingsValues.IMPORT_STAFF,
};

/** Returns the time difference in minutes between a first and second (first - second) */
export const timeDifferenceInMinutes = (
  first: Date | null,
  second: Date | null
): number => {
  if (!first || !second) return -1;
  const difference = first.getTime() - second.getTime();
  return Math.round(difference / 60000);
};

export const getActivityTableColumns = (
  title: string,
  shouldShowCreatedBy: boolean,
  shouldShowHelpedBy: boolean
) => {
  const baseTable = [
    {
      Header: title,
      columns: [
        {
          Header: "Description",
          accessor: "description",
        },
        {
          Header: "Created At",
          accessor: "createdAt",
        },
        {
          Header: "Assignment",
          accessor: "assignmentName",
        },
        {
          Header: "Location",
          accessor: "locationName",
        },
        {
          Header: "Duration (m)",
          accessor: "duration",
        },
        {
          Header: "Link",
          accessor: "id",
        },
      ],
    },
  ];

  // This isn't necessary, but it keeps typescript happy
  if (baseTable[0] === undefined) {
    throw new Error("baseTable[0] is undefined");
  }

  // Add createdBy and/or helpedBy columns
  if (shouldShowCreatedBy) {
    baseTable[0].columns.splice(4, 0, {
      Header: "Created By",
      accessor: "createdByName",
    });
  }

  if (shouldShowHelpedBy) {
    baseTable[0].columns.splice(4, 0, {
      Header: "Helped By",
      accessor: "helpedByName",
    });
  }

  return baseTable;
};

export const addDurationToTickets = (tickets: TicketWithNames[]) => {
  return tickets.map((ticket) => {
    return {
      ...ticket,
      duration: timeDifferenceInMinutes(ticket.resolvedAt, ticket.helpedAt),
    };
  });
};

/** Checks if the user is clicking on the url from a personal queue
 *  If so, append the queueId to the url as a query param
 */
export const getTicketUrl = (ticketId: number) => {
  const url = window.location.href;
  const isOnPersonalQueue = url.includes("/queue/");
  if (isOnPersonalQueue) {
    const queueName = url.split("/queue/")[1];
    return `/ticket/${ticketId}?queueName=${queueName}`;
  }
  return `/ticket/${ticketId}`;
};

/** Takes in a string and returns that string without any spaces
 * Only allow letters, digits, underscores, and hyphens */
export const sanitizeString = (str: string) =>
  str.replace(/[^a-zA-Z0-9-_]/g, "");

/** Only allow email domains with letters, digits, periods, underscores, and '@',  */
export const sanitizeEmailDomain = (str: string) =>
  str.replace(/[^a-zA-Z0-9-_.@]/g, "");

// I don't think there's a way to include this enum in the SiteSettingsValues enum
export const ImportUsersMethodPossiblities = {
  IMPORT_STAFF: "IMPORT_STAFF" as const,
  IMPORT_STAFF_AND_STUDENTS: "IMPORT_STAFF_AND_STUDENTS" as const,
};

export type ImportUsersMethodPossiblitiesType =
  | "IMPORT_STAFF"
  | "IMPORT_STAFF_AND_STUDENTS";

export const ImportNumberPossibilities = {
  SINGLE_IMPORT: "SINGLE_IMPORT" as const,
  BATCH_IMPORT: "BATCH_IMPORT" as const,
};

export type ImportNumberPossibilitiesType = "SINGLE_IMPORT" | "BATCH_IMPORT";

export const resolveTime = (t: TicketStats) => {
  if (!t.resolvedAt || !t.createdAt) {
    return 0;
  }
  return (
    Math.round(
      ((t.resolvedAt.getTime() - t.createdAt.getTime()) / 60000) * 1000
    ) / 1000
  ); // in minutes, 3 decimals
};

export const helpTime = (t: TicketStats) => {
  if (!t.resolvedAt || !t.helpedAt) {
    return 0;
  }
  return (
    Math.round(
      ((t.resolvedAt.getTime() - t.helpedAt.getTime()) / 60000) * 1000
    ) / 1000
  ); // in minutes, 3 decimals
};

export const computeMean = (data: number[]) => {
  return data.length > 0
    ? Math.round((data.reduce((a, b) => a + b) / data.length) * 1000) / 1000
    : 0;
};

export const computeMedian = (data: number[]) => {
  return data.length > 0
    ? data.sort((a, b) => a - b)[Math.floor(data.length / 2)]!
    : 0;
};

// Parse the coordinates from locationDescription
export const parseCoordinates = (locationDescription: string | undefined) => {
  if (locationDescription === undefined) return undefined;

  // Match "x: number, y: number" at the end of location description
  const match = locationDescription.match(
    /x: (\d+(\.\d+)?), y: (\d+(\.\d+)?)$/
  );

  if (match && match[1] && match[3]) {
    const x = parseFloat(match[1]);
    const y = parseFloat(match[3]);
    return { x, y };
  }
  return undefined;
};

// Accepts a location description and preprocesses it to remove coordinates if it is present.
// If no coordinates are present, it returns the original description.
// Useful when user is considering switching from coordinate-based location to text-based location, but don't want to show coordinates in the location description.
export const preprocessLocationDescription = (
  locationDescription: string
): string => {
  const coordinates = parseCoordinates(locationDescription);
  if (coordinates) {
    return locationDescription.replace(/x: \d+(\.\d+)?, y: \d+(\.\d+)?$/, "");
  }
  return locationDescription;
};
