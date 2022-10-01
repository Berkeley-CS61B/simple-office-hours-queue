import {
  Box,
  Button,
  useColorModeValue,
  Text,
  Divider,
  Tag,
  Flex,
} from "@chakra-ui/react";
import { Ticket, TicketStatus, UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import Router from "next/router";
import { trpc } from "../utils/trpc";

interface TicketCardProps {
  ticket: Ticket;
  userRole: UserRole;
}

const TicketCard = (props: TicketCardProps) => {
  const { ticket, userRole } = props;
  const approveTicketsMutation = trpc.useMutation("ticket.approveTickets");
  const helpTicketMuation = trpc.useMutation("ticket.helpTicket");

  const handleApproveTicket = async () => {
    await approveTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
  };

  const handleHelpTicket = async () => {
	await helpTicketMuation.mutateAsync({ id: ticket.id }).then(() => {
	  Router.push(`/ticket/${ticket.id}`);
	});
  };

  return (
    <Box
      mb={4}
      p={8}
      backgroundColor={useColorModeValue("white", "gray.800")}
      width="full"
      borderWidth={1}
      borderRadius={8}
      boxShadow="lg"
    >
      <Text fontSize="2xl">{ticket.description}</Text>
      <Divider my={4} />
      <Flex justifyContent="space-between">
        <Box>
          <Tag p={2.5} size="lg" mr={3} colorScheme="blue" borderRadius={5}>
            {ticket.assignment}
          </Tag>
          <Tag p={2.5} size="lg" colorScheme="orange" borderRadius={5}>
            {ticket.location}
          </Tag>
        </Box>

        <Box>
          {ticket.status === TicketStatus.PENDING &&
            userRole === UserRole.STAFF && ( // TODO add concierge check
              <Button onClick={handleApproveTicket}>Approve</Button>
            )}

          {ticket.status === TicketStatus.OPEN &&
            userRole === UserRole.STAFF && (
              <Button onClick={handleHelpTicket}>Help</Button>
            )}
        </Box>
      </Flex>
    </Box>
  );
};

export default TicketCard;
