
'use client';

import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { AppProvider, AppContext } from '@/context/app-context';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';
import { useContext } from 'react';
import { EyeOff } from 'lucide-react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const APP_NAME = "TwoAuth";
const APP_DEFAULT_TITLE = "TwoAuth";
const APP_TITLE_TEMPLATE = "%s - TwoAuth";
const APP_DESCRIPTION = "Privacy-focused 2FA Authenticator";

// Note: We can't export metadata from a client component.
// This is a known Next.js limitation. For this app, we'll manage titles dynamically
// if needed, but the static metadata will be slightly less effective.

function AppLayout({ children }: { children: React.ReactNode }) {
  const context = useContext(AppContext);

  return (
    <div className="relative mx-auto flex h-screen max-w-sm flex-col bg-background">
      {children}
      {context?.isObfuscated && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm"
          onClick={() => context.clearObfuscation()}
        >
          <EyeOff className="h-12 w-12 text-foreground/50" />
        </div>
      )}
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* We can place static meta tags here */}
        <meta name="application-name" content={APP_NAME} />
        <title>{APP_DEFAULT_TITLE}</title>
        <meta name="description" content={APP_DESCRIPTION} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_DEFAULT_TITLE} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body
        className={cn(
          'font-body antialiased',
          inter.variable,
          spaceGrotesk.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppProvider>
            <AppLayout>{children}</AppLayout>
            <Toaster />
          </AppProvider>
        </ThemeProvider>
         <Script id="service-worker-registration">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('Service Worker registration successful with scope: ', registration.scope);
                }, function(err) {
                  console.log('Service Worker registration failed: ', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
