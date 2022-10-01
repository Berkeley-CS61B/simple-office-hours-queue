import { Ticket, TicketStatus, UserRole } from '@prisma/client';
import TicketCard from './TicketCard';
import { Text, Button, Flex, Box, Tag } from '@chakra-ui/react';
import { uppercaseFirstLetter } from '../utils';
import { useEffect, useState } from 'react';
import { trpc } from '../utils/trpc';

interface TicketListProps {
  tickets: Ticket[];
  ticketStatus: TicketStatus;
  userRole: UserRole;
}

interface GroupedTicket {
  [key: string]: Ticket[];
}

const TicketList = (props: TicketListProps) => {
  const [isGrouped, setIsGrouped] = useState(false);
  const [groupedTickets, setGroupedTickets] = useState<GroupedTicket>({});
  const { tickets, ticketStatus, userRole } = props;
  const approveTicketsMutation = trpc.useMutation('ticket.approveTickets');
  const assignTicketsMutation = trpc.useMutation('ticket.assignTickets');
  const resolveTicketsMutation = trpc.useMutation('ticket.resolveTickets');

  // TODO add loading state
  const handleApproveTickets = async (tickets: Ticket[]) => {
    await approveTicketsMutation.mutateAsync({
      ticketIds: tickets.map(ticket => ticket.id),
    });
  };

  const handleAssignTickets = async (tickets: Ticket[]) => {
    await assignTicketsMutation.mutateAsync({
      ticketIds: tickets.map(ticket => ticket.id),
    });
  };

  const handleResolveTickets = async (tickets: Ticket[]) => {
    await resolveTicketsMutation.mutateAsync({
      ticketIds: tickets.map(ticket => ticket.id),
    });
  };

  const GroupedView = () => {
    return (
      <Flex flexDirection='column'>
        {Object.keys(groupedTickets).map(assignment => (
          <Box key={assignment} mb='16'>
            <Tag p={2.5} mr={2} size='lg' mb={3} colorScheme='green' borderRadius={5}>
              {assignment}
            </Tag>
            {ticketStatus === TicketStatus.PENDING && userRole === UserRole.STAFF && (
              <Button onClick={() => handleApproveTickets(groupedTickets[assignment]!)}>
                Approve all for {assignment}
              </Button>
            )}
            {ticketStatus === TicketStatus.OPEN && userRole === UserRole.STAFF && (
              <Button onClick={() => handleAssignTickets(groupedTickets[assignment]!)}>
                Help all for {assignment}
              </Button>
            )}
            {ticketStatus === TicketStatus.ASSIGNED && userRole === UserRole.STAFF && (
              <Button onClick={() => handleResolveTickets(groupedTickets[assignment]!)}>
                Resolve all for {assignment}
              </Button>
            )}
            <Box>
              {groupedTickets[assignment]!.map((ticket: Ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} userRole={userRole} />
              ))}
            </Box>
          </Box>
        ))}
      </Flex>
    );
  };

  const handleGroupTickets = () => {
    setIsGrouped(!isGrouped);
  };

  useEffect(() => {
    if (isGrouped) {
      const groupedTickets = tickets.reduce((acc: any, ticket) => {
        const key = ticket.assignment;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(ticket);
        return acc;
      }, {});
      setGroupedTickets(groupedTickets);
    }
  }, [isGrouped, tickets]);

  return (
    <Flex flexDir='column'>
      {tickets.length === 0 ? (
        <Text>No {uppercaseFirstLetter(ticketStatus)} Tickets!</Text>
      ) : (
        <>
          <Flex justifyContent='end' mb={4}>
            <Button onClick={handleGroupTickets} mb={4}>
              {isGrouped ? 'Ungroup' : 'Group'} By Assignment
            </Button>
            {ticketStatus === TicketStatus.PENDING && userRole === UserRole.STAFF && (
              <Button mb={4} ml={4} alignSelf='flex-end' onClick={() => handleApproveTickets(tickets)}>
                Approve All
              </Button>
            )}
            {ticketStatus === TicketStatus.OPEN && userRole === UserRole.STAFF && (
              <Button mb={4} ml={4} alignSelf='flex-end' onClick={() => handleAssignTickets(tickets)}>
                Help All
              </Button>
            )}
            {ticketStatus === TicketStatus.ASSIGNED && userRole === UserRole.STAFF && (
              <Button mb={4} ml={4} alignSelf='flex-end' onClick={() => handleResolveTickets(tickets)}>
                Resolve All
              </Button>
            )}
          </Flex>
          {isGrouped ? (
            <GroupedView />
          ) : (
            <>
              {tickets.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} userRole={userRole} />
              ))}
            </>
          )}
        </>
      )}
    </Flex>
  );
};

export default TicketList;
