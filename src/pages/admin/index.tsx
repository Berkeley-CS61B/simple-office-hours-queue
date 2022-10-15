import { NextPage } from 'next';
import Layout from '../../components/layout/Layout';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { UserRole } from '@prisma/client';
import { useToast } from '@chakra-ui/react';
import Router from 'next/router';
import AdminView from '../../components/admin/AdminView';

// TODO add leaderboard and time per ticket
const AdminPage: NextPage = () => {
  const { data: session } = useSession();
  const toast = useToast();

  const userRole = session?.user?.role;
  const authorized = userRole === UserRole.STAFF;

  useEffect(() => {
    if (!userRole) {
      return;
    }

    if (!authorized) {
      toast({
        title: 'Not Authorized',
        description: 'You are not authorized to view this page.',
        status: 'error',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
      Router.push('/');
    }
  }, [authorized, userRole]);

  return <Layout>{userRole && authorized && <AdminView />}</Layout>;
};

export default AdminPage;
