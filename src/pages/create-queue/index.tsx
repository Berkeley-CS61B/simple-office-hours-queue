import dynamic from 'next/dynamic';
import { NextPage } from 'next';
import Layout from '../../components/layout/Layout';
import { UserRole } from '@prisma/client';
import CreatePersonalQueue from '../../components/queue/CreatePersonalQueue';

const CreateQueuePage: NextPage = () => {
  const AdminView = dynamic(() => import('../../components/admin/AdminView'));

  return (
    <Layout restrictedTo={[UserRole.STAFF]}>
      <CreatePersonalQueue />
    </Layout>
  );
};

export default CreateQueuePage;
