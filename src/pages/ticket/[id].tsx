import { NextPage } from 'next';
import Layout from '../../components/Layout';
import { useSession } from 'next-auth/react';
import { trpc } from '../../utils/trpc';
import { useEffect, useState } from 'react';
import { configureAbly } from '@ably-labs/react-hooks';
import { clientEnv } from '../../env/schema.mjs';
import { UserRole, Ticket } from '@prisma/client';
import Router, { useRouter } from 'next/router';
import { Text, useToast } from '@chakra-ui/react';
import InnerTicket from '../../components/InnerTicket';

const TicketPage: NextPage = () => {
  const router = useRouter();
  const id = Number(router.query.id);
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string>('');
  const [isAblyConnected, setIsAblyConnected] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>();
  const [ticket, setTicket] = useState<Ticket>();
  const [isInvalidTicket, setIsInvalidTicket] = useState<boolean | null>(null); // Start with null to indicate loading
  const toast = useToast();

  const { refetch: fetchUserRole } = trpc.useQuery(['user.getUserRole', { id: userId }], {
    enabled: false,
    refetchOnWindowFocus: false,
  });

  const { refetch: fetchTicket } = trpc.useQuery(['ticket.getTicket', { id }], {
    enabled: false,
    onSuccess: data => {
      if (data) {
        setTicket(data);
        setIsInvalidTicket(false);
      } else {
        setIsInvalidTicket(true);
      }
    },
  });

  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [id]);

  useEffect(() => {
    if (session) {
      setUserId(session.user?.id!);

      new Promise(resolve => {
        configureAbly({
          key: clientEnv.NEXT_PUBLIC_ABLY_CLIENT_API_KEY,
          clientId: session?.user?.id,
        });
        resolve(setIsAblyConnected(true));
      });
    }
  }, [session]);

  useEffect(() => {
    if (userId) {
      fetchUserRole().then(res => {
        setUserRole(res.data);
      });
    }
  }, [userId]);

  const authorized = userRole === UserRole.STAFF || ticket?.createdByUserId === userId;
  /**
   * If the ticket doesn't exist or user doesn't have correct access,
   * redirect them to the queue page
   */
  useEffect(() => {
    if (!userRole || isInvalidTicket === null) {
      return;
    }

    if (isInvalidTicket || !authorized) {
      toast({
        title: 'Invalid ticket',
        description: 'The ticket you are trying to access is invalid.',
        status: 'error',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
      Router.push('/');
    }
  }, [userRole, isInvalidTicket, authorized]);

  return (
    <Layout isAblyConnected={isAblyConnected}>
      {userRole && isAblyConnected && authorized && (
        <>{isInvalidTicket ? <Text>Invalid ticket</Text> : <>{ticket && <InnerTicket ticket={ticket} />}</>}</>
      )}
    </Layout>
  );
};

export default TicketPage;
