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

    const countHelpedTickets = () => {
        if (timeRange === undefined) return 0;
        return stats.filter(s => {
            const inRange = s.resolvedAt && timeRange.startTime <= s.resolvedAt && s.resolvedAt < timeRange.endTime;
            const wasHelped = s.helpedAt !== undefined;
            return inRange && wasHelped;
        }).length;
    };

    return (
        <Flex direction="column" w="100%" h="100%">
            <Box><Text as="b">Tickets Helped:</Text> {countHelpedTickets()}</Box>
            <Box><Text as="b">Mean Resolve Time:</Text> {computeMean(stats.map(s => resolveTime(s)))} minutes</Box>
            <Box><Text as="b">Median Resolve Time:</Text> {computeMedian(stats.map(s => resolveTime(s)))} minutes</Box>
            <Box><Text as="b">Mean Help Time:</Text> {computeMean(stats.map(s => helpTime(s)))} minutes</Box>
            <Box><Text as="b">Median Help Time:</Text> {computeMedian(stats.map(s => helpTime(s)))} minutes</Box>
        </Flex>
    );
}

export default StatsPanel;