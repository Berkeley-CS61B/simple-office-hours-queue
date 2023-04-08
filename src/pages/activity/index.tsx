import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import Layout from '../../components/layout/Layout';
import { UserRole } from '@prisma/client';
import { Divider, Text } from '@chakra-ui/react';

/**
 * Activity page which displays the activity log
 */
const ActivityPage: NextPage = () => {
  //   const ActivityView = dynamic(() => import('../../components/activity/ActivityView'));
  const PersonalLog = dynamic(() => import('../../components/activity/PersonalLog'));
  const StatsView = dynamic(() => import('../../components/activity/StatsView'));
  const GlobalLog = dynamic(() => import('../../components/activity/GlobalLog'));

  const { data: session } = useSession();

  return (
    <Layout>
      <PersonalLog />
      <Divider ml={4} mt={4} width='97%' border='none' height='5px' backgroundColor='gray.700' borderStyle='none' />
      {session?.user?.role === UserRole.STAFF && <GlobalLog />}
      <Divider ml={4} mt={4} width='97%' border='none' height='5px' backgroundColor='gray.700' borderStyle='none' />
      {session?.user?.role === UserRole.STAFF && <StatsView />}
    </Layout>
  );
};

export default ActivityPage;
