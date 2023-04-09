import { Flex, Spinner, Text } from '@chakra-ui/react';
import { UserRole } from '@prisma/client';
import { NextPage } from 'next';
import ActivityTable from '../../components/activity/ActivityTable';
import Layout from '../../components/layout/Layout';
import { trpc } from '../../utils/trpc';

/** All tickets made */
const GlobalActivityPage: NextPage = () => {
  const { data, isLoading } = trpc.ticket.getAllTickets.useQuery(undefined, { refetchOnWindowFocus: false });

  return (
    <Layout restrictedTo={[UserRole.STAFF]}>
      <Flex ml={4} mt={4} flexDirection='column'>
        <Text fontSize='3xl' fontWeight='semibold'>
          Global Activity
        </Text>
        {isLoading && (
          <Flex flexDirection='column'>
            <Text>This will take a second...</Text>
            <Spinner />
          </Flex>
        )}
        {!isLoading && (
          <ActivityTable tickets={data ?? []} title={`${data?.length ?? 0} tickets`} shouldShowCreatedBy={true} />
        )}
      </Flex>
    </Layout>
  );
};

export default GlobalActivityPage;
