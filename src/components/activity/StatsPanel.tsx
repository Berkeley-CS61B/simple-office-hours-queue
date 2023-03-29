import { useEffect, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Select } from 'chakra-react-select';
import { TicketStats } from '../../server/trpc/router/stats';
import { LineChart, Line, CartesianGrid, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@chakra-ui/react'
import { TimeRange } from './StatsView';

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

    const resolveTime = (t: TicketStats) => {
        if (!t.resolvedAt || !t.createdAt) {
            return 0;
        }
        return Math.round(((t.resolvedAt.getTime() - t.createdAt.getTime()) / 60000) * 1000) / 1000; // in minutes, 3 decimals
    };

    const helpTime = (t: TicketStats) => {
        if (!t.resolvedAt || !t.helpedAt) {
            return 0;
        }
        return Math.round(((t.resolvedAt.getTime() - t.helpedAt.getTime()) / 60000) * 1000) / 1000; // in minutes, 3 decimals
    };

    const computeMean = (data: number[]) => {
        return data.length > 0 ? Math.round(data.reduce((a, b) => a + b) / data.length * 1000) / 1000 : 0;
    };

    const computeMedian = (data: number[]) => {
        return data.length > 0 ? data.sort((a, b) => a - b)[Math.floor(data.length / 2)]! : 0;
    }

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