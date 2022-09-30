import { Box, Button, useColorModeValue } from "@chakra-ui/react";
import { Ticket, TicketStatus } from "@prisma/client";
import { trpc } from "../utils/trpc";

const TicketCard = ({ ticket }: { ticket: Ticket }) => {
    const approveTicketMutation = trpc.useMutation("ticket.approveTicket");

	const handleApproveTicket = async () => {
		await approveTicketMutation.mutateAsync({ id: ticket.id });
	};

	return (
	  <Box
		mb={4}
		p={8}
		backgroundColor={useColorModeValue('white', 'gray.800')}
		width="full"
		borderWidth={1}
		borderRadius={8}
		boxShadow="lg"
	  >
		<p>Description: {ticket.description}</p>
		<p>Assignment: {ticket.assignment}</p>
		<p>Location: {ticket.location}</p>

		{ticket.status === TicketStatus.PENDING && (
			<Button onClick={handleApproveTicket}>Approve</Button>
		)}
	  </Box>
	);
  };

  export default TicketCard;