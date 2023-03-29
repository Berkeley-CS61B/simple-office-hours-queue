import { useState } from 'react';
import { Flex, Grid, GridItem, Spinner, Text } from '@chakra-ui/react';
import { Select } from 'chakra-react-select';
import StatsGraph from './StatsGraph';
import { trpc } from '../../utils/trpc';
import { TicketStats } from '../../server/trpc/router/stats';
import { useSession } from 'next-auth/react';
import StatsPanel from './StatsPanel';

interface TimeRangeType {
    type: string,
    increment: (time: Date) => Date,
    formatString: (time: Date) => string
}

export interface TimeRange {
    type: TimeRangeType,
    startTime: Date,
    endTime: Date,
}

const timeRangeTypes: {[key: string]: TimeRangeType} = {
    "day": { 
        type: "day", 
        increment: (time: Date) => {
            const timeCopy = new Date(time);
            timeCopy.setHours(time.getHours() + 1);
            return timeCopy;
        },
        formatString: (time: Date) => {
            return time.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit" });
        }
    },
    "week": { 
        type: "week", 
        increment: (time: Date) => {
            const timeCopy = new Date(time);
            timeCopy.setDate(time.getDate() + 1);
            return timeCopy;
        },
        formatString: (time: Date) => {
            return time.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
        }
    },
    "month": { 
        type: "month", 
        increment: (time: Date) => {
            const timeCopy = new Date(time);
            timeCopy.setDate(time.getDate() + 1);
            return timeCopy;
        },
        formatString: (time: Date) => {
            return time.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
        }
    },
    "all": { 
        type: "all", 
        increment: (time: Date) => {
            const timeCopy = new Date(time);
            timeCopy.setDate(time.getDate() + 1);
            return timeCopy;
        },
        formatString: (time: Date) => {
            return time.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
        }
    },
}

const timeRangeOptions: { label: string, value: TimeRangeType }[] = [{
    label: "Day",
    value: timeRangeTypes["day"]!
},
{
    label: "Week", 
    value: timeRangeTypes["week"]!
},
{
    label: "Month",
    value: timeRangeTypes["month"]!
},
{
    label: "All",
    value: timeRangeTypes["all"]!
}];

const StatsView = () => {
    const { data: session } = useSession();
    const userRole = session?.user?.role!;
    const userId = session?.user?.id!;
    const [ticketStats, setTicketStats] = useState<TicketStats[]>([]);
    const [personalTicketStats, setPersonalTicketStats] = useState<TicketStats[]>([]);
    const [globalTimeRangeOption, setGlobalTimeRangeOption] = useState(timeRangeOptions[0]);
    const [personalTimeRangeOption, setPersonalTimeRangeOption] = useState(timeRangeOptions[0]);

    const { isLoading: isStatsLoading } = trpc.stats.getTicketStats.useQuery(undefined, {
        refetchOnWindowFocus: false,
        onSuccess: data => {
            setTicketStats(data);
        }
    });
    const { isLoading: isPersonalStatsLoading } = trpc.stats.getTicketStatsHelpedByUser.useQuery({ userId: userId }, {
        refetchOnWindowFocus: false,
        onSuccess: data => {
            setPersonalTicketStats(data);
        }
    });

    const getTimeRange = (timeRangeOption: TimeRangeType | undefined, end: Date): TimeRange | undefined => {
        let start = new Date(end);
        if (!timeRangeOption) {
            return undefined;
        }
        switch (timeRangeOption.type) {
            case "day":
                start.setDate(end.getDate() - 1);
                return { type: timeRangeOption, startTime: start, endTime: end };
            case "week":
                start.setDate(end.getDate() - 7);
                start.setHours(0, 0, 0, 0); // Round down start date
                end.setHours(23, 59, 59, 999); // Round up end date
                return { type: timeRangeOption, startTime: start, endTime: end };
            case "month":
                start.setMonth(end.getMonth() - 1);
                start.setHours(0, 0, 0, 0); // Round down start date
                end.setHours(23, 59, 59, 999); // Round up end date
                return { type: timeRangeOption, startTime: start, endTime: end };
            case "all":
                start = new Date('January 1, 2023 00:00:00');
                return { type: timeRangeOption, startTime: start, endTime: end };
            default:
                return { type: timeRangeOption, startTime: start, endTime: end };
        }
    };

    return (
        <Grid m={4} h='100%' w='auto' templateRows='30px 1fr 30px 1fr' templateColumns='repeat(6, 1fr)' gap={4}>
            <GridItem rowSpan={1} colSpan={6}>
                <Flex justifyContent="space-between">
                    <Text fontSize='3xl' fontWeight='semibold' mb={3}>
                        Global Statistics
                    </Text>
                    <Select value={globalTimeRangeOption} 
                        onChange={val => setGlobalTimeRangeOption(val ?? undefined)} 
                        options={timeRangeOptions}
                        chakraStyles={{
                            container: (provided) => ({
                            ...provided,
                            width: "180px"
                            })
                        }
                    } />
                </Flex>
            </GridItem>
            <GridItem rowSpan={1} colSpan={4}>
                <StatsGraph 
                    timeRange={getTimeRange(globalTimeRangeOption?.value, new Date())}
                    stats={ticketStats} />
            </GridItem>
            <GridItem mt={4} rowSpan={1} colSpan={2}>
                { (isStatsLoading || isPersonalStatsLoading) ? (
                    <Spinner />
                ) : (
                    <StatsPanel 
                        timeRange={getTimeRange(globalTimeRangeOption?.value, new Date())}
                        stats={ticketStats} />
                )}
            </GridItem>
            <GridItem rowSpan={1} colSpan={6}>
                <Flex justifyContent="space-between">
                    <Text fontSize='3xl' fontWeight='semibold' mb={3}>
                        Personal Statistics
                    </Text>
                    <Select value={personalTimeRangeOption} 
                        onChange={val => setPersonalTimeRangeOption(val ?? undefined)} 
                        options={timeRangeOptions}
                        chakraStyles={{
                            container: (provided) => ({
                            ...provided,
                            width: "180px"
                            })
                        }
                    } />
                </Flex>
            </GridItem>
            <GridItem rowSpan={1} colSpan={4}>
                <StatsGraph 
                    timeRange={getTimeRange(personalTimeRangeOption?.value, new Date())}
                    stats={personalTicketStats} />
            </GridItem>
            <GridItem mt={4} rowSpan={1} colSpan={2}>
                { (isStatsLoading || isPersonalStatsLoading) ? (
                    <Spinner />
                ) : (
                    <StatsPanel 
                        timeRange={getTimeRange(personalTimeRangeOption?.value, new Date())}
                        stats={personalTicketStats} />
                )}
            </GridItem>
        </Grid>
    );
};

export default StatsView;