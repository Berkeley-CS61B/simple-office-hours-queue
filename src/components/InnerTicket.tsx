import {  UserRole } from '@prisma/client';
import { Box, SimpleGrid } from '@chakra-ui/react';
import InnerTicketInfo from './InnerTicketInfo';
import Chat from './Chat';
import { TicketWithNames } from '../server/router/ticket';

interface InnerTicketProps {
  ticket: TicketWithNames;
  userRole: UserRole;
}

const InnerTicket = (props: InnerTicketProps) => {
  const { ticket, userRole } = props;

  // TODO allow students to close their own tickets
  return (
    <SimpleGrid columns={[1, null, 2]} textAlign='center'>
      <Box mt={6}>
        <InnerTicketInfo ticket={ticket} userRole={userRole} />
      </Box>
      <Box mt={6}>
		<Chat ticketId={ticket.id} />
      </Box>
    </SimpleGrid>
  );
};

export default InnerTicket;
