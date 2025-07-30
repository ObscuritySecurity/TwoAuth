
'use client';

import { useContext } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { AppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface FakeNotesProps {
  onTriggerPin: () => void;
}

export function FakeNotes({ onTriggerPin }: FakeNotesProps) {
  const context = useContext(AppContext);

  if (!context) return null;
  const { t } = context;

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center justify-between border-b p-4">
        <Button variant="ghost" size="icon" onClick={onTriggerPin}>
          <ArrowLeft />
        </Button>
        <h1 className="font-headline text-xl font-bold">{t.discreet.notesTitle}</h1>
        <Button variant="ghost" size="icon">
            <Plus />
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <Textarea
          placeholder={t.discreet.notesPlaceholder}
          className="h-full w-full resize-none border-none focus-visible:ring-0"
        />
      </main>
    </div>
  );
}
