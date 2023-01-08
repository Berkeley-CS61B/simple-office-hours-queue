import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Layout from '../../components/layout/Layout';

/**
 * Activity page which displays the activity log
 */
const ActivityPage: NextPage = () => {
  const ActivityView = dynamic(() => import('../../components/activity/ActivityView'));
  return (
    <Layout>
      <ActivityView />
    </Layout>
  );
};

export default ActivityPage;
