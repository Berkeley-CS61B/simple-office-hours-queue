import { Flex, Spinner, Text } from '@chakra-ui/react';
import { SessionUser } from '../../pages/api/auth/[...nextauth]';
import { trpc } from '../../utils/trpc';
import ActivityTable from './ActivityTable';

interface ActivityViewProps {
  user: SessionUser;
}

const ActivityView = (props: ActivityViewProps) => {
  const { user } = props;

  const { data: userTickets, isLoading: isTicketsLoading } = trpc.ticket.getTicketsWithUserId.useQuery({
    userId: user.id,
  }, { refetchOnWindowFocus: false });

  return (
    <>
      <Flex ml={4} mr={4} mt={4} mb={10} flexDirection='column'>
        <Text fontSize='3xl' fontWeight='semibold'>
          Activity Log
        </Text>
        <Text fontSize='xl' fontWeight='semibold'>
          Your Tickets
        </Text>
        {isTicketsLoading ? (
          <Spinner />
        ) : (
			<ActivityTable userTickets={userTickets!} />
        )}
      </Flex>
    </>
  );
};

export default ActivityView;
