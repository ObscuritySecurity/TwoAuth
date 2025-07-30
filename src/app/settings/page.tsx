
'use client';

import { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, ShieldQuestion } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import { AppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KeyRound } from 'lucide-react';

const SettingsContent = dynamic(() => import('@/components/settings/settings-content'), {
  loading: () => <SettingsSkeleton />,
  ssr: false,
});

function SettingsSkeleton() {
  return (
    <div className="p-4 space-y-6">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

export default function SettingsPage() {
  const context = useContext(AppContext);
  const router = useRouter();
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [promptOpen, setPromptOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newSettingsPassword, setNewSettingsPassword] = useState('');
  const [confirmSettingsPassword, setConfirmSettingsPassword] = useState('');
  const [settingsPasswordError, setSettingsPasswordError] = useState('');

  // This must be initialized after context is available.
  const [isUnlocked, setIsUnlocked] = useState(context ? !context.hasSettingsPassword : false);


  useEffect(() => {
    if (context && !context.hasSettingsPassword && !context.settings.promptedForSettingsPassword) {
      setPromptOpen(true);
      context.updateSettings({ promptedForSettingsPassword: true });
    }
  }, [context]);

  if (!context) {
    router.push('/');
    return null;
  }
  
  const { hasSettingsPassword, verifySettingsPassword, setSettingsPassword, t } = context;
  const pageTitle = t.settings.title;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if(verifySettingsPassword(password)) {
        setIsUnlocked(true);
        setError('');
    } else {
        setError(t.lock.incorrectPassword);
    }
  }

  const handleSetSettingsPassword = () => {
    if (newSettingsPassword.length < 8) {
      setSettingsPasswordError(t.settings.passwordErrorLength);
      return;
    }
    if (newSettingsPassword !== confirmSettingsPassword) {
      setSettingsPasswordError(t.settings.passwordErrorMatch);
      return;
    }
    setSettingsPassword(newSettingsPassword);
    setSettingsPasswordError('');
    setNewSettingsPassword('');
    setConfirmSettingsPassword('');
    setIsPasswordDialogOpen(false);
    setIsUnlocked(true); // Unlock after setting it.
  };
  
  useEffect(() => {
    // This effect ensures that if the password state changes elsewhere (e.g., removed),
    // the component's unlocked state reflects that change.
    setIsUnlocked(!hasSettingsPassword);
  }, [hasSettingsPassword]);


  if (!isUnlocked) {
    return (
        <>
         <header className="flex items-center border-b p-4">
            <Button variant="ghost" size="icon" asChild>
            <Link href="/">
                <ArrowLeft />
            </Link>
            </Button>
            <h1 className="ml-4 font-headline text-xl font-bold">{pageTitle}</h1>
        </header>
        <div className="flex flex-col items-center justify-center flex-1 p-4">
            <Lock className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 font-headline text-xl font-bold">{t.settings.settingsPassword}</h2>
            <p className="text-muted-foreground text-center mt-2">{t.settings.settingsPasswordPrompt}</p>
             <form onSubmit={handleUnlock} className="mt-8 w-full max-w-xs space-y-4">
                <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-center text-lg"
                />
                 {error && <p className="text-sm text-destructive text-center">{error}</p>}
                <Button type="submit" className="w-full">
                    {t.lock.unlock}
                </Button>
             </form>
        </div>
        </>
    )
  }

  return (
    <>
      <header className="flex items-center border-b p-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="ml-4 font-headline text-xl font-bold">{pageTitle}</h1>
      </header>
      <SettingsContent />

      {/* Initial prompt dialog */}
      <AlertDialog open={promptOpen} onOpenChange={setPromptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldQuestion className="text-primary"/>
              {t.settings.optionalPassword.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.settings.optionalPassword.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t.settings.optionalPassword.decline}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                setPromptOpen(false);
                setIsPasswordDialogOpen(true);
            }}>
              <KeyRound className="mr-2 h-4 w-4"/>
              {t.settings.optionalPassword.accept}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialog to set the password */}
       <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{t.settings.setSettingsPasswordTitle}</DialogTitle>
                  <DialogDescription>
                      {t.settings.settingsPasswordDialogDesc}
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                    <Input 
                      id="new-settings-password" 
                      type="password" 
                      placeholder={t.settings.newPasswordPlaceholder}
                      value={newSettingsPassword}
                      onChange={(e) => setNewSettingsPassword(e.target.value)}
                    />
                    <Input 
                      id="confirm-settings-password" 
                      type="password" 
                      placeholder={t.settings.confirmPasswordPlaceholder}
                      value={confirmSettingsPassword}
                      onChange={(e) => setConfirmSettingsPassword(e.target.value)}
                  />
                  {settingsPasswordError && <p className="text-sm text-destructive">{settingsPasswordError}</p>}
              </div>
              <DialogFooter>
                  <Button onClick={handleSetSettingsPassword}>{t.settings.savePassword}</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
