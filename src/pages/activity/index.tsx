import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import Layout from '../../components/layout/Layout';
import { UserRole } from '@prisma/client';

/**
 * Activity page which displays the activity log
 */
const ActivityPage: NextPage = () => {
  const ActivityView = dynamic(() => import('../../components/activity/ActivityView'));
  const StatsView = dynamic(() => import('../../components/activity/StatsView'));

  const { data: session } = useSession();

  return (
    <Layout>
      <ActivityView />
      { session?.user?.role === UserRole.STAFF && <StatsView /> }
    </Layout>
  );
};

export default ActivityPage;
