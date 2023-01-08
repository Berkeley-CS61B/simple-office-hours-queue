import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Layout from '../components/layout/Layout';
import QueueLayout from '../components/queue/QueueLayout';

const Home: NextPage = () => {
  return (
    <Layout>
      <QueueLayout />
    </Layout>
  );
};

export default Home;
