'use client';

import { useContext, useState, useEffect } from 'react';
import { AppContext } from '@/context/app-context';
import { LogoIcon } from '@/components/icons/logo-icon';
import { translations } from '@/lib/translations';

export function SplashScreen() {
  const context = useContext(AppContext);
  // Default to English on server and initial client render to prevent hydration mismatch.
  const [t, setT] = useState(translations.en);
  
  useEffect(() => {
    // On client side, after mount, set the correct language.
    if (context?.settings?.language) {
        const lang = context.settings.language as keyof typeof translations;
        setT(translations[lang] || translations.en);
    }
  }, [context?.settings?.language]);


  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <LogoIcon animated className="h-24 w-24" />
      <h1 className="mt-4 font-headline text-3xl font-bold tracking-wider text-foreground">
        TwoAuth
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t.splash.subtitle}
      </p>
    </div>
  );
}
