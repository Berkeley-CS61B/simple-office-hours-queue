import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Layout from '../../components/layout/Layout';

/**
 * Activity page which displays the activity log
 */
const ActivityPage: NextPage = () => {
  const ActivityView = dynamic(() => import('../../components/activity/ActivityView'));
  const StatsView = dynamic(() => import('../../components/activity/StatsView'))
  return (
    <Layout>
      <ActivityView />
      <StatsView />
    </Layout>
  );
};

export default ActivityPage;
