import { Box, Button, Collapse, Flex, Spinner, Text, useDisclosure } from '@chakra-ui/react';
import { UserRole } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { SessionUser } from '../../pages/api/auth/[...nextauth]';
import { trpc } from '../../utils/trpc';
import ActivityTable from './ActivityTable';

/**
 * Displays the activity log for the current user
 */
const ActivityView = () => {
  const { data: session } = useSession();
  const user = session?.user as SessionUser;
  const { isOpen: isHelpedTableOpen, onToggle: toggleHelpedTable } = useDisclosure();
  const { isOpen: isCreatedTableOpen, onToggle: toggleCreatedTable } = useDisclosure();

  const { data: userTickets, isLoading: isTicketsLoading } = trpc.ticket.getTicketsWithUserId.useQuery(
    { userId: user.id, shouldSortByCreatedAt: true },
    { refetchOnWindowFocus: false, enabled: !!user },
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
              <Button mr={4} onClick={toggleHelpedTable} hidden={user.role !== UserRole.STAFF}>
                {isHelpedTableOpen ? 'Hide ' : 'Show '} helped tickets
              </Button>
              <Button onClick={toggleCreatedTable}>{isCreatedTableOpen ? 'Hide ' : 'Show '} created tickets</Button>
            </Flex>

            <Box hidden={user.role !== UserRole.STAFF}>
              <Collapse in={isHelpedTableOpen} animateOpacity>
                <ActivityTable
                  tickets={userTickets?.helpedTickets ?? []}
                  title='Your helped tickets'
                  shouldShowCreatedBy={true}
                />
              </Collapse>
            </Box>

            <Box>
              <Collapse in={isCreatedTableOpen} animateOpacity>
                <ActivityTable
                  tickets={userTickets?.createdTickets ?? []}
                  title='Your created tickets'
                  shouldShowCreatedBy={false}
                />
              </Collapse>
            </Box>
          </>
        )}
      </Flex>
    </>
  );
};

export default ActivityView;
