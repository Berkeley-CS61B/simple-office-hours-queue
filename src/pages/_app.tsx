// src/pages/_app.tsx
import { SessionProvider } from 'next-auth/react';
import { AppType } from 'next/app';
import { Session } from 'next-auth';
import { ChakraProvider, ColorModeScript, extendTheme, StyleFunctionProps } from '@chakra-ui/react';
import { trpc } from '../utils/trpc';
import { mode } from '@chakra-ui/theme-tools';
import { DARK_GRAY_COLOR, DARK_MODE_COLOR } from '../utils/constants';
import '../styles/globals.css';

// Make dark mode the default
// const config = {
//   initialColorMode: 'dark',
//   useSystemColorMode: false,
// };

// const theme = extendTheme({ config });

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },

  colors: {
    gray: {
      700: DARK_GRAY_COLOR,
    },
  },

  styles: {
    global: (props: StyleFunctionProps) => ({
      body: {
        bg: mode('white', DARK_MODE_COLOR)(props),
      },
    }),
  },
});

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
