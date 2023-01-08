import { NextPage } from 'next';
import Layout from '../../components/layout/Layout';
import { UserRole } from '@prisma/client';
import dynamic from 'next/dynamic';

const CreateQueuePage: NextPage = () => {
  const CreatePersonalQueue = dynamic(() => import('../../components/queue/CreatePersonalQueue'));

  return (
    <Layout restrictedTo={[UserRole.STAFF]}>
      <CreatePersonalQueue />
    </Layout>
  );
};

export default CreateQueuePage;
