import { NextPage } from 'next';
import Layout from '../components/layout/Layout';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { configureAbly } from '@ably-labs/react-hooks';
import { clientEnv } from '../env/schema.mjs';
import QueueLayout from '../components/queue/QueueLayout';

const Home: NextPage = () => {
  const { data: session } = useSession();
  const [isAblyConnected, setIsAblyConnected] = useState(false);

  useEffect(() => {
    if (session) {
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
      {session && session.user && isAblyConnected && <QueueLayout userRole={session.user.role} />}
    </Layout>
  );
};

export default Home;
