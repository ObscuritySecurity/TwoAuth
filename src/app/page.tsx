
'use client';

import { useState, useEffect, useContext, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';

import { AppContext } from '@/context/app-context';
import { SplashScreen } from '@/components/layout/splash-screen';
import { LockScreen } from '@/components/auth/lock-screen';
import { AppHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/icons/logo-icon';
import { QuickActions } from '@/components/auth/quick-actions';
import { translations } from '@/lib/translations';
import { DiscreetMode } from '@/components/auth/discreet-mode';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the TOTP list for faster initial page load
const TotpList = dynamic(() => import('@/components/auth/totp-list').then(mod => mod.TotpList), {
  ssr: false,
  loading: () => <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
});


// A component to display fake codes for Panic Mode
function PanicModeList() {
    const fakeCodes = [
        { id: 'fake-1', issuer: 'Proton', account: 'user@proton.me', secret: 'FAKEKEY1', category: 'Email' },
        { id: 'fake-2', issuer: 'Discord', account: 'user#1234', secret: 'FAKEKEY2', category: 'Social' },
        { id: 'fake-3', issuer: 'Bitwarden', account: 'user@email.com', secret: 'FAKEKEY3', category: 'Security' },
    ];
    return <TotpList codes={fakeCodes} isPanicMode={true} />;
}


export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const context = useContext(AppContext);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!context) {
    return <SplashScreen />;
  }

  const { isInitialized, isLocked, settings, codes, getCategories, isPanicModeActive, codesByCategory, hasMasterPassword } = context;
  const t = translations[settings.language as keyof typeof translations] || translations.en;

  if (!isClient || !isInitialized) {
    return <SplashScreen />;
  }

  if (isLocked || !hasMasterPassword) {
    if (settings.discreetMode.app !== 'none' && hasMasterPassword) {
        return <DiscreetMode />;
    }
    return <LockScreen />;
  }

  const categories = getCategories();

  return (
    <>
      <AppHeader />
      <QuickActions />
      <main className="flex-1 overflow-y-auto p-4">
        {isPanicModeActive ? (
            <PanicModeList />
        ) : codes.length > 0 ? (
          <div className="space-y-6">
            {categories.map((category) => (
                <div key={category}>
                    <h2 className="mb-2 font-headline text-lg font-semibold text-muted-foreground">{category}</h2>
                    <TotpList codes={codesByCategory[category] || []} />
                </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div
              className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10"
              data-ai-hint="security shield"
            >
              <LogoIcon className="h-12 w-12 text-primary" />
            </div>
            <h2 className="font-headline text-2xl font-bold">
              {t.home.emptyTitle}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t.home.emptySubtitle}
            </p>
            <Button asChild className="mt-6">
              <Link href="/add">
                <Plus className="mr-2 h-4 w-4" /> {t.home.emptyButton}
              </Link>
            </Button>
          </div>
        )}
      </main>
      {!isPanicModeActive && codes.length > 0 && (
        <Link
          href="/add"
          className="absolute bottom-6 right-6 z-10"
          aria-label={t.home.addCodeAria}
        >
          <Button
            variant="default"
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      )}
    </>
  );
}
