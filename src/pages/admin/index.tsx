import dynamic from 'next/dynamic';
import { NextPage } from 'next';
import Layout from '../../components/layout/Layout';
import { UserRole } from '@prisma/client';

const AdminPage: NextPage = () => {
  const AdminView = dynamic(() => import('../../components/admin/AdminView'));

  return (
    <Layout restrictedTo={[UserRole.STAFF]}>
      <AdminView />
    </Layout>
  );
};

export default AdminPage;
