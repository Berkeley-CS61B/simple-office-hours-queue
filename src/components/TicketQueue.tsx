import { useState } from "react";
import { TicketStatus, UserRole } from "@prisma/client";
import {
  Button,
  Flex,
  Skeleton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { trpc } from "../utils/trpc";
import type { Ticket } from "@prisma/client";
import TicketList from "./TicketList";
import { useChannel } from "@ably-labs/react-hooks";
import { uppercaseFirstLetter } from "../utils";

interface TicketQueueProps {
  userRole: UserRole;
}

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
    ["ticket.getTicketsWithStatus", { status: TicketStatus.OPEN }],
    {
      refetchOnWindowFocus: false,
      onSuccess: (data: Ticket[]) => {
        setOpenTickets(data);
      },
    }
  );

  const { isLoading: isGetAssignedTicketsLoading } = trpc.useQuery(
    ["ticket.getTicketsWithStatus", { status: TicketStatus.ASSIGNED }],
    {
      refetchOnWindowFocus: false,
      onSuccess: (data: Ticket[]) => {
        setAssignedTickets(data);
      },
    }
  );

  const { isLoading: isGetPendingTicketsLoading } = trpc.useQuery(
    ["ticket.getTicketsWithStatus", { status: TicketStatus.PENDING }],
    {
      refetchOnWindowFocus: false,
      onSuccess: (data: Ticket[]) => {
        setPendingTickets(data);
      },
    }
  );
  
  useChannel("tickets", (ticketData) => {
    const message = ticketData.name;
    if (message === "new-ticket") {
	  const ticket: Ticket = ticketData.data; // Tickets are not bulk-created
      // Add new ticket to the pending tickets list
      setPendingTickets((prev) => [...prev, ticket]);
    } else if (message === "ticket-approved") {
	  const tickets: Ticket[] = ticketData.data;
      // Remove ticket from pendingTickets and add to openTickets, filtering by ticket id
	  setPendingTickets((prev) => prev.filter((ticket) => !tickets.map((t) => t.id).includes(ticket.id)))
	  setOpenTickets((prev) => [...prev, ...tickets])
    } else if (message === "ticket-assigned") {
	  const ticket: Ticket = ticketData.data;
      // Remove ticket from openTickets and add to assignedTickets
      setOpenTickets((prev) => prev.filter((t) => t.id !== ticket.id));
      setAssignedTickets((prev) => [...prev, ticket]);
    }
  });

  const getTickets = (status: TicketStatus): [Ticket[], boolean] => {
    if (status === TicketStatus.OPEN) {
      return [openTickets, isGetOpenTicketsLoading];
    } else if (status === TicketStatus.ASSIGNED) {
      return [assignedTickets, isGetAssignedTicketsLoading];
    } else if (status === TicketStatus.PENDING) {
      return [pendingTickets, isGetPendingTicketsLoading];
    }
    return [[], false];
  };

  return (
    <Flex width="full" align="left" flexDir="column" p={10}>
      <Text fontSize="2xl" mb={5}>
        Queue
      </Text>
      <Tabs isFitted variant="enclosed" isLazy>
        <TabList>
          {tabs.map((tab) => (
            <Tab key={tab}>
              {uppercaseFirstLetter(tab) +
                " (" +
                getTickets(tab)[0].length +
                ")"}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {tabs.map((tab) => {
            const [tickets, isLoading] = getTickets(tab);
            return (
              <div key={tab}>
                {isLoading ? (
                  <Skeleton height="40px" />
                ) : (
                  <TabPanel padding="20px 0" key={tab}>
                    <TicketList
                      tickets={tickets}
                      ticketStatus={tab}
                      userRole={userRole}
                    />
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
