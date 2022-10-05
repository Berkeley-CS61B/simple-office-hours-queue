import { NextPage } from 'next';
import Layout from '../../components/Layout';
import { useSession } from 'next-auth/react';
import { trpc } from '../../utils/trpc';
import { useEffect, useState } from 'react';
import { UserRole } from '@prisma/client';
import { Text, useToast } from '@chakra-ui/react';
import Router from 'next/router';
import AdminView from '../../components/AdminView';

const AdminPage: NextPage = () => {
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole>();
  const toast = useToast();

  trpc.useQuery(['user.getUserRole', { id: userId }], {
    enabled: userId !== '',
    refetchOnWindowFocus: false,
    onSuccess: (data: UserRole) => {
      setUserRole(data);
    },
  });

  useEffect(() => {
    if (session) {
      setUserId(session.user?.id!);
    }
  }, [session]);

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
