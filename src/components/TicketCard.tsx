import {
  Box,
  Button,
  useColorModeValue,
  Text,
  Divider,
  Tag,
  Flex,
} from "@chakra-ui/react";
import { Ticket, TicketStatus } from "@prisma/client";
import { useSession } from "next-auth/react";
import { trpc } from "../utils/trpc";

const TicketCard = ({ ticket }: { ticket: Ticket }) => {
  const { status: sessionStatus, data: session } = useSession();
  const approveTicketMutation = trpc.useMutation("ticket.approveTicket");

  const handleApproveTicket = async () => {
    await approveTicketMutation.mutateAsync({ id: ticket.id });
  };

  const handleEditTicket = () => {
    // Open edit modal
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
      <Flex justifyContent='space-between'>
		  <Box>
          <Tag p={2.5} size="lg" mr={3} colorScheme="blue" borderRadius={5}>
            {ticket.assignment}
          </Tag>
          <Tag p={2.5} size="lg" colorScheme="orange" borderRadius={5}>
            {ticket.location}
          </Tag>
		  </Box>

		  <Box>
          {ticket.status === TicketStatus.PENDING && ( // TODO add concierge check
            <Button onClick={handleApproveTicket}>Approve</Button>
          )}
		  </Box>
      </Flex>

      {/* {sessionStatus === 'authenticated' && session.user?.id === ticket.userId && (
			<Button onClick={handleEditTicket}>Edit</Button> 
		)} */}
    </Box>
  );
};

export default TicketCard;
