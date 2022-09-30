import type { Ticket, TicketStatus } from "@prisma/client";
import TicketCard from "./TicketCard";
import {
  Text,
  Button,
  Flex,
  Accordion,
  AccordionItem,
  AccordionButton,
  Box,
  AccordionIcon,
  AccordionPanel,
} from "@chakra-ui/react";
import { uppercaseFirstLetter } from "../utils";
import { useEffect, useState } from "react";

interface TicketListProps {
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>; // Maybe I dont need this
  ticketStatus: TicketStatus;
}

const TicketList = (props: TicketListProps) => {
  const [isGrouped, setIsGrouped] = useState(false);
  const [groupedTickets, setGroupedTickets] = useState<any>({});
  const { tickets, ticketStatus } = props;

  const GroupedView = () => {
    return (
      <Accordion allowToggle>
        {Object.keys(groupedTickets).map((key) => (
          <AccordionItem key={key}>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  {key}
                </Box>
                <AccordionIcon />
              </AccordionButton>
            <AccordionPanel pb={4}>
              {groupedTickets[key].map((ticket: Ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    );
  };

  const handleGroupTickets = () => {
	setIsGrouped(!isGrouped);
  };

  // TODO make sure adding ticket also adds to grouped tickets
  useEffect(() => {
    if (!isGrouped) {
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
  }, [isGrouped]);

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
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </>
      )}
    </Flex>
  );
};

export default TicketList;
