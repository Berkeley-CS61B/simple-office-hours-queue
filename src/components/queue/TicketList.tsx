import { TicketStatus, UserRole } from '@prisma/client';
import TicketCard from './TicketCard';
import { Text, Button, Flex, Box, Tag } from '@chakra-ui/react';
import { uppercaseFirstLetter } from '../../utils/utils';
import { RefObject, useState } from 'react';
import { trpc } from '../../utils/trpc';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import { Select, SingleValue } from 'chakra-react-select';

interface TicketListProps {
  tickets: TicketWithNames[];
  ticketStatus: TicketStatus;
  userRole: UserRole;
  userId: string;
}

interface GroupedTicket {
  [key: string]: TicketWithNames[];
}

enum GroupTypes {
  Assignment = 'Assignment',
  Location = 'Location',
}

const keyToAttribute = {
  [GroupTypes.Assignment]: 'assignmentName',
  [GroupTypes.Location]: 'locationName',
};

const groupByOptions = ['-', GroupTypes.Assignment, GroupTypes.Location].map(option => ({
  label: option,
  value: option,
  id: option,
}));

interface GroupedViewProps {
  groupedTickets: GroupedTicket;
  groupedBy: keyof TicketWithNames;
  userRole: UserRole;
  userId: string;
  getButton: (
    tickets: TicketWithNames[],
    inGroupedView: boolean,
    groupedKey: keyof TicketWithNames,
  ) => JSX.Element | null | undefined;
  parent: RefObject<HTMLDivElement>;
}

/** Component that is rendered when the group button is pressed */
const GroupedView = (props: GroupedViewProps) => {
  const { groupedTickets, groupedBy, userRole, userId, getButton, parent } = props;
  return (
    <Flex flexDirection='column'>
      {Object.keys(groupedTickets).map(attribute => (
        <Box key={attribute} mb='16'>
          <Tag p={2.5} mr={2} size='lg' mb={3} colorScheme='green' borderRadius={5}>
            {attribute}
          </Tag>
          {getButton(groupedTickets[attribute] ?? [], true, groupedBy)}
          <Box ref={parent}>
            {(groupedTickets[attribute] ?? []).map((ticket: TicketWithNames) => (
              <TicketCard key={ticket.id} ticket={ticket} userRole={userRole} userId={userId} />
            ))}
          </Box>
        </Box>
      ))}
    </Flex>
  );
};

/**
 * TicketList component that displays the list of tickets for a given status
 */
const TicketList = (props: TicketListProps) => {
  const { tickets, ticketStatus, userRole, userId } = props;
  const [isGrouped, setIsGrouped] = useState(false);
  const [groupedTickets, setGroupedTickets] = useState<GroupedTicket>({});
  const [groupedBy, setGroupedBy] = useState<keyof TicketWithNames>();
  const approveTicketsMutation = trpc.ticket.approveTickets.useMutation();
  const assignTicketsMutation = trpc.ticket.assignTickets.useMutation();
  const resolveTicketsMutation = trpc.ticket.resolveTickets.useMutation();
  const [parent]: [RefObject<HTMLDivElement>, (enabled: boolean) => void] = useAutoAnimate();

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
  const getButton = (tickets: TicketWithNames[], inGroupedView: boolean, groupedKey: keyof TicketWithNames) => {
    if (userRole !== UserRole.STAFF) {
      return null;
    }

    switch (ticketStatus) {
      case TicketStatus.PENDING:
        return (
          <Button mb={4} ml={4} alignSelf='flex-end' onClick={() => handleApproveTickets(tickets)}>
            Approve all {inGroupedView && 'for ' + tickets[0]?.[groupedKey]}
          </Button>
        );
      case TicketStatus.OPEN:
        return (
          <Button mb={4} ml={4} alignSelf='flex-end' onClick={() => handleAssignTickets(tickets)}>
            Help all {inGroupedView && 'for ' + tickets[0]?.[groupedKey]}
          </Button>
        );
      case TicketStatus.ASSIGNED:
        return (
          <Button mb={4} ml={4} alignSelf='flex-end' onClick={() => handleResolveTickets(tickets)}>
            Resolve all {inGroupedView && 'for ' + tickets[0]?.[groupedKey]}
          </Button>
        );
    }
  };

  const handleGroupTickets = (groupBy: SingleValue<typeof groupByOptions[0]>) => {
    if (groupBy?.value === '-') {
      setIsGrouped(false);
      return;
    }

    if (groupBy?.value === undefined || !keyToAttribute.hasOwnProperty(groupBy?.value)) {
      return;
    }

    const attribute = keyToAttribute[groupBy?.value as GroupTypes] as keyof TicketWithNames; // ie: assignmentName
    setGroupedBy(attribute);

    const groupedTickets: GroupedTicket = {};
    tickets.forEach(ticket => {
      const curAttribute = ticket[attribute] as string; // ie: gitlet
      if (groupedTickets[curAttribute] === undefined) {
        groupedTickets[curAttribute] = [];
      }
      groupedTickets[curAttribute]?.push(ticket);
    });
    setGroupedTickets(groupedTickets);
    setIsGrouped(true);
  };

  if (tickets.length === 0) {
    return <Text>No {uppercaseFirstLetter(ticketStatus)} Tickets!</Text>;
  }

  return (
    <Flex flexDir='column'>
      <Flex justifyContent='end' mb={4}>
        <Box width='sm'>
          <Select
            options={groupByOptions}
            placeholder='Group by...'
            onChange={handleGroupTickets}
          />
        </Box>
        {getButton(tickets, false, groupedBy ?? 'assignmentName')}
      </Flex>
      {isGrouped ? (
        <GroupedView
          groupedTickets={groupedTickets}
          groupedBy={groupedBy ?? 'assignmentName'}
          userRole={userRole}
          userId={userId}
          getButton={getButton}
          parent={parent}
        />
      ) : (
        <Box ref={parent}>
          {tickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} userRole={userRole} userId={userId} />
          ))}
        </Box>
      )}
    </Flex>
  );
};

export default TicketList;
