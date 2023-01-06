import { useToast } from '@chakra-ui/react';
import { UserRole } from '@prisma/client';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import Router, { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { trpc } from '../../utils/trpc';

/**
 * Component that renders the Personal queue page. It ensures that
 * the queue exists and the user is authorized to view the queue.
 */
const PeronalQueuePage: NextPage = () => {
  const router = useRouter();
  const queueName = router.query.name as string;
  const { data: session } = useSession();
  const toast = useToast();

  const { data: queue } = trpc.queue.getQueueByName.useQuery(
    { queueName },
    {
      enabled: queueName !== undefined && session?.user !== undefined,
      refetchOnWindowFocus: false,
      onSuccess: data => {
        if (!data) {
          toast({
            title: 'Queue does not exist',
            description: `Queue "${queueName}" does not exist.`,
            status: 'error',
            position: 'top-right',
            duration: 3000,
            isClosable: true,
          });

          if (session?.user?.role === UserRole.STAFF) {
            Router.push('/create-queue');
          } else {
            Router.push('/');
          }
        }
      },
    },
  );
  
  
  return <Layout>{queue && <p>Queue name: {queueName}. Owned by {queue.ownerId}</p>}</Layout>;
};

export default PeronalQueuePage;
