import { useState } from "react";
import { TicketStatus, UserRole } from "@prisma/client";
import {
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
import { useChannel } from '@ably-labs/react-hooks';

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

  useChannel("tickets", "new-ticket", (ticketData) => {
	const ticket : Ticket = ticketData.data;
	 console.log("added ticket", ticket)
	if (ticket.status === TicketStatus.OPEN) {
	//   setOpenTickets((prev) => [...prev, ticket]); // TODO figure out why adding a pending ticket adds it to open 
	} else if (ticket.status === TicketStatus.ASSIGNED) {
		setAssignedTickets((prev) => [...prev, ticket]);
	} else if (ticket.status === TicketStatus.PENDING) {
		setPendingTickets((prev) => [...prev, ticket]);
	} else {
		console.error('Incoming ticket status is not OPEN, ASSIGNED, or PENDING');
	}
  });

  useChannel("tickets", (res) => {
	const ticketId: number = res.data.id;
	//  Remove ticket from pendingTickets and add to openTickets
	setPendingTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));
	setOpenTickets((prev) => [...prev, res.data]);
  })

  const uppercaseFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

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
            <Tab key={tab}>{uppercaseFirstLetter(tab)}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {tabs.map((tab) => {
            const [tickets, isLoading] = getTickets(tab);
            return (
              <div key={tab}>
                {isLoading ? (
				  <Skeleton height='40px' />
                ) : (
                  <TabPanel padding='20px 0' key={tab}>
                    <TicketList tickets={tickets} />
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
