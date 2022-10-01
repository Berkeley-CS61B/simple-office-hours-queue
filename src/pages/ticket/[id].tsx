import { NextPage } from 'next';
import Layout from '../../components/Layout';
import { useSession } from 'next-auth/react';
import { trpc } from '../../utils/trpc';
import { useEffect, useState } from 'react';
import { configureAbly } from '@ably-labs/react-hooks';
import { clientEnv } from '../../env/schema.mjs';
import { UserRole, Ticket } from '@prisma/client';
import { useRouter } from 'next/router';
import { Text } from '@chakra-ui/react';

const TicketPage: NextPage = () => {
  const router = useRouter();
  const id = Number(router.query.id);
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string>('');
  const [isAblyConnected, setIsAblyConnected] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>();
  const [ticket, setTicket] = useState<Ticket>();
  const [isInvalidTicket, setIsInvalidTicket] = useState(false);

  const { refetch: fetchUserRole } = trpc.useQuery(['user.getUserRole', { id: userId }], {
    enabled: false,
    refetchOnWindowFocus: false,
  });

  const { refetch: fetchTicket } = trpc.useQuery(['ticket.getTicket', { id }], {
    refetchOnWindowFocus: false,
    enabled: false,
    onSuccess: data => {
      if (data) {
        setTicket(data);
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

  // TODO add confetti on ticket resolve
  return (
    <Layout>
      {userRole && isAblyConnected && (
        <>
          {isInvalidTicket ? <Text>Invalid ticket</Text> : <>{ticket && <Text>Valid Ticket {ticket.status}</Text>}</>}
        </>
      )}
    </Layout>
  );
};

export default TicketPage;
