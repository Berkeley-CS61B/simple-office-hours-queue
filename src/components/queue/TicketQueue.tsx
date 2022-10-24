import { useEffect } from 'react';
import { TicketStatus, UserRole } from '@prisma/client';
import { Flex, Skeleton, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { trpc } from '../../utils/trpc';
import { useChannel } from '@ably-labs/react-hooks';
import { uppercaseFirstLetter } from '../../utils/utils';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import TicketList from './TicketList';

interface TicketQueueProps {
  userRole: UserRole;
  isPendingStageEnabled: boolean;
  isQueueOpen: boolean;
}

/**
 * TicketQueue component that displays the tabs for the different ticket statuses
 * and renders the TicketList component for each tab
 */
const TicketQueue = (props: TicketQueueProps) => {
  const { userRole, isPendingStageEnabled, isQueueOpen } = props;

  const context = trpc.useContext();

  /**
   * Ably channel to receive updates on ticket status.
   * This is used to update the ticket queue in real time.
   */
  useChannel('tickets', ticketData => {
    const message = ticketData.name;

    const shouldInvalidateOpen = [
      'new-ticket',
      'tickets-approved',
      'tickets-assigned',
      'tickets-requeued',
      'tickets-reopened',
      'ticket-closed',
      'all-tickets-closed',
    ];
    const shouldInvalidateAssigned = [
      'tickets-assigned',
      'tickets-resolved',
      'tickets-requeued',
      'all-tickets-closed',
      'ticket-closed',
    ];
    const shouldInvalidatePending = ['new-ticket', 'tickets-approved', 'all-tickets-closed', 'ticket-closed'];

    if (shouldInvalidateOpen.includes(message)) {
      context.ticket.getTicketsWithStatus.invalidate({ status: TicketStatus.OPEN });
    }
    if (shouldInvalidateAssigned.includes(message)) {
      context.ticket.getTicketsWithStatus.invalidate({ status: TicketStatus.ASSIGNED });
    }
    if (shouldInvalidatePending.includes(message)) {
      context.ticket.getTicketsWithStatus.invalidate({ status: TicketStatus.PENDING });
    }
  });

  const tabs =
    userRole === UserRole.STUDENT || !isPendingStageEnabled
      ? [TicketStatus.OPEN, TicketStatus.ASSIGNED]
      : [TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.PENDING];

  const { data: openTickets, isLoading: isGetOpenTicketsLoading } = trpc.ticket.getTicketsWithStatus.useQuery(
    { status: TicketStatus.OPEN },
    { refetchOnWindowFocus: false },
  );

  const { data: assignedTickets, isLoading: isGetAssignedTicketsLoading } = trpc.ticket.getTicketsWithStatus.useQuery(
    { status: TicketStatus.ASSIGNED },
    { refetchOnWindowFocus: false },
  );

  const { data: pendingTickets, isLoading: isGetPendingTicketsLoading } = trpc.ticket.getTicketsWithStatus.useQuery(
    { status: TicketStatus.PENDING },
    { refetchOnWindowFocus: false },
  );

  // Refresh the assigned tickets every minute so the timer updates
  useEffect(() => {
    const interval = setInterval(() => {
      context.ticket.getTicketsWithStatus.invalidate({ status: TicketStatus.ASSIGNED });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!isQueueOpen) {
    return (
      <Flex alignItems='center' justifyContent='center' width='100%' mt={5}>
        <Text fontSize='2xl' fontWeight='bold'>
          Queue is currently closed
        </Text>
      </Flex>
    );
  }

  if (isGetOpenTicketsLoading || isGetAssignedTicketsLoading || isGetPendingTicketsLoading) {
    return (
      <Flex alignItems='center' justifyContent='center' width='100%' mt={5} flexDirection='column'>
        <Skeleton height='100px' width='100%' mb={4} />
        <Skeleton height='100px' width='100%' mb={4} />
        <Skeleton height='100px' width='100%' mb={4} />
      </Flex>
    );
  }

  /**
   * Helper method to return the correct ticket list based on the tab index (status)
   */
  const getTickets = (status: TicketStatus): TicketWithNames[] => {
    switch (status) {
      case TicketStatus.OPEN:
        return openTickets ?? [];
      case TicketStatus.ASSIGNED:
        return assignedTickets ?? [];
      case TicketStatus.PENDING:
        return pendingTickets ?? [];
      default:
        return [];
    }
  };

  return (
    <Flex width='full' align='left' flexDir='column' p={10}>
      <Text fontSize='2xl' mb={5}>
        Queue
      </Text>
      <Tabs isFitted variant='enclosed' isLazy>
        <TabList>
          {tabs.map(tab => (
            <Tab key={tab}>{uppercaseFirstLetter(tab) + ' (' + getTickets(tab).length + ')'}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {tabs.map(tab => {
            const tickets = getTickets(tab);
            return (
              <div key={tab}>
                <TabPanel padding='20px 0' key={tab}>
                  <TicketList tickets={tickets} ticketStatus={tab} userRole={userRole} />
                </TabPanel>
              </div>
            );
          })}
        </TabPanels>
      </Tabs>
    </Flex>
  );
};

export default TicketQueue;
