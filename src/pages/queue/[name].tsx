import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Layout from '../../components/layout/Layout';

const PersonalQueuePage: NextPage = () => {
  const PersonalQueueView = dynamic(() => import('../../components/queue/PersonalQueueView'));
  
  return (
    <Layout>
      <PersonalQueueView />
    </Layout>
  );
};

export default PersonalQueuePage;
