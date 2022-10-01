import type { Ticket, TicketStatus, UserRole } from "@prisma/client";
import TicketCard from "./TicketCard";
import {
  Text,
  Button,
  Flex,
  Box,
  Tag,
} from "@chakra-ui/react";
import { uppercaseFirstLetter } from "../utils";
import { useEffect, useState } from "react";

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
  
  const GroupedView = () => {
    return (
      <Flex flexDirection="column">
        {Object.keys(groupedTickets).map((assignment) => (
          <Box key={assignment}>
            <Tag p={2.5} size="lg" mr={3} colorScheme="blue" borderRadius={5}>
            {assignment}
          </Tag>
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
    <Flex flexDir="column">
      <Button onClick={handleGroupTickets} mb={4} alignSelf="flex-end">
        Group By Assignment
      </Button>
      {tickets.length === 0 && (
        <Text>No {uppercaseFirstLetter(ticketStatus)} Tickets!</Text>
      )}
      {isGrouped ? (
		<GroupedView />
      ) : (
        <>
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} userRole={userRole} />
          ))}
        </>
      )}
    </Flex>
  );
};

export default TicketList;
