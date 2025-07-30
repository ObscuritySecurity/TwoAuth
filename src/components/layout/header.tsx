
'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { Settings, ShieldAlert, Trash2 } from 'lucide-react';
import { AppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '../icons/logo-icon';
import { useToast } from '@/hooks/use-toast';
import { translations } from '@/lib/translations';

export function AppHeader() {
  const context = useContext(AppContext);
  const { toast } = useToast();

  if (!context) {
    return ( // Fallback header
      <header className="flex items-center justify-between border-b p-4">
        <Link href="/" className="flex items-center gap-2">
          <LogoIcon className="h-8 w-8" />
          <h1 className="font-headline text-xl font-bold">TwoAuth</h1>
        </Link>
      </header>
    );
  }

  const { settings, togglePanicMode, deletedCodes } = context;
  const t = translations[settings.language as keyof typeof translations] || translations.en;

  const handlePanic = () => {
    togglePanicMode(true);
    toast({
      title: t.header.panicTitle,
      description: t.header.panicDesc,
      variant: 'destructive',
    });
  };

  return (
    <header className="flex items-center justify-between border-b p-4">
      <Link href="/" className="flex items-center gap-2">
        <LogoIcon className="h-8 w-8" />
        <h1 className="font-headline text-xl font-bold">TwoAuth</h1>
      </Link>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={handlePanic} aria-label={t.header.panicAria}>
          <ShieldAlert className="h-5 w-5 text-destructive" />
        </Button>
         <Button variant="ghost" size="icon" asChild aria-label={t.header.trashAria}>
          <Link href="/trash" className="relative">
            <Trash2 className="h-5 w-5" />
            {deletedCodes.length > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
            )}
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild aria-label={t.header.settingsAria}>
          <Link href="/settings">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
