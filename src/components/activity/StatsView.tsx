import { Flex, Grid, GridItem, Input, Spinner, Text } from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import { useEffect, useState } from "react";
import { TicketStats } from "../../server/trpc/router/stats";
import { trpc } from "../../utils/trpc";
import StatsGraph from "./StatsGraph";
import StatsPanel from "./StatsPanel";

interface TimeRangeType {
  type: string;
  increment: (time: Date) => Date;
  formatString: (time: Date) => string;
}

export interface TimeRange {
  type: TimeRangeType;
  startTime: Date;
  endTime: Date;
}

const timeRangeTypes: { [key: string]: TimeRangeType } = {
  day: {
    type: "day",
    increment: (time: Date) => {
      const timeCopy = new Date(time);
      timeCopy.setHours(time.getHours() + 1);
      return timeCopy;
    },
    formatString: (time: Date) => {
      return time.toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
  week: {
    type: "week",
    increment: (time: Date) => {
      const timeCopy = new Date(time);
      timeCopy.setDate(time.getDate() + 1);
      return timeCopy;
    },
    formatString: (time: Date) => {
      return time.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
  },
  month: {
    type: "month",
    increment: (time: Date) => {
      const timeCopy = new Date(time);
      timeCopy.setDate(time.getDate() + 1);
      return timeCopy;
    },
    formatString: (time: Date) => {
      return time.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
  },
  all: {
    type: "all",
    increment: (time: Date) => {
      const timeCopy = new Date(time);
      timeCopy.setDate(time.getDate() + 1);
      return timeCopy;
    },
    formatString: (time: Date) => {
      return time.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
  },
};

const timeRangeOptions: { label: string; value: TimeRangeType }[] = [
  {
    label: "Day",
    // biome-ignore lint: Exists
    value: timeRangeTypes["day"]!,
  },
  {
    label: "Week",
    // biome-ignore lint: Exists
    value: timeRangeTypes["week"]!,
  },
  {
    label: "Month",
    // biome-ignore lint: Exists
    value: timeRangeTypes["month"]!,
  },
  {
    label: "All",
    // biome-ignore lint: none
    value: timeRangeTypes["all"]!,
  },
];

const StatsView = () => {
  const [ticketStats, setTicketStats] = useState<TicketStats[]>([]);
  const [personalTicketStats, setPersonalTicketStats] = useState<TicketStats[]>(
    [],
  );
  const [globalTimeRangeOption, setGlobalTimeRangeOption] = useState(
    timeRangeOptions[0],
  );
  const [personalTimeRangeOption, setPersonalTimeRangeOption] = useState(
    timeRangeOptions[0],
  );
  const [globalStartDate, setGlobalStartDate] = useState<Date>();
  const [personalStartDate, setPersonalStartDate] = useState<Date>();

  const {
    isFetching: isFetchingStats,
    fetchNextPage: fetchNextStatsPage,
    hasNextPage: statsHasNextPage,
  } = trpc.stats.getInfiniteTicketStats.useInfiniteQuery(
    { limit: 10000 },
    {
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        setTicketStats(
          data.pages.map((p) => p.items).reduce((a, b) => a.concat(b)),
        );
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  useEffect(() => {
    if (statsHasNextPage) {
      fetchNextStatsPage();
    }
  }, [ticketStats]);

  const {
    isFetching: isFetchingPersonalStats,
    fetchNextPage: fetchNextPersonalStatsPage,
    hasNextPage: personalStatsHasNextPage,
  } = trpc.stats.getInfiniteTicketStatsHelpedByUser.useInfiniteQuery(
    { limit: 10000 },
    {
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        setPersonalTicketStats(
          data.pages.map((p) => p.items).reduce((a, b) => a.concat(b)),
        );
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  useEffect(() => {
    if (personalStatsHasNextPage) {
      fetchNextPersonalStatsPage();
    }
  }, [personalTicketStats]);

  const isStatsLoading =
    isFetchingStats ||
    statsHasNextPage ||
    isFetchingPersonalStats ||
    personalStatsHasNextPage;

  const getStartDateFromCurrent = (timeRangeOption: TimeRangeType) => {
    let start = new Date();
    switch (timeRangeOption.type) {
      case "day":
        start.setDate(start.getDate() - 1);
        break;
      case "week":
        start.setDate(start.getDate() - 7);
        break;
      case "month":
        start.setMonth(start.getMonth() - 1);
        break;
      case "all":
        start = new Date("January 1, 2023 00:00:00");
        break;
      default:
        break;
    }
    return start;
  };

  const getTimeRange = (
    timeRangeOption: TimeRangeType | undefined,
    startDate: Date | undefined,
  ): TimeRange | undefined => {
    if (!timeRangeOption) {
      return undefined;
    }
    let start = new Date();
    if (startDate !== undefined) {
      start = startDate;
    } else {
      start = getStartDateFromCurrent(timeRangeOption);
    }

    const end = new Date(start);
    switch (timeRangeOption.type) {
      case "day":
        end.setDate(start.getDate() + 1);
        return { type: timeRangeOption, startTime: start, endTime: end };
      case "week":
        end.setDate(start.getDate() + 7);
        return { type: timeRangeOption, startTime: start, endTime: end };
      case "month":
        end.setMonth(start.getMonth() + 1);
        return { type: timeRangeOption, startTime: start, endTime: end };
      case "all":
        start = new Date("January 1, 2023 00:00:00");
        return { type: timeRangeOption, startTime: start, endTime: new Date() };
      default:
        return { type: timeRangeOption, startTime: start, endTime: end };
    }
  };

  return (
    <Grid
      m={4}
      h="100%"
      w="auto"
      templateRows="30px 1fr 30px 1fr"
      templateColumns="repeat(6, 1fr)"
      gap={4}
    >
      <GridItem rowSpan={1} colSpan={6}>
        <Flex justifyContent="flex-end" alignItems="center">
          <Text fontSize="3xl" fontWeight="semibold" mb={3} mr="auto">
            Global Statistics
          </Text>
          <Text mr={3}>Start Date:</Text>
          <Input
            mr={3}
            width="250px"
            placeholder="Select Date and Time"
            size="md"
            type="datetime-local"
            onChange={(event) =>
              setGlobalStartDate(
                event.target.value === ""
                  ? undefined
                  : new Date(event.target.value),
              )
            }
          />
          <Text mr={3}>Range:</Text>
          <Select
            value={globalTimeRangeOption}
            onChange={(val) => setGlobalTimeRangeOption(val ?? undefined)}
            options={timeRangeOptions}
            chakraStyles={{
              container: (provided) => ({
                ...provided,
                width: "180px",
              }),
            }}
          />
        </Flex>
      </GridItem>
      <GridItem rowSpan={1} colSpan={4}>
        <StatsGraph
          timeRange={getTimeRange(
            globalTimeRangeOption?.value,
            globalStartDate,
          )}
          stats={ticketStats}
        />
      </GridItem>
      <GridItem mt={4} rowSpan={1} colSpan={2}>
        {isStatsLoading ? (
          <Spinner />
        ) : (
          <StatsPanel
            timeRange={getTimeRange(
              globalTimeRangeOption?.value,
              globalStartDate,
            )}
            stats={ticketStats}
          />
        )}
      </GridItem>
      <GridItem rowSpan={1} colSpan={6}>
        <Flex justifyContent="flex-end" alignItems="center">
          <Text fontSize="3xl" fontWeight="semibold" mb={3} mr="auto">
            Personal Statistics
          </Text>
          <Text mr={3}>Start Date:</Text>
          <Input
            mr={3}
            width="250px"
            placeholder="Select Date and Time"
            size="md"
            type="datetime-local"
            onChange={(event) =>
              setPersonalStartDate(
                event.target.value === ""
                  ? undefined
                  : new Date(event.target.value),
              )
            }
          />
          <Text mr={3}>Range:</Text>
          <Select
            value={personalTimeRangeOption}
            onChange={(val) => setPersonalTimeRangeOption(val ?? undefined)}
            options={timeRangeOptions}
            chakraStyles={{
              container: (provided) => ({
                ...provided,
                width: "180px",
              }),
            }}
          />
        </Flex>
      </GridItem>
      <GridItem rowSpan={1} colSpan={4}>
        <StatsGraph
          timeRange={getTimeRange(
            personalTimeRangeOption?.value,
            personalStartDate,
          )}
          stats={personalTicketStats}
        />
      </GridItem>
      <GridItem mt={4} rowSpan={1} colSpan={2}>
        {isStatsLoading ? (
          <Spinner />
        ) : (
          <StatsPanel
            timeRange={getTimeRange(
              personalTimeRangeOption?.value,
              personalStartDate,
            )}
            stats={personalTicketStats}
          />
        )}
      </GridItem>
    </Grid>
  );
};

export default StatsView;
