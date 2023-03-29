import { useEffect, useState } from 'react';
import { Flex, FormControl, Grid, GridItem } from '@chakra-ui/react';
import { Select } from 'chakra-react-select';
import StatsGraph from './StatsGraph';
import { trpc } from '../../utils/trpc';
import { TicketStats } from '../../server/trpc/router/stats';

const StatsView = () => {
    const [ticketStats, setTicketStats] = useState<TicketStats[]>([])
    trpc.stats.getTicketStats.useQuery(undefined, {
        refetchOnWindowFocus: false,
        onSuccess: data => {
            setTicketStats(data);
        }
    });



    return (
        <Grid h='100%' w='100%' templateRows='repeat(2, 1fr)' templateColumns='repeat(6, 1fr)' gap={4}>
            <GridItem rowSpan={2} colSpan={4}>
                <StatsGraph stats={ticketStats} />
            </GridItem>
        </Grid>
    );
};

export default StatsView;