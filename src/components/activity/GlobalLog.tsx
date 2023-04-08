import { useState } from 'react';
import { Button, Flex, Input, Spinner, Text, useToast } from '@chakra-ui/react';
import { trpc } from '../../utils/trpc';
import { EMAIL_REGEX } from '../../utils/constants';
import dynamic from 'next/dynamic';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import Link from 'next/link';

/** Allows staff to search for user's log */
const GlobalLog = () => {
  const ActivityView = dynamic(() => import('../../components/activity/ActivityView'));
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdTickets, setCreatedTickets] = useState<TicketWithNames[] | undefined>();
  const [helpedTickets, setHelpedTickets] = useState<TicketWithNames[] | undefined>();
  const toast = useToast();
  const { refetch: fetchTicketsWithEmail } = trpc.ticket.getTicketsWithUserEmail.useQuery(
    { userEmail: email, shouldSortByCreatedAt: true },
    { refetchOnWindowFocus: false, enabled: false },
  );

  const handleLookup = async () => {
    if (!email.match(EMAIL_REGEX)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    setIsLoading(() => true);
    const ticketData = await fetchTicketsWithEmail();
    setIsLoading(() => false);

    if (ticketData.data === null || ticketData.data === undefined) {
      toast({
        title: 'No user found',
        description: 'Please enter a valid staff/student email',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    setCreatedTickets(ticketData.data.createdTickets);
    setHelpedTickets(ticketData.data.helpedTickets);
  };

  return (
    <Flex mt={4} ml={4} mr={4} flexDirection='column'>
      <Text fontSize='3xl' fontWeight='semibold' mb={3}>
        Global Log
      </Text>
      <Text mb={3}>
        <Link href='/activity/global'>Click here to view all tickets</Link> or search for a user log below
      </Text>
      <Input id='email' placeholder='Email' onChange={e => setEmail(e.target.value)} />
      <Button mb={2} mt={2} colorScheme='yellow' disabled={!email.match(EMAIL_REGEX)} onClick={handleLookup}>
        Search
      </Button>
      {isLoading && <Spinner />}
      {createdTickets !== undefined && helpedTickets !== undefined && (
        <ActivityView createdTickets={createdTickets} helpedTickets={helpedTickets} />
      )}
    </Flex>
  );
};

export default GlobalLog;
