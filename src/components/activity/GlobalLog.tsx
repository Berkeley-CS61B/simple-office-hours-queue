import { useState } from 'react';
import { Button, Flex, Input, Spinner, Text } from '@chakra-ui/react';
import { trpc } from '../../utils/trpc';
import { EMAIL_REGEX } from '../../utils/constants';
import dynamic from 'next/dynamic';
import { TicketWithNames } from '../../server/trpc/router/ticket';

/** Allows staff to search for user's log */
const GlobalLog = () => {
  const ActivityView = dynamic(() => import('../../components/activity/ActivityView'));
  const [email, setEmail] = useState('');
  const [createdTickets, setCreatedTickets] = useState<TicketWithNames[] | undefined>();
  const [helpedTickets, setHelpedTickets] = useState<TicketWithNames[] | undefined>();
  const { refetch: fetchTicketsWithEmail, isLoading: isTicketsLoading } = trpc.ticket.getTicketsWithUserEmail.useQuery(
    { userEmail: email, shouldSortByCreatedAt: true },
    { refetchOnWindowFocus: false, enabled: false },
  );

  const handleLookup = async () => {
    if (!email.match(EMAIL_REGEX)) {
      alert('Not an email');
      return;
    }

    const ticketData = await fetchTicketsWithEmail();

    if (ticketData.data === null || ticketData.data === undefined) {
      alert('No user found with that email');
      return;
    }

    setCreatedTickets(ticketData.data.createdTickets);
    setHelpedTickets(ticketData.data.helpedTickets);
  };

  return (
    <Flex mt={4} ml={4} mr={4} mb={10} flexDirection='column'>
      <Text fontSize='3xl' fontWeight='semibold' mb={3}>
        Global Log
      </Text>
      <Input id='email' placeholder='Email' onChange={e => setEmail(e.target.value)} />
      <Button mb={2} mt={2} colorScheme='yellow' disabled={!email.match(EMAIL_REGEX)} onClick={handleLookup}>
        Search
      </Button>
      {createdTickets !== undefined && helpedTickets !== undefined && (
        <ActivityView createdTickets={createdTickets} helpedTickets={helpedTickets} />
      )}
    </Flex>
  );
};

export default GlobalLog;
