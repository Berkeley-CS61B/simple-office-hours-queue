import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Layout from '../components/layout/Layout';
import { useSession } from 'next-auth/react';

const Home: NextPage = () => {
  const { data: session } = useSession();
  const QueueLayout = dynamic(() => import('../components/queue/QueueLayout'));

  return (
    <Layout>{session && session.user && <QueueLayout userRole={session.user.role} userId={session.user.id} />}</Layout>
  );
};

export default Home;
