
'use client';

import { useContext, useState, useEffect, useCallback } from 'react';
import { AppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogoIcon } from '../icons/logo-icon';
import { useToast } from '@/hooks/use-toast';
import { translations } from '@/lib/translations';
import { Fingerprint, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SelfDestructWarning() {
    const context = useContext(AppContext);
    const [timeLeft, setTimeLeft] = useState('');

    if (!context || !context.selfDestructInfo.triggerTimestamp) {
        return null;
    }

    const { selfDestructInfo, t } = context;
    const { triggerTimestamp, gracePeriod } = selfDestructInfo;
    
    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = Date.now();
            const endTime = triggerTimestamp + gracePeriod * 1000;
            const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
            
            if (remainingSeconds === 0) {
                setTimeLeft(t.lock.selfDestructImmediate);
                return;
            }

            const hours = Math.floor(remainingSeconds / 3600);
            const minutes = Math.floor((remainingSeconds % 3600) / 60);
            const seconds = remainingSeconds % 60;
            
            setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [triggerTimestamp, gracePeriod, t]);

    return (
        <Alert variant="destructive" className="mt-4 animate-pulse">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>{t.lock.selfDestructTitle}</AlertTitle>
            <AlertDescription>
                {t.lock.selfDestructDesc1} {timeLeft} {t.lock.selfDestructDesc2}
            </AlertDescription>
        </Alert>
    )
}

export function LockScreen() {
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const context = useContext(AppContext);
  const { toast } = useToast();
  
  const [t, setT] = useState(translations.en);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    if (context?.settings?.language) {
        const lang = context.settings.language as keyof typeof translations;
        setT(translations[lang] || translations.en);
    }
  }, [context?.settings?.language]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(available => {
        setIsBiometricSupported(available);
      });
    }
  }, []);
  
  const handleBiometricUnlock = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent form submission
    if (!context?.settings.isBiometricEnabled || !context?.unlockWithBiometrics) {
      return;
    }
    const success = await context.unlockWithBiometrics();
    if (!success) {
       toast({
        variant: "destructive",
        title: t.lock.biometricUnlockFailed,
        description: t.lock.biometricUnlockFailedDesc,
      })
    }
  }, [context, t.lock.biometricUnlockFailed, t.lock.biometricUnlockFailedDesc, toast]);

  if (!context) return null;
  const { unlockApp, hasMasterPassword, setMasterPassword, settings, selfDestructInfo } = context;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockApp(password)) {
      const errMessage = t.lock.incorrectPassword;
      setError(errMessage);
    }
    // Successful unlock is handled by the context setting isLocked to false
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
        setError(t.lock.passwordLengthError);
        return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.lock.passwordMismatchError);
      return;
    }
    setMasterPassword(newPassword);
    setError('');
    toast({
        title: t.lock.passwordSet,
        description: t.lock.passwordSetDesc,
    })
    // Successful setup is handled by the context updating hasMasterPassword
  };

  if (!hasMasterPassword) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-8 text-center">
        <LogoIcon className="h-20 w-20" />
        <h1 className="mt-6 font-headline text-2xl font-bold">
          {t.lock.setupTitle}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t.lock.setupSubtitle}
        </p>
        <form onSubmit={handleSetPassword} className="mt-8 w-full max-w-sm space-y-4">
          <Input
            type="password"
            placeholder={t.lock.newPasswordPlaceholder}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="text-center"
            aria-label="New Password"
          />
          <Input
            type="password"
            placeholder={t.lock.confirmPasswordPlaceholder}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="text-center"
            aria-label="Confirm New Password"
          />
           {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">
            {t.lock.saveButton}
          </Button>
        </form>
         <p className="mt-4 text-xs text-muted-foreground">
          {t.lock.passwordWarning}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background p-4">
      <LogoIcon className="h-20 w-20" />
      <h1 className="mt-6 font-headline text-2xl font-bold">{t.lock.appLocked}</h1>
      <p className="mt-2 text-muted-foreground">
        {t.lock.unlockSubtitle}
      </p>
       {selfDestructInfo.triggerTimestamp && <SelfDestructWarning />}
      <form onSubmit={handleUnlock} className="mt-8 w-full max-w-xs space-y-4">
        <Input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="text-center text-lg"
          aria-label={t.lock.masterPasswordAria}
        />
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        <div className="flex items-center gap-2">
          <Button type="submit" className="flex-1">
            {t.lock.unlock}
          </Button>
          {settings.isBiometricEnabled && isBiometricSupported && (
            <Button 
                type="button" 
                size="icon" 
                variant="outline" 
                onClick={handleBiometricUnlock} 
                aria-label={t.lock.biometricAria}
                disabled={!!selfDestructInfo.triggerTimestamp}
            >
              <Fingerprint />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
