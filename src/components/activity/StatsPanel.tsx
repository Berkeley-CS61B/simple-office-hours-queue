import { Box, Flex, Text } from '@chakra-ui/react';
import { TicketStats } from '../../server/trpc/router/stats';
import { TimeRange } from './StatsView';
import { computeMean, computeMedian, helpTime, resolveTime } from '../../utils/utils';

export interface StatsGraphProps {
    timeRange: TimeRange | undefined;
    stats: TicketStats[];
}

const StatsPanel = (props: StatsGraphProps) => {
    const { timeRange, stats } = props;

    const filterTicketsInRange = () => {
        if (timeRange === undefined) return [];
        return stats.filter(s => {
            return s.resolvedAt && timeRange.startTime <= s.resolvedAt && s.resolvedAt < timeRange.endTime;
        });
    };
    const filteredStats = filterTicketsInRange();

    const helpedTickets = (stats: TicketStats[]) => {
        return stats.filter(s => s.helpedAt).length;
    }

    return (
        <Flex direction="column" w="100%" h="100%">
            <Box><Text as="b">Tickets Helped:</Text> {helpedTickets(filteredStats)}</Box>
            <Box><Text as="b">Mean Resolve Time:</Text> {computeMean(filteredStats.map(s => resolveTime(s)))} minutes</Box>
            <Box><Text as="b">Median Resolve Time:</Text> {computeMedian(filteredStats.map(s => resolveTime(s)))} minutes</Box>
            <Box><Text as="b">Mean Help Time:</Text> {computeMean(filteredStats.map(s => helpTime(s)))} minutes</Box>
            <Box><Text as="b">Median Help Time:</Text> {computeMedian(filteredStats.map(s => helpTime(s)))} minutes</Box>
        </Flex>
    );
}

export default StatsPanel;