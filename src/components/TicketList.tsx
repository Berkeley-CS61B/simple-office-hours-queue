import { TicketStatus, UserRole } from '@prisma/client';
import TicketCard from './TicketCard';
import { Text, Button, Flex, Box, Tag } from '@chakra-ui/react';
import { uppercaseFirstLetter } from '../utils';
import { useEffect, useState } from 'react';
import { trpc } from '../utils/trpc';
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { TicketWithNames } from '../server/router/ticket';

interface TicketListProps {
  tickets: TicketWithNames[];
  ticketStatus: TicketStatus;
  userRole: UserRole;
}

interface GroupedTicket {
  [key: string]: TicketWithNames[];
}

/**
 * TicketList component that displays the list of tickets for a given status
 */
const TicketList = (props: TicketListProps) => {
  const [isGrouped, setIsGrouped] = useState(false);
  const [groupedTickets, setGroupedTickets] = useState<GroupedTicket>({});
  const { tickets, ticketStatus, userRole } = props;
  const approveTicketsMutation = trpc.useMutation('ticket.approveTickets');
  const assignTicketsMutation = trpc.useMutation('ticket.assignTickets');
  const resolveTicketsMutation = trpc.useMutation('ticket.resolveTickets');
  const [parent] : any = useAutoAnimate();

  // TODO add loading state
  const handleApproveTickets = async (tickets: TicketWithNames[]) => {
    await approveTicketsMutation.mutateAsync({
      ticketIds: tickets.map(ticket => ticket.id),
    });
  };

  const handleAssignTickets = async (tickets: TicketWithNames[]) => {
    await assignTicketsMutation.mutateAsync({
      ticketIds: tickets.map(ticket => ticket.id),
    });
  };

  const handleResolveTickets = async (tickets: TicketWithNames[]) => {
    await resolveTicketsMutation.mutateAsync({
      ticketIds: tickets.map(ticket => ticket.id),
    });
  };

  /**
   * Helper method to return appropriate buttons (approve, help, resolve)
   * Note: We can't use isGrouped here because that applies to the entire list
   */
  const getButton = (tickets: TicketWithNames[], inGroupedView: boolean) => {
    if (userRole !== UserRole.STAFF) {
      return null;
    }

    switch (ticketStatus) {
      case TicketStatus.PENDING:
        return (
          <Button mb={4} ml={4} alignSelf='flex-end' onClick={() => handleApproveTickets(tickets)}>
            Approve all {inGroupedView && 'for ' + tickets[0]?.assignmentName}
          </Button>
        );
      case TicketStatus.OPEN:
        return (
          <Button mb={4} ml={4} alignSelf='flex-end' onClick={() => handleAssignTickets(tickets)}>
            Help all {inGroupedView && 'for ' + tickets[0]?.assignmentName}
          </Button>
        );
      case TicketStatus.ASSIGNED:
        return (
          <Button mb={4} ml={4} alignSelf='flex-end' onClick={() => handleResolveTickets(tickets)}>
            Resolve all {inGroupedView && 'for ' + tickets[0]?.assignmentName}
          </Button>
        );
    }
  };

  const GroupedView = () => {
    return (
      <Flex flexDirection='column'>
        {Object.keys(groupedTickets).map(assignment => (
          <Box key={assignment} mb='16'>
            <Tag p={2.5} mr={2} size='lg' mb={3} colorScheme='green' borderRadius={5}>
              {assignment}
            </Tag>
            {getButton(groupedTickets[assignment]!, true)}
            <Box ref={parent}>
              {groupedTickets[assignment]!.map((ticket: TicketWithNames) => (
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
        const key = ticket.assignmentName;
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
            {getButton(tickets, false)}
          </Flex>
          {isGrouped ? (
            <GroupedView />
          ) : (
            <Box ref={parent}>
              {tickets.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} userRole={userRole} />
              ))}
            </Box>
          )}
        </>
      )}
    </Flex>
  );
};

export default TicketList;
