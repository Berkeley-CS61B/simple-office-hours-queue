import Head from 'next/head';
import { useSession, signIn } from 'next-auth/react';
import { Text, Flex, Button } from '@chakra-ui/react';
import { Navbar } from './Navbar';
import { ReactNode } from 'react';
import ReceiveBroadcast from '../queue/ReceiveBroadcast';

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
          {!session && status !== 'loading' && (
            <Flex flexDirection='column' alignItems='center'>
              <Text fontSize='4xl'>
                Welcome back,{' '}
                <Button border='1px' onClick={() => signIn('google')}>
                  Sign in
                </Button>{' '}
                to continue
              </Text>
            </Flex>
          )}
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
