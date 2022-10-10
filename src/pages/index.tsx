import { NextPage } from 'next';
import Layout from '../components/layout/Layout';
import { useSession } from 'next-auth/react';
import { trpc } from '../utils/trpc';
import { useEffect, useState } from 'react';
import { configureAbly } from '@ably-labs/react-hooks';
import { clientEnv } from '../env/schema.mjs';
import { UserRole } from '@prisma/client';
import CreateTicket from '../components/queue/CreateTicket';
import TicketQueue from '../components/queue/TicketQueue';
import Broadcast from '../components/queue/Broadcast';

// TODO Verify that anyone cant make a request to any endpoint (https://next-auth.js.org/configuration/nextjs#unstable_getserversession)
const Home: NextPage = () => {
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string>('');
  const [isAblyConnected, setIsAblyConnected] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>();

  trpc.useQuery(['user.getUserRole', { id: userId }], {
    enabled: userId !== '',
	refetchOnWindowFocus: false,
	onSuccess: (data: UserRole) => {
	  setUserRole(data);
	}
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
