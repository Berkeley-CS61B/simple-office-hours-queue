import { NextPage } from 'next';
import Layout from '../../components/layout/Layout';
import { useSession } from 'next-auth/react';
import ActivityView from '../../components/activity/ActivityView';

/**
 * Activity page which displays the activity log 
 */
const ActivityPage: NextPage = () => {
  const { data: session } = useSession();

  return <Layout>{session?.user && <ActivityView user={session.user} />}</Layout>;
};

export default ActivityPage;
