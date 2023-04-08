import { useState } from 'react';
import { Button, Flex, Input, Text } from '@chakra-ui/react';
import { trpc } from '../../utils/trpc';
import { EMAIL_REGEX } from '../../utils/constants';

/** Allows staff to search for user's log */
const GlobalLog = () => {
  const [email, setEmail] = useState('');
  const { refetch: fetchTicketsWithEmail } = trpc.ticket.getTicketsWithUserEmail.useQuery(
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

    console.log('Helped', ticketData.data.helpedTickets);
    console.log('Created', ticketData.data.createdTickets);
  };

  return (
    <Flex mt={4} ml={4} mr={4} mb={10} flexDirection='column'>
      <Text fontSize='3xl' fontWeight='semibold' mb={3}>
        Global Log
      </Text>
      <Input id='email' placeholder='Email' onChange={e => setEmail(e.target.value)} />
      <Button disabled={!email.match(EMAIL_REGEX)} onClick={handleLookup}>
        Search
      </Button>
    </Flex>
  );
};

export default GlobalLog;
