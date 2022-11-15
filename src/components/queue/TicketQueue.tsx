import { useEffect } from 'react';
import { TicketStatus, UserRole } from '@prisma/client';
import { Flex, Skeleton, SkeletonText, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { trpc } from '../../utils/trpc';
import { useChannel } from '@ably-labs/react-hooks';
import { uppercaseFirstLetter } from '../../utils/utils';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import TicketList from './TicketList';
import TicketCard from './TicketCard';

interface TicketQueueProps {
  userRole: UserRole;
  userId: string;
  isPendingStageEnabled: boolean;
  isQueueOpen: boolean;
}

/**
 * TicketQueue component that displays the tabs for the different ticket statuses
 * and renders the TicketList component for each tab
 */
const TicketQueue = (props: TicketQueueProps) => {
  const { userRole, isPendingStageEnabled, isQueueOpen, userId } = props;

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
      'tickets-marked-as-absent',
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
    const shouldInvalidateAbsent = ['tickets-marked-as-absent'];

    if (message === 'ticket-joined' || message === 'ticket-left') {
      context.ticket.getUsersInTicketGroup.invalidate({ ticketId: ticketData.data.id });
    }

    if (shouldInvalidateOpen.includes(message)) {
      context.ticket.getTicketsWithStatus.invalidate({ status: TicketStatus.OPEN });
    }
    if (shouldInvalidateAssigned.includes(message)) {
      context.ticket.getTicketsWithStatus.invalidate({ status: TicketStatus.ASSIGNED });
    }
    if (shouldInvalidatePending.includes(message)) {
      context.ticket.getTicketsWithStatus.invalidate({ status: TicketStatus.PENDING });
    }
    if (shouldInvalidateAbsent.includes(message)) {
      context.ticket.getTicketsWithStatus.invalidate({ status: TicketStatus.ABSENT });
    }
  });

  const tabs =
    userRole === UserRole.STUDENT || !isPendingStageEnabled
      ? [TicketStatus.OPEN, TicketStatus.ASSIGNED]
      : [TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.PENDING, TicketStatus.ABSENT];

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

  const { data: absentTickets, isLoading: isGetAbsentTicketsLoading } = trpc.ticket.getTicketsWithStatus.useQuery(
    { status: TicketStatus.ABSENT },
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

  /* Tickets that the current user is assigned to or has created */
  const getMyTickets = () => {
    if (userRole === UserRole.STAFF) {
      return assignedTickets?.filter(ticket => ticket.helpedByUserId === userId);
    }

    // Return tickets (pending, open, absent, or assigned) that the current user has created
    return [
      ...(openTickets ?? []),
      ...(assignedTickets ?? []),
      ...(pendingTickets ?? []),
      ...(absentTickets ?? []),
    ].filter(ticket => ticket.createdByUserId === userId);
  };

  const isGetTicketsLoading =
    isGetOpenTicketsLoading || isGetAssignedTicketsLoading || isGetPendingTicketsLoading || isGetAbsentTicketsLoading;

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
      case TicketStatus.ABSENT:
        return absentTickets ?? [];
      default:
        return [];
    }
  };

  return (
    <Flex width='full' align='left' flexDir='column' p={4}>
      <Flex flexDir='column' mb={4}>
        <Text fontSize='2xl' mb={2}>
          Your Tickets
        </Text>
        {isGetTicketsLoading && <SkeletonText noOfLines={1} mt={2} h={3} w={150} />}
        {getMyTickets()?.length === 0 && (
          <Text fontSize='md' color='gray.500'>
            You have no tickets
          </Text>
        )}
        {getMyTickets()?.map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket} userRole={userRole} userId={userId} />
        ))}
      </Flex>
      <Text fontSize='2xl' mb={5}>
        Queue
      </Text>
      <Tabs isFitted variant='enclosed' isLazy>
        <TabList>
          {tabs.map(tab => (
            <Tab key={tab}>
              {uppercaseFirstLetter(tab) + (isGetTicketsLoading ? '(?)' : ' (' + getTickets(tab).length + ')')}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {tabs.map(tab => {
            if (isGetTicketsLoading) {
              return <Skeleton key={tab} height='150px' mt='100px' mb='-75px' borderRadius={8} fadeDuration={1} />;
            }
            const tickets = getTickets(tab);
            return (
              <div key={tab}>
                <TabPanel padding='20px 0' key={tab}>
                  <TicketList tickets={tickets} ticketStatus={tab} userRole={userRole} userId={userId} />
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
