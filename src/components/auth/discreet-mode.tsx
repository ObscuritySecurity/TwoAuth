
'use client';

import { useContext, useState } from 'react';
import { AppContext } from '@/context/app-context';
import { translations } from '@/lib/translations';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { FakeNotes } from './discreet/FakeNotes';
import { FakeCalendar } from './discreet/FakeCalendar';
import { FakeWeather } from './discreet/FakeWeather';

export function DiscreetMode() {
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const context = useContext(AppContext);
  
  if (!context) return null;
  const { settings, verifyDiscreetModePin, exitDiscreetMode, t } = context;

  const handlePinAttempt = () => {
    if (verifyDiscreetModePin(pin)) {
      setError('');
      setPin('');
      setIsPinDialogOpen(false);
      // Update settings to 'none' to show the real lock screen
      context.updateSettings({ discreetMode: { ...settings.discreetMode, app: 'none' } });
      exitDiscreetMode();
    } else {
      setError(t.discreet.incorrectPin);
      setPin('');
    }
  };

  const renderFakeApp = () => {
    const props = { onTriggerPin: () => setIsPinDialogOpen(true) };
    switch (settings.discreetMode.app) {
      case 'notes':
        return <FakeNotes {...props} />;
      case 'calendar':
        return <FakeCalendar {...props} />;
      case 'weather':
        return <FakeWeather {...props} />;
      default:
        return null; // Should not happen if this component is rendered
    }
  };

  return (
    <>
      {renderFakeApp()}
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t.discreet.pinDialogTitle}</DialogTitle>
                <DialogDescription>{t.discreet.pinDialogDesc}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
                <Input 
                    type="password"
                    maxLength={4}
                    placeholder={t.discreet.pinPlaceholder}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-lg tracking-widest"
                    autoFocus
                />
                {error && <p className="text-center text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
                <Button onClick={handlePinAttempt} className='w-full'>{t.discreet.unlock}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
