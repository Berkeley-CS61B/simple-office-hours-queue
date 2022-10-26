import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Layout from '../components/layout/Layout';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { configureAbly } from '@ably-labs/react-hooks';
import { clientEnv } from '../env/schema.mjs';

const Home: NextPage = () => {
  const { data: session } = useSession();
  const [isAblyConnected, setIsAblyConnected] = useState(false);
  const QueueLayout = dynamic(() => import('../components/queue/QueueLayout'));

  useEffect(() => {
    if (session) {
      new Promise(resolve => {
        configureAbly({
          key: clientEnv.NEXT_PUBLIC_ABLY_CLIENT_API_KEY,
          clientId: session?.user?.id,
        });
        resolve(setIsAblyConnected(true));
      }).catch(err => console.error(err));
    }
  }, [session]);

  return (
    <Layout isAblyConnected={isAblyConnected}>
      {session && session.user && isAblyConnected && <QueueLayout userRole={session.user.role} userId={session.user.id} />}
    </Layout>
  );
};

export default Home;
