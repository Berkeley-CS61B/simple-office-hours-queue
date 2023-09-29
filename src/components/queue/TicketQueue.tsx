import { useEffect, useMemo, useState } from 'react';
import { PersonalQueue, TicketStatus, UserRole } from '@prisma/client';
import { Button, Flex, Skeleton, SkeletonText, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { trpc } from '../../utils/trpc';
import { useChannel } from '@ably-labs/react-hooks';
import { uppercaseFirstLetter } from '../../utils/utils';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import TicketList from './TicketList';
import TicketCard from './TicketCard';
import { DARK_GRAY_COLOR, DARK_MODE_COLOR } from '../../utils/constants';
import PublicTicketsExistModal from '../modals/PublicTicketsExistModal';

interface TicketQueueProps {
  userRole: UserRole;
  userId: string;
  isPendingStageEnabled: boolean;
  isQueueOpen: boolean;
  personalQueue?: PersonalQueue;
}

export type TabType = TicketStatus | 'Priority' | 'Public';

/**
 * TicketQueue component that displays the tabs for the different ticket statuses
 * and renders the TicketList component for each tab
 */
const TicketQueue = (props: TicketQueueProps) => {
  const { userRole, isPendingStageEnabled, isQueueOpen, userId, personalQueue } = props;
  const clearQueueMutation = trpc.ticket.clearQueue.useMutation();
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
      'ticket-location-changed',
      'ticket-toggle-public',
    ];
    const shouldInvalidateAssigned = [
      'tickets-assigned',
      'tickets-resolved',
      'tickets-requeued',
      'all-tickets-closed',
      'ticket-closed',
      'tickets-marked-as-priority',
      'ticket-description-changed',
      'ticket-location-changed',
      'ticket-toggle-public',
    ];
    const shouldInvalidatePending = [
      'new-ticket',
      'tickets-approved',
      'all-tickets-closed',
      'ticket-closed',
      'tickets-marked-as-priority',
      'ticket-description-changed',
      'ticket-location-changed',
      'ticket-toggle-public',
    ];
    const shouldInvalidateAbsent = ['tickets-marked-as-absent', 'ticket-closed', 'ticket-location-changed'];

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

  const publicTickets = useMemo(() => {
    return openTickets?.filter(ticket => ticket.isPublic) ?? [];
  }, [openTickets]);

  const setTabs = (): TabType[] => {
    const tabs: TabType[] = [TicketStatus.OPEN, TicketStatus.ASSIGNED];
    if (userRole === UserRole.STUDENT) {
      tabs.unshift('Public');
    } else {
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
    return [
      ...(openTickets ?? []),
      ...(assignedTickets ?? []),
      ...(pendingTickets ?? []),
      ...(absentTickets ?? []),
    ].filter(
      ticket =>
        ticket.createdByUserId === userId ||
        // We make sure that the ticket is not open so that requeued tickets don't show up in the My Tickets section
        (ticket.helpedByUserId === userId && ticket.status !== TicketStatus.OPEN),
    );
  };

  const isGetTicketsLoading =
    isGetOpenTicketsLoading || isGetAssignedTicketsLoading || isGetPendingTicketsLoading || isGetAbsentTicketsLoading;

  /** Don't show priority tickets on the Open tab */
  const removePriorityTickets = (tickets: TicketWithNames[]) => {
    return tickets.filter(ticket => !ticket.isPriority);
  };

  /** Don't show public tickets on Open Tab in student view */
  const removePublicTickets = (tickets: TicketWithNames[]) => {
    return tickets.filter(ticket => !ticket.isPublic);
  };

  /**
   * Helper method to return the correct ticket list based on the tab index
   */
  const getTickets = (tab: TabType): TicketWithNames[] => {
    switch (tab) {
      case 'Priority':
        return priorityTickets ?? [];
      case 'Public':
        return publicTickets ?? [];
      case TicketStatus.OPEN:
        if (userRole === UserRole.STUDENT) {
          return removePriorityTickets(removePublicTickets(openTickets ?? []));
        }
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

  /** Gets ticket location if the ticket is pending or open */
  const getLocationOnQueue = (ticket: TicketWithNames) => {
    if (ticket.status === TicketStatus.OPEN) {
      return getTickets(TicketStatus.OPEN).findIndex(t => t.id === ticket.id);
    } else if (ticket.status === TicketStatus.PENDING) {
      return getTickets(TicketStatus.PENDING).findIndex(t => t.id === ticket.id);
    }
    return -1;
  };

  const clearQueue = async () => {
    await clearQueueMutation.mutateAsync({ personalQueueName: personalQueue?.name });
    context.ticket.getTicketsWithStatus.invalidate();
  };

  const totalNonAssignedTicketsLength =
    getTickets(TicketStatus.OPEN).length +
    getTickets(TicketStatus.PENDING).length +
    getTickets(TicketStatus.ABSENT).length;

  return (
    <Flex width='full' align='left' flexDir='column' p={4}>
      {!isQueueOpen ? (
        <Flex flexDir='column' alignItems='center' justifyContent='center' width='100%' mt={5}>
          <Text fontSize='2xl' fontWeight='bold'>
            Queue is currently closed
          </Text>
          <Button
            hidden={totalNonAssignedTicketsLength === 0 || userRole !== UserRole.STAFF}
            onClick={clearQueue}
            ml={5}
            colorScheme='green'
          >
            Clear Queue
          </Button>
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
        {getMyTickets()?.map(ticket => (
          <TicketCard
            idx={getLocationOnQueue(ticket)}
            key={ticket.id}
            ticket={ticket}
            userRole={userRole}
            userId={userId}
          />
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

      <PublicTicketsExistModal publicTickets={publicTickets} userId={userId} userRole={userRole} />
    </Flex>
  );
};

export default TicketQueue;
