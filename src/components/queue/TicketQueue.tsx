import { useEffect, useMemo, useState } from 'react';
import { PersonalQueue, TicketStatus, UserRole } from '@prisma/client';
import { Flex, Skeleton, SkeletonText, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { trpc } from '../../utils/trpc';
import { useChannel } from '@ably-labs/react-hooks';
import { uppercaseFirstLetter } from '../../utils/utils';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import TicketList from './TicketList';
import TicketCard from './TicketCard';
import { DARK_GRAY_COLOR, DARK_MODE_COLOR } from '../../utils/constants';

interface TicketQueueProps {
  userRole: UserRole;
  userId: string;
  isPendingStageEnabled: boolean;
  isQueueOpen: boolean;
  personalQueue?: PersonalQueue;
}

export type TabType = TicketStatus | 'Priority';

/**
 * TicketQueue component that displays the tabs for the different ticket statuses
 * and renders the TicketList component for each tab
 */
const TicketQueue = (props: TicketQueueProps) => {
  const { userRole, isPendingStageEnabled, isQueueOpen, userId, personalQueue } = props;
  const [tabIndex, setTabIndex] = useState(0);

  const context = trpc.useContext();

  /** Sets tabIndex if it exists in sessionStorage */
  useEffect(() => {
    const tabIndex = sessionStorage.getItem('tabIndex');
    if (tabIndex) {
      setTabIndex(Number(tabIndex));
    }
  }, []);

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
      'tickets-marked-as-priority',
      'ticket-description-changed',
    ];
    const shouldInvalidateAssigned = [
      'tickets-assigned',
      'tickets-resolved',
      'tickets-requeued',
      'all-tickets-closed',
      'ticket-closed',
      'tickets-marked-as-priority',
      'ticket-description-changed',
    ];
    const shouldInvalidatePending = [
      'new-ticket',
      'tickets-approved',
      'all-tickets-closed',
      'ticket-closed',
      'tickets-marked-as-priority',
      'ticket-description-changed',
    ];
    const shouldInvalidateAbsent = ['tickets-marked-as-absent', 'ticket-closed'];

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

  const { data: openTickets, isLoading: isGetOpenTicketsLoading } = trpc.ticket.getTicketsWithStatus.useQuery(
    { status: TicketStatus.OPEN, personalQueueName: personalQueue?.name },
    { refetchOnWindowFocus: false },
  );

  const { data: assignedTickets, isLoading: isGetAssignedTicketsLoading } = trpc.ticket.getTicketsWithStatus.useQuery(
    { status: TicketStatus.ASSIGNED, personalQueueName: personalQueue?.name },
    { refetchOnWindowFocus: false },
  );

  const { data: pendingTickets, isLoading: isGetPendingTicketsLoading } = trpc.ticket.getTicketsWithStatus.useQuery(
    { status: TicketStatus.PENDING, personalQueueName: personalQueue?.name },
    { refetchOnWindowFocus: false },
  );

  const { data: absentTickets, isLoading: isGetAbsentTicketsLoading } = trpc.ticket.getTicketsWithStatus.useQuery(
    { status: TicketStatus.ABSENT, personalQueueName: personalQueue?.name },
    { refetchOnWindowFocus: false },
  );

  const priorityTickets = useMemo(() => {
    return openTickets?.filter(ticket => ticket.isPriority) ?? [];
  }, [openTickets]);

  const setTabs = (): TabType[] => {
    const tabs: TabType[] = [TicketStatus.OPEN, TicketStatus.ASSIGNED];

    if (userRole !== UserRole.STUDENT) {
      if (isPendingStageEnabled) {
        tabs.push(TicketStatus.PENDING);
      }
      tabs.push(TicketStatus.ABSENT);
      if (priorityTickets.length > 0) {
        tabs.unshift('Priority');
      }
    }
    return tabs;
  };

  const tabs = setTabs();

  // Refresh the assigned tickets every minute so the timer updates
  useEffect(() => {
    const interval = setInterval(() => {
      context.ticket.getTicketsWithStatus.invalidate({ status: TicketStatus.ASSIGNED });
      context.ticket.getTicketsWithStatus.invalidate({ status: TicketStatus.OPEN });
      context.ticket.getTicketsWithStatus.invalidate({ status: TicketStatus.ABSENT });
    }, 60000);
    return () => clearInterval(interval);
  }, [context.ticket.getTicketsWithStatus]);

  /* Tickets that the current user is assigned to or has created */
  const getMyTickets = () => {
    if (userRole === UserRole.STAFF || userRole === UserRole.INTERN) {
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

  /** Don't show priority tickets on the Open tab since they are in the  */
  const removePriorityTickets = (tickets: TicketWithNames[]) => {
    return tickets.filter(ticket => !ticket.isPriority);
  };

  /**
   * Helper method to return the correct ticket list based on the tab index
   */
  const getTickets = (tab: TabType): TicketWithNames[] => {
    switch (tab) {
      case 'Priority':
        return priorityTickets ?? [];
      case TicketStatus.OPEN:
        return removePriorityTickets(openTickets ?? []);
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

  /** Puts the tab in session storage */
  const handleTabChange = (tabIndex: number) => {
    setTabIndex(tabIndex);
    sessionStorage.setItem('tabIndex', tabIndex.toString());
  };

  return (
    <Flex width='full' align='left' flexDir='column' p={4}>
      {!isQueueOpen ? (
        <Flex alignItems='center' justifyContent='center' width='100%' mt={5}>
          <Text fontSize='2xl' fontWeight='bold'>
            Queue is currently closed
          </Text>
        </Flex>
      ) : (
        <></>
      )}
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
        {getMyTickets()?.map((ticket, idx) => (
          <TicketCard idx={idx} key={ticket.id} ticket={ticket} userRole={userRole} userId={userId} />
        ))}
      </Flex>
      <Text fontSize='2xl' mb={5}>
        Queue
      </Text>
      <Tabs index={tabIndex} isFitted variant='enclosed' isLazy onChange={handleTabChange}>
        <TabList
          overflowY='hidden'
          sx={{
            scrollbarWidth: 'none',
            '::-webkit-scrollbar': {
              display: 'none',
            },
          }}
        >
          {tabs.map(tab => (
            <Tab key={tab} flexShrink={0} color={tab === 'Priority' ? 'red.300' : undefined}>
              {uppercaseFirstLetter(tab) + (isGetTicketsLoading ? '(?)' : ' (' + getTickets(tab).length + ')')}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {tabs.map(tab => {
            if (isGetTicketsLoading) {
              return (
                <Skeleton
                  key={tab}
                  height='150px'
                  mt='100px'
                  mb='-75px'
                  borderRadius={8}
                  fadeDuration={1}
                  startColor={DARK_GRAY_COLOR}
                  endColor={DARK_MODE_COLOR}
                />
              );
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
