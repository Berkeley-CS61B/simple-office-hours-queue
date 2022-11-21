import dynamic from 'next/dynamic';
import { NextPage } from 'next';
import Layout from '../../components/layout/Layout';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { UserRole } from '@prisma/client';
import { useToast } from '@chakra-ui/react';
import Router from 'next/router';

const AdminPage: NextPage = () => {
  const { data: session } = useSession();
  const AdminView = dynamic(() => import('../../components/admin/AdminView'));
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
  }, [authorized, userRole, toast]);

  return <Layout>{userRole && authorized && <AdminView />}</Layout>;
};

export default AdminPage;
