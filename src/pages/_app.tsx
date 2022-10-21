// src/pages/_app.tsx
import { SessionProvider } from 'next-auth/react';
import { AppType } from 'next/app';
import { Session } from 'next-auth';
import { ChakraProvider, ColorModeScript, extendTheme } from '@chakra-ui/react';
import { trpc } from '../utils/trpc';
import '../styles/globals.css';

// Make dark mode the default
const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({ config });

const MyApp: AppType<{ session: Session | null }> = ({ Component, pageProps: { session, ...pageProps } }) => {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <Component {...pageProps} />
      </ChakraProvider>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
