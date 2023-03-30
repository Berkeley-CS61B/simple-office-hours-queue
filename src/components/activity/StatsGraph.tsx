import { useEffect, useState } from 'react';
import { Flex, FormControl } from '@chakra-ui/react';
import { Select } from 'chakra-react-select';
import { TicketStats } from '../../server/trpc/router/stats';
import { LineChart, Line, CartesianGrid, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeRange } from './StatsView';
import { TicketStatus } from '@prisma/client';
import { computeMean, computeMedian, helpTime, resolveTime } from '../../utils/utils';

export interface StatsGraphProps {
    timeRange: TimeRange | undefined;
    stats: TicketStats[];
}

export enum StatType {
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
    const { timeRange, stats } = props;
    const [statType, setStatType] = useState(statTypeOptions[0]);
    const [data, setData] = useState<any[]>([]);

    const binStatsByTime = () => {
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

    const getResolveTimeStats = (bins: {[key: string]: TicketStats[]}) => {
        const data = Object.keys(bins).map(b => ({
            name: b,
            data: bins[b]!.filter(s => s.createdAt && s.resolvedAt).map(t => resolveTime(t)).sort()
        }));

        return data.map(d => ({
            name: d.name,
            meanResolveTime: computeMean(d.data),
            medianResolveTime: computeMedian(d.data)
        }));
    };

    const getHelpTimeStats = (bins: {[key: string]: TicketStats[]}) => {
        const data = Object.keys(bins).map(b => ({
            name: b,
            data: bins[b]!.filter(s => s.createdAt && s.resolvedAt).map(t => helpTime(t)).sort((a, b) => a - b)
        }));

        return data.map(d => ({
            name: d.name,
            meanHelpTime: computeMean(d.data),
            medianHelpTime: computeMedian(d.data)
        }));
    };

    const getNumberOfTicketStats = (bins: {[key: string]: TicketStats[]}) => {
        return Object.keys(bins).map(b => ({
            name: b,
            numberOfTickets: bins[b]?.length,
            numberOfUnresolvedTickets: bins[b]?.filter(s => s.status === TicketStatus.CLOSED).length
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
                    <Line type="monotone" dataKey="numberOfUnresolvedTickets" name="Number of Unresolved Tickets" stroke="#8884d8" />
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
    }, [timeRange, statType]);

    return (
        <Flex direction="column" w="100%" h="100%">
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
                </Flex>
            </FormControl>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                    <Legend verticalAlign="top" height={36}/>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip labelStyle={{ color: "#454545" }}/>
                    { getGraphLines() }
                </LineChart>
            </ResponsiveContainer>
        </Flex>
    );
}

export default StatsGraph;