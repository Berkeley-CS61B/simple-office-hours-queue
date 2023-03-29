import { useEffect, useState } from 'react';
import { Flex, FormControl } from '@chakra-ui/react';
import { Select } from 'chakra-react-select';
import { TicketStats } from '../../server/trpc/router/stats';
import { LineChart, Line, CartesianGrid, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export interface StatsGraphProps {
    stats: TicketStats[];
}

interface TimeRangeType {
    type: string,
    increment: (time: Date) => Date,
    formatString: (time: Date) => string
}

interface TimeRange {
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

const timeRangeOptions = [{
    label: "Day",
    value: timeRangeTypes["day"]
},
{
    label: "Week", 
    value: timeRangeTypes["week"]
},
{
    label: "Month",
    value: timeRangeTypes["month"]
},
{
    label: "All",
    value: timeRangeTypes["all"]
}];

enum StatType {
    HELP_TIME = "helpTime",
    RESOLVE_TIME = "resolveTime",
    NUMBER_OF_TICKETS = "numberOfTickets"
}

const statTypeOptions = [
    {
        label: "Help Time",
        value: StatType.HELP_TIME
    },
    {
        label: "Resolve Time",
        value: StatType.RESOLVE_TIME
    },
    {
        label: "Number of Tickets",
        value: StatType.NUMBER_OF_TICKETS
    }
]

const StatsGraph = (props: StatsGraphProps) => {
    const { stats } = props;
    const [timeRangeOption, setTimeRangeOption] = useState(timeRangeOptions[0]);
    const [statType, setStatType] = useState(statTypeOptions[0]);
    const [data, setData] = useState<any[]>([]);

    const getTimeRange = (end: Date) => {
        let start = new Date(end);
        if (!timeRangeOption || !timeRangeOption.value) {
            return undefined;
        }
        switch (timeRangeOption.value.type) {
            case "day":
                start.setDate(end.getDate() - 1);
                return { type: timeRangeOption.value, startTime: start, endTime: end };
            case "week":
                start.setDate(end.getDate() - 7);
                start.setHours(0, 0, 0, 0); // Round down start date
                end.setHours(23, 59, 59, 999); // Round up end date
                return { type: timeRangeOption.value, startTime: start, endTime: end };
            case "month":
                start.setMonth(end.getMonth() - 1);
                start.setHours(0, 0, 0, 0); // Round down start date
                end.setHours(23, 59, 59, 999); // Round up end date
                return { type: timeRangeOption.value, startTime: start, endTime: end };
            case "all":
                start = new Date('January 1, 2023 00:00:00');
                return { type: timeRangeOption.value, startTime: start, endTime: end };
            default:
                return { type: timeRangeOption.value, startTime: start, endTime: end };
        }
    };

    const binStatsByTime = () => {
        const now = new Date();
        if (!timeRangeOption) return {};
        const timeRange = getTimeRange(now);
        if (!timeRange) return {};

        const filteredStatsInRange = stats.filter(s => {
           return s.resolvedAt && timeRange.startTime <= s.resolvedAt && s.resolvedAt < timeRange.endTime;
        });
        
        const bins: {[key: string]: TicketStats[]} = {};
        for (let t = timeRange.startTime; t <= timeRange.endTime; t = timeRange.type!.increment(t)) {
            const start = t;
            const end = timeRange.type!.increment(start);
            bins[timeRange.type!.formatString(start)] = filteredStatsInRange.filter(s => {
                return s.resolvedAt && start <= s.resolvedAt && s.resolvedAt < end;
            });
        }
        return bins;
    };

    const resolveTime = (t: TicketStats) => {
        if (!t.resolvedAt || !t.createdAt) {
            return 0;
        }
        return Math.round(((t.resolvedAt.getTime() - t.createdAt.getTime()) / 60000) * 1000) / 1000; // in minutes, 3 decimals
    }

    const helpTime = (t: TicketStats) => {
        if (!t.resolvedAt || !t.helpedAt) {
            return 0;
        }
        return Math.round(((t.resolvedAt.getTime() - t.helpedAt.getTime()) / 60000) * 1000) / 1000; // in minutes, 3 decimals
    }

    const computeMeanAndMedian = (data: { name: string, data: number[] }[]) => {
        return data.map(d => {
            const meanResolveTime =  d.data.length > 0 ? Math.round(d.data.reduce((a, b) => a + b) / d.data.length * 1000) / 1000 : 0;
            const medianResolveTime = d.data.length > 0 ? d.data[Math.floor(d.data.length / 2)]! : 0;
            return {
                name: d.name,
                mean: meanResolveTime,
                median: medianResolveTime
            }
        });
    }

    const getResolveTimeStats = (bins: {[key: string]: TicketStats[]}) => {
        if (timeRangeOption === undefined) return [];
        const data = Object.keys(bins).map(b => ({
            name: b,
            data: bins[b]!.filter(s => s.createdAt && s.resolvedAt).map(t => resolveTime(t)).sort()
        }));

        const dataStats = computeMeanAndMedian(data);

        return dataStats.map(d => ({
            name: d.name,
            meanResolveTime: d.mean,
            medianResolveTime: d.median
        }));
    };

    const getHelpTimeStats = (bins: {[key: string]: TicketStats[]}) => {
        if (timeRangeOption === undefined) return [];
        const data = Object.keys(bins).map(b => ({
            name: b,
            data: bins[b]!.filter(s => s.createdAt && s.resolvedAt).map(t => helpTime(t)).sort((a, b) => a - b)
        }));

        console.log(data);

        const dataStats = computeMeanAndMedian(data);

        return dataStats.map(d => ({
            name: d.name,
            meanHelpTime: d.mean,
            medianHelpTime: d.median
        }));
    };

    const getNumberOfTicketStats = (bins: {[key: string]: TicketStats[]}) => {
        if (timeRangeOption === undefined) return [];
        return Object.keys(bins).map(b => ({
            name: b,
            numberOfTickets: bins[b]?.length
        }));
    };

    const getGraphLines = () =>  {
        if (statType === undefined) {
            return <></>;
        }
        switch (statType.value) {
            case StatType.HELP_TIME:
                return <>
                    <Line type="monotone" dataKey="meanHelpTime" name="Mean Help Time" stroke="#3486eb" />
                    <Line type="monotone" dataKey="medianHelpTime" name="Median Help Time" stroke="#8884d8" />
                </>;
            case StatType.RESOLVE_TIME:
                return <>
                    <Line type="monotone" dataKey="meanResolveTime" name="Mean Resolve Time" stroke="#3486eb" />
                    <Line type="monotone" dataKey="medianResolveTime" name="Median Resolve Time" stroke="#8884d8" />
                </>;
            case StatType.NUMBER_OF_TICKETS:
                return <>
                    <Line type="monotone" dataKey="numberOfTickets" name="Number of Tickets" stroke="#3486eb" />
                </>;
            default:
                return <></>
        }
    }

    useEffect(() => {
        if (statType !== undefined && statType.value === StatType.HELP_TIME) {
            setData(getHelpTimeStats(binStatsByTime()));
        } else if (statType !== undefined && statType.value === StatType.RESOLVE_TIME) {
            setData(getResolveTimeStats(binStatsByTime()))
        } else if (statType !== undefined && statType.value === StatType.NUMBER_OF_TICKETS) {
            setData(getNumberOfTicketStats(binStatsByTime()));
        }
    }, [timeRangeOption, statType]);

    return (
        <Flex direction="column" w="100%" h="100%" mt={4} ml={4}>
            <FormControl w="100%" mt={6} isRequired>
                <Flex direction={"row"} justifyContent={"space-between"}>
                    <Select value={statType} onChange={val => setStatType(val ?? undefined)} options={statTypeOptions}
                        chakraStyles={{
                            container: (provided) => ({
                            ...provided,
                            width: "100%",
                            margin: "0 10px 0 0"
                            })
                        }} />
                    <Select value={timeRangeOption} onChange={val => setTimeRangeOption(val ?? undefined)} options={timeRangeOptions}
                        chakraStyles={{
                            container: (provided) => ({
                            ...provided,
                            width: "180px"
                            })
                        }} />
                </Flex>
            </FormControl>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                    <Legend verticalAlign="top" height={36}/>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    { getGraphLines() }
                </LineChart>
            </ResponsiveContainer>
        </Flex>
    );
}

export default StatsGraph;