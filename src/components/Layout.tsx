import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { Text, Flex } from '@chakra-ui/react';
import { Navbar } from '../components/Navbar';
import { ReactNode } from 'react';
import ReceiveBroadcast from './ReceiveBroadcast';

interface LayoutProps {
  children: ReactNode;
  isAblyConnected: boolean;
}
/**
 * Layout component that wraps all pages.
 * Porivdes a navbar and ensures that the user is logged in.
 */
const Layout = (props: LayoutProps) => {
  const { children, isAblyConnected } = props;

  const { data: session, status } = useSession();

  return (
    <>
      <Head>
        <title>Office Hours Queue</title>
        <meta name='description' content='Office Hours Queue' />
      </Head>

      <Flex h='100%' direction='column'>
        <>
          <Navbar />
          {!session && status !== 'loading' && <Text>Please Log In (we will style this better)</Text>}
          {status === 'authenticated' && <>{children}</>}
		  {isAblyConnected && <ReceiveBroadcast />}
        </>
      </Flex>
    </>
  );
};

export default Layout;
