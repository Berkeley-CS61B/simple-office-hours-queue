import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { Flex, useToast } from '@chakra-ui/react';
import { Navbar } from './Navbar';
import { ReactNode, useEffect, useState } from 'react';
import ReceiveBroadcast from '../queue/ReceiveBroadcast';
import Landing from './Landing';
import { configureAbly } from '@ably-labs/react-hooks';
import { clientEnv } from '../../env/schema.mjs';
import { UserRole } from '@prisma/client';
import Router from 'next/router';

interface LayoutProps {
  children: ReactNode;
  // If specified, the user must have one of the roles to view the page
  restrictedTo?: UserRole[];
}

/**
 * Layout component that wraps all pages.
 * Provides a navbar and ensures that the user is logged in and authorized.
 * Also configures Ably.
 */
const Layout = (props: LayoutProps) => {
  const { children } = props;
  const [isAblyConnected, setIsAblyConnected] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const toast = useToast();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification. We suggest using a different browser.');
    } else if (Notification.permission === 'denied' || Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (localStorage.getItem("notificationPermission") == null && (permission === 'denied' || permission === 'default')) {
          alert('We highly recommend enabling desktop notifications to receive updates on your queue status.');
          localStorage.setItem("notificationPermission", JSON.stringify(true));
        }
      });
    }
  }, []);

  useEffect(() => {
    if (session && session.user) {
      if (props.restrictedTo && !props.restrictedTo.includes(session.user.role)) {
        toast({
          title: 'Not Authorized',
          description: 'You are not authorized to view this page.',
          status: 'error',
          position: 'top-right',
          duration: 3000,
          isClosable: true,
        });
        Router.push('/');
      } else {
        setIsAuthorized(true);
      }

      new Promise(resolve => {
        configureAbly({
          key: clientEnv.NEXT_PUBLIC_ABLY_CLIENT_API_KEY,
          clientId: session?.user?.id,
        });
        resolve(setIsAblyConnected(true));
      }).catch(err => console.error(err));
    }
  }, [session]);

  return (
    <>
      <Head>
        <title>Office Hours Queue</title>
        <meta name='OH Queue' content='Office Hours Queue' lang="en" translate='no' dir='ltr'/>
      </Head>

      <Flex h='100%' direction='column'>
        <>
          <Navbar />
          {!session && status !== 'loading' && <Landing />}
          {status === 'authenticated' && isAuthorized && <>{children}</>}
          {isAblyConnected && <ReceiveBroadcast />}
        </>
      </Flex>
    </>
  );
};

export default Layout;
