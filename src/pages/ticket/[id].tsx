import { NextPage } from 'next';
import Layout from '../../components/layout/Layout';
import { useSession } from 'next-auth/react';
import { trpc } from '../../utils/trpc';
import { useEffect, useState } from 'react';
import { UserRole } from '@prisma/client';
import Router, { useRouter } from 'next/router';
import { Text, useToast } from '@chakra-ui/react';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import InnerTicket from '../../components/ticket-page/InnerTicket';

/**
 * Component that renders the ticket page. It ensures that
 * the current user is authorized to view the ticket.
 */
const TicketPage: NextPage = () => {
  const router = useRouter();
  const id = Number(router.query.id);
  const { data: session } = useSession();

  const [userId, setUserId] = useState<string>('');
  const [ticket, setTicket] = useState<TicketWithNames>();
  const [isInvalidTicket, setIsInvalidTicket] = useState<boolean | null>(null); // Start with null to indicate loading
  const toast = useToast();

  trpc.ticket.getTicket.useQuery(
    { id },
    {
      enabled: id !== undefined && !isNaN(id),
      refetchOnWindowFocus: false,
      onSuccess: data => {
        if (data) {
          setTicket(data);
          setIsInvalidTicket(false);
        } else {
          setIsInvalidTicket(true);
        }
      },
    },
  );

  useEffect(() => {
    if (session && session.user) {
      setUserId(session.user.id);
    }
  }, [session]);

  const userRole = session?.user?.role;

  const authorized = userRole === UserRole.STAFF || ticket?.createdByUserId === userId || ticket?.isPublic;

  /**
   * If the ticket doesn't exist or user doesn't have correct access,
   * redirect them to the queue page
   */
  useEffect(() => {
    if (!userRole || isInvalidTicket === null) {
      return;
    }

    if (isInvalidTicket || !authorized) {
      toast({
        title: 'Invalid ticket',
        description: 'The ticket you are trying to access is invalid.',
        status: 'error',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
      Router.push('/');
    }
  }, [userRole, isInvalidTicket, authorized, toast]);

  return (
    <Layout>
      {userRole && authorized && (
        <>
          {isInvalidTicket ? (
            <Text>Invalid ticket</Text>
          ) : (
            <>{ticket && <InnerTicket ticket={ticket} userRole={userRole} userId={userId} />}</>
          )}
        </>
      )}
    </Layout>
  );
};

export default TicketPage;
