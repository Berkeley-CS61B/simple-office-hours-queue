import { Ticket } from '@prisma/client';
import { Text } from '@chakra-ui/react';

interface InnerTicketProps {
  ticket: Ticket;
}

  // TODO add confetti on ticket resolve
const InnerTicket = (props: InnerTicketProps) => {
  const { ticket } = props;

  return <Text>Valid ticket</Text>;
};

export default InnerTicket;
