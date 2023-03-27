import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '../styles/globals.css';
import NextApp, { AppProps, AppContext } from 'next/app';
import { NextPage } from 'next';
import { AuthProvider } from '../components/auth/AuthProvider';
import { AuthGuard } from '../components/auth/AuthGuard';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from 'react-query';

import {
  MantineProvider,
  ColorScheme,
  ColorSchemeProvider,
} from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { useState } from 'react';

export type NextAppPage<P = {}, IP = P> = NextPage<P, IP> & {
  requireAuth?: boolean;
};

type AppPropsWithLayout = AppProps & {
  Component: NextAppPage;
  colorScheme: ColorScheme;
};

App.getInitialProps = async (appContext: AppContext) => {
  const appProps = await NextApp.getInitialProps(appContext);
  return {
    ...appProps,
    colorScheme: 'light',
  };
};

export default function App({
  Component,
  pageProps,
  colorScheme: _colorScheme,
}: AppPropsWithLayout) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(_colorScheme);
  const queryClient = new QueryClient();

  const toggleColorScheme = (value?: ColorScheme) => {
    const nextColorScheme =
      value || (colorScheme === 'dark' ? 'light' : 'dark');
    setColorScheme(nextColorScheme);
  };

  return (
    <>
      <AuthProvider>
        <ColorSchemeProvider
          colorScheme={colorScheme}
          toggleColorScheme={toggleColorScheme}
        >
          <QueryClientProvider client={queryClient}>
            <MantineProvider
              withGlobalStyles
              withNormalizeCSS
              theme={{
                defaultRadius: 'md',
                colorScheme,
                primaryColor: 'blue',
                components: {
                  Modal: {
                    defaultProps: {
                      centered: true,
                      overlayProps: {
                        blur: 15,
                        opacity: 0.4,
                        color: '#000',
                      },
                      transitionProps: {
                        transition: 'pop',
                        duration: 400,
                      },
                    },
                  },
                },
              }}
            >
              <ModalsProvider>
                <Head>
                  <title>Baastronaut</title>
                </Head>

                {Component.requireAuth ? (
                  <AuthGuard>
                    <Component {...pageProps} />
                  </AuthGuard>
                ) : (
                  <Component {...pageProps} />
                )}
                <Notifications />
              </ModalsProvider>
            </MantineProvider>
          </QueryClientProvider>
        </ColorSchemeProvider>
      </AuthProvider>
    </>
  );
}
