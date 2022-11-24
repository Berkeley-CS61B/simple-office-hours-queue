import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { Flex } from '@chakra-ui/react';
import { Navbar } from './Navbar';
import { ReactNode, useEffect } from 'react';
import ReceiveBroadcast from '../queue/ReceiveBroadcast';
import Landing from './Landing';

interface LayoutProps {
  children: ReactNode;
  isAblyConnected: boolean;
}
/**
 * Layout component that wraps all pages.
 * Provides a navbar and ensures that the user is logged in.
 */
const Layout = (props: LayoutProps) => {
  const { children, isAblyConnected } = props;

  useEffect(() => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification. We suggest using a different browser.');
    } else if (Notification.permission === 'denied' || Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'denied' || permission === 'default') {
          alert('We highly recommend enabling desktop notifications to receive updates on your queue status.');
        }
      });
    }
  }, []);

  const { data: session, status } = useSession();

  return (
    <>
      <Head>
        <title>Office Hours Queue</title>
        <meta name='OH Queue' content='Office Hours Queue' />
      </Head>

      <Flex h='100%' direction='column'>
        <>
          <Navbar />
          {!session && status !== 'loading' && <Landing />}
          {status === 'authenticated' && <>{children}</>}
          {isAblyConnected && <ReceiveBroadcast />}
        </>
      </Flex>
    </>
  );
};

Layout.defaultProps = {
  isAblyConnected: false,
};

export default Layout;
