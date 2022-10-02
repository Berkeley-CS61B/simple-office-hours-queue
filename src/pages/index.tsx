import { NextPage } from 'next';
import Layout from '../components/Layout';
import { useSession } from 'next-auth/react';
import { trpc } from '../utils/trpc';
import { useEffect, useState } from 'react';
import { configureAbly } from '@ably-labs/react-hooks';
import { clientEnv } from '../env/schema.mjs';
import { UserRole } from '@prisma/client';
import CreateTicket from '../components/CreateTicket';
import TicketQueue from '../components/TicketQueue';
import { useChannel } from '@ably-labs/react-hooks';
import Broadcast from '../components/Broadcast';

// TODO Verify that anyone cant make a request to any endpoint
const Home: NextPage = () => {
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string>('');
  const [isAblyConnected, setIsAblyConnected] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>();

  const { refetch: fetchUserRole } = trpc.useQuery(['user.getUserRole', { id: userId }], {
    enabled: false,
  });

  useEffect(() => {
    if (session) {
      setUserId(session.user?.id!);

      // Maybe better way to do this?
      new Promise(resolve => {
        configureAbly({
          key: clientEnv.NEXT_PUBLIC_ABLY_CLIENT_API_KEY,
          clientId: session?.user?.id, // Not sure if this should be different (random?)
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

  return (
    <Layout isAblyConnected={isAblyConnected}>
      {userRole && isAblyConnected && (
        <>
          {userRole === UserRole.STAFF && <Broadcast />}
          {userRole === UserRole.STUDENT && <CreateTicket />}
          <TicketQueue userRole={userRole} />
        </>
      )}
    </Layout>
  );
};

export default Home;
