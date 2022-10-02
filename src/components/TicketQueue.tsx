import { useState } from 'react';
import { TicketStatus, UserRole, Ticket } from '@prisma/client';
import { Flex, Skeleton, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { trpc } from '../utils/trpc';
import TicketList from './TicketList';
import { useChannel } from '@ably-labs/react-hooks';
import { uppercaseFirstLetter } from '../utils';

interface TicketQueueProps {
  userRole: UserRole;
}

/**
 * TicketQueue component that displays the tabs for the different ticket statuses
 * and renders the TicketList component for each tab 
 */
const TicketQueue = (props: TicketQueueProps) => {
  const { userRole } = props;

  const tabs =
    userRole === UserRole.STUDENT
      ? [TicketStatus.OPEN, TicketStatus.ASSIGNED]
      : [TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.PENDING];

  const [pendingTickets, setPendingTickets] = useState<Ticket[]>([]);
  const [openTickets, setOpenTickets] = useState<Ticket[]>([]);
  const [assignedTickets, setAssignedTickets] = useState<Ticket[]>([]);

  const { isLoading: isGetOpenTicketsLoading } = trpc.useQuery(
    ['ticket.getTicketsWithStatus', { status: TicketStatus.OPEN }],
    {
      refetchOnWindowFocus: false,
      onSuccess: (data: Ticket[]) => {
        setOpenTickets(data);
      },
    },
  );

  const { isLoading: isGetAssignedTicketsLoading } = trpc.useQuery(
    ['ticket.getTicketsWithStatus', { status: TicketStatus.ASSIGNED }],
    {
      refetchOnWindowFocus: false,
      onSuccess: (data: Ticket[]) => {
        setAssignedTickets(data);
      },
    },
  );

  const { isLoading: isGetPendingTicketsLoading } = trpc.useQuery(
    ['ticket.getTicketsWithStatus', { status: TicketStatus.PENDING }],
    {
      refetchOnWindowFocus: false,
      onSuccess: (data: Ticket[]) => {
        setPendingTickets(data);
      },
    },
  );

  /**
   * Ably channel to receive updates on ticket status.
   * This is used to update the ticket queue in real time.
   */
  useChannel('tickets', ticketData => {
    const message = ticketData.name;
    if (message === 'new-ticket') {
      const ticket: Ticket = ticketData.data; // Tickets are not bulk-created
      setPendingTickets(prev => [...prev, ticket]);
      return;
    }

    const tickets: Ticket[] = ticketData.data;
    switch (message) {
      case 'tickets-approved':
        setPendingTickets(prev => prev.filter(ticket => !tickets.map(t => t.id).includes(ticket.id)));
        setOpenTickets(prev => [...prev, ...tickets]);
        break;
      case 'tickets-assigned':
        setOpenTickets(prev => prev.filter(ticket => !tickets.map(t => t.id).includes(ticket.id)));
        setAssignedTickets(prev => [...prev, ...tickets]);
        break;
      case 'tickets-resolved':
        setAssignedTickets(prev => prev.filter(ticket => !tickets.map(t => t.id).includes(ticket.id)));
        break;
    }
  });

  /**
   * Helper method to return the correct ticket list based on the tab index (status)
   */
  const getTickets = (status: TicketStatus): [Ticket[], boolean] => {
    switch (status) {
      case TicketStatus.OPEN:
        return [openTickets, isGetOpenTicketsLoading];
      case TicketStatus.ASSIGNED:
        return [assignedTickets, isGetAssignedTicketsLoading];
      case TicketStatus.PENDING:
        return [pendingTickets, isGetPendingTicketsLoading];
      default:
        return [[], false];
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
            <Tab key={tab}>{uppercaseFirstLetter(tab) + ' (' + getTickets(tab)[0].length + ')'}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {tabs.map(tab => {
            const [tickets, isLoading] = getTickets(tab);
            return (
              <div key={tab}>
                {isLoading ? (
                  <Skeleton mt={4} height='60px' />
                ) : (
                  <TabPanel padding='20px 0' key={tab}>
                    <TicketList tickets={tickets} ticketStatus={tab} userRole={userRole} />
                  </TabPanel>
                )}
              </div>
            );
          })}
        </TabPanels>
      </Tabs>
    </Flex>
  );
};

export default TicketQueue;
