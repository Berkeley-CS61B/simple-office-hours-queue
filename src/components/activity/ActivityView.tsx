import { Box, Button, Collapse, Flex, Spinner, Text, useDisclosure } from '@chakra-ui/react';
import { UserRole } from '@prisma/client';
import { SessionUser } from '../../pages/api/auth/[...nextauth]';
import { trpc } from '../../utils/trpc';
import ActivityTable from './ActivityTable';

interface ActivityViewProps {
  user: SessionUser;
}

const ActivityView = (props: ActivityViewProps) => {
  const { user } = props;
  const { isOpen: isHelpedTableOpen, onToggle: toggleHelpedTable } = useDisclosure();
  const { isOpen: isCreatedTableOpen, onToggle: toggleCreatedTable } = useDisclosure();

  const { data: userTickets, isLoading: isTicketsLoading } = trpc.ticket.getTicketsWithUserId.useQuery(
    { userId: user.id },
    { refetchOnWindowFocus: false },
  );

  return (
    <>
      <Flex ml={4} mr={4} mt={4} mb={10} flexDirection='column'>
        <Text fontSize='3xl' fontWeight='semibold' mb={3}>
          Activity Log
        </Text>
        {isTicketsLoading ? (
          <Spinner />
        ) : (
          <>
            <Flex>
              <Button mr={4} onClick={toggleHelpedTable}>
                {isHelpedTableOpen ? 'Hide ' : 'Show '} tickets you've helped
              </Button>
              <Button onClick={toggleCreatedTable}>
                {isCreatedTableOpen ? 'Hide ' : 'Show '} tickets you've created
              </Button>
            </Flex>

            <Box hidden={user.role !== UserRole.STAFF}>
              <Collapse in={isHelpedTableOpen} animateOpacity>
                <ActivityTable tickets={userTickets?.helpedTickets ?? []} title='Your helped tickets' />
              </Collapse>
            </Box>

            <Box>
              <Collapse in={isCreatedTableOpen} animateOpacity>
                <ActivityTable tickets={userTickets?.createdTickets ?? []} title='Your created tickets' />
              </Collapse>
            </Box>
          </>
        )}
      </Flex>
    </>
  );
};

export default ActivityView;
