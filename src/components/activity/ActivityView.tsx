import { Button, Flex, Spinner, Text } from '@chakra-ui/react';
import { UserRole } from '@prisma/client';
import { SessionUser } from '../../pages/api/auth/[...nextauth]';
import { trpc } from '../../utils/trpc';
import SimpleTicketCard from './SimpleTicketCard';

interface ActivityViewProps {
  user: SessionUser;
}

const ActivityView = (props: ActivityViewProps) => {
  const { user } = props;

  const { data: userTickets, isLoading: isTicketsLoading } = trpc.ticket.getTicketsWithUserId.useQuery({
    userId: user.id,
  });

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
          <>
            {user.role === UserRole.STAFF && (
              <>
                <Button>Tickets you've helped</Button>
                {userTickets?.helpedTickets.length === 0 && <Text>No tickets helped</Text>}
                {userTickets?.helpedTickets?.map(ticket => (
					<SimpleTicketCard ticket={ticket} />
                ))}
              </>
            )}
            <Button>Tickets you've created</Button>
            {userTickets?.createdTickets.length === 0 && <Text>No tickets created</Text>}
            {userTickets?.createdTickets?.map(ticket => (
				<SimpleTicketCard ticket={ticket} />
            ))}
          </>
        )}
      </Flex>
    </>
  );
};

export default ActivityView;
