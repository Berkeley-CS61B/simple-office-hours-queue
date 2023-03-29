import dynamic from 'next/dynamic';
import { NextPage } from 'next';
import Layout from '../../components/layout/Layout';
import { UserRole } from '@prisma/client';

const StatsPage: NextPage = () => {
  const StatsView = dynamic(() => import('../../components/admin/StatsView'));

  return (
    <Layout restrictedTo={[UserRole.STAFF]}>
      <StatsView />
    </Layout>
  );
};

export default StatsPage;
