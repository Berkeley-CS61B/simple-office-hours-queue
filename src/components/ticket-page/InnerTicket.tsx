import { UserRole } from '@prisma/client';
import { Box, SimpleGrid } from '@chakra-ui/react';
import InnerTicketInfo from './InnerTicketInfo';
import Chat from './Chat';
import { TicketWithNames } from '../../server/trpc/router/ticket';

interface InnerTicketProps {
  ticket: TicketWithNames;
  userRole: UserRole;
  userId: string;
}

const InnerTicket = (props: InnerTicketProps) => {
  const { ticket, userRole, userId } = props;

  return (
    <SimpleGrid columns={[1, null, 2]} textAlign='center'>
      <Box mt={6}>
        <InnerTicketInfo ticket={ticket} userRole={userRole} userId={userId} />
      </Box>
      <Box mt={6}>
        <Chat ticket={ticket} />
      </Box>
    </SimpleGrid>
  );
};

export default InnerTicket;
