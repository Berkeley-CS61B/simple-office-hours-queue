import { Ticket, UserRole } from '@prisma/client';
import { Text, Box, SimpleGrid } from '@chakra-ui/react';
import InnerTicketInfo from './InnerTicketInfo';

interface InnerTicketProps {
  ticket: Ticket;
  userRole: UserRole;
}

// TODO add confetti on ticket resolve
const InnerTicket = (props: InnerTicketProps) => {
  const { ticket, userRole } = props;

  // TODO allow students to close their own tickets
  return (
    <SimpleGrid columns={[1, null, 2]} textAlign='center'>
      <Box mt={6}>
        <InnerTicketInfo ticket={ticket} userRole={userRole} />
      </Box>
      <Box mt={6}>
        <Text>Chat</Text>
      </Box>
    </SimpleGrid>
  );
};

export default InnerTicket;
