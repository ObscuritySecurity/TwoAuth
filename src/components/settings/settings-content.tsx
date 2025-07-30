
'use client';

import { useContext, useState, useRef, useCallback, useEffect } from 'react';
import { Moon, Sun, Laptop, ShieldCheck, KeyRound, Lock, Eye, Download, Upload, Languages, Copy, FileWarning, HelpCircle, ShieldQuestion, Code, Fingerprint, EyeOff, ShieldAlert, AlertTriangle, Smartphone, Notebook, CloudSun, Calendar } from 'lucide-react';

import { AppContext, TotpCode } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { translations } from '@/lib/translations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// --- Crypto Helper Functions ---

// Generate a random 256-bit key for AES-GCM
async function generateEncryptionKey() {
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const keyData = await window.crypto.subtle.exportKey('jwk', key);
  return keyData.k!; // Return the base64url encoded key string
}

// Encrypt data using AES-GCM
async function encryptData(data: string, keyString: string) {
  const key = await window.crypto.subtle.importKey(
    'jwk',
    { kty: 'oct', k: keyString, alg: 'A256GCM', ext: true },
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector
  const encodedData = new TextEncoder().encode(data);
  const encryptedData = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );
  // Combine IV and encrypted data for storage
  const ivString = btoa(String.fromCharCode(...iv));
  const encryptedString = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
  return `${ivString}.${encryptedString}`;
}

// Decrypt data using AES-GCM
async function decryptData(encryptedStringWithIv: string, keyString: string) {
  const key = await window.crypto.subtle.importKey(
    'jwk',
    { kty: 'oct', k: keyString, alg: 'A256GCM', ext: true },
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  const [ivString, encryptedString] = encryptedStringWithIv.split('.');
  if (!ivString || !encryptedString) {
    throw new Error('Invalid encrypted data format.');
  }
  const iv = new Uint8Array(atob(ivString).split('').map(c => c.charCodeAt(0)));
  const encryptedData = new Uint8Array(atob(encryptedString).split('').map(c => c.charCodeAt(0)));
  const decryptedData = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  );
  return new TextDecoder().decode(decryptedData);
}

export default function SettingsContent() {
  const context = useContext(AppContext);
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  const [newSettingsPassword, setNewSettingsPassword] = useState('');
  const [confirmSettingsPassword, setConfirmSettingsPassword] = useState('');
  const [settingsPasswordError, setSettingsPasswordError] = useState('');
  const [isSettingsPasswordDialogOpen, setIsSettingsPasswordDialogOpen] = useState(false);
  
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<string | null>(null);
  
  const [isRestoreKeyDialogOpen, setIsRestoreKeyDialogOpen] = useState(false);
  const [restoreKey, setRestoreKey] = useState('');
  
  const [isBackupKeyDialogOpen, setIsBackupKeyDialogOpen] = useState(false);
  const [backupKey, setBackupKey] = useState('');
  const [encryptedBackupData, setEncryptedBackupData] = useState('');
  
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingDiscreetApp, setPendingDiscreetApp] = useState<'none' | 'notes' | 'calendar' | 'weather'>('none');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(available => {
        setIsBiometricSupported(available);
      });
    }
  }, []);

  if (!context) return null;
  
  const { settings, updateSettings, codes, setMasterPassword, hasMasterPassword, restoreCodes, registerBiometrics, unregisterBiometrics, hasSettingsPassword, setSettingsPassword, isPanicModeActive, togglePanicMode, selfDestructInfo } = context;

  const t = translations[settings.language as keyof typeof translations] || translations.en;
  
  const handleBiometricToggle = async (checked: boolean) => {
    if (checked) {
      const success = await registerBiometrics();
      if (!success) {
        toast({ title: t.settings.biometricErrorTitle, description: t.settings.biometricErrorDesc, variant: 'destructive' });
      } else {
        toast({ title: t.settings.biometricSuccessTitle, description: t.settings.biometricSuccessDesc });
      }
    } else {
      // Also disable per-code requirement if global biometrics are turned off
      updateSettings({ isBiometricEnabled: false, requireBiometricsForCodes: false });
      toast({ title: t.settings.biometricDisabledTitle, description: t.settings.biometricDisabledDesc });
    }
  };

  const handleCreateEncryptedBackup = async () => {
    try {
      const key = await generateEncryptionKey();
      const backupData = {
        version: 2, // Encrypted version
        timestamp: new Date().toISOString(),
        codes: codes,
      };
      const encryptedData = await encryptData(JSON.stringify(backupData), key);

      setBackupKey(key);
      setEncryptedBackupData(encryptedData);
      setIsBackupKeyDialogOpen(true);
    } catch (error) {
      console.error(error);
      toast({ title: t.settings.backupErrorTitle, description: t.settings.backupErrorDesc, variant: 'destructive' });
    }
  };
  
  const handleCreateSimpleBackup = () => {
    try {
      const backupData = {
        version: 1, // Unencrypted version
        timestamp: new Date().toISOString(),
        codes: codes,
      };
      const plainTextData = JSON.stringify(backupData, null, 2);
      const blob = new Blob([plainTextData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `twoauth_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t.settings.backupCreated, description: t.settings.backupCreatedDesc });
    } catch (error) {
        console.error(error);
        toast({ title: t.settings.backupErrorTitle, description: t.settings.backupErrorDesc, variant: 'destructive' });
    }
  };

  const downloadEncryptedBackup = () => {
    const blob = new Blob([encryptedBackupData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twoauth_encrypted_backup_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    setIsBackupKeyDialogOpen(false);
    setBackupKey('');
    setEncryptedBackupData('');

    toast({ title: t.settings.backupCreated, description: t.settings.backupCreatedDesc });
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: t.settings.keyCopied, description: t.settings.keyCopiedDesc });
  }

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        try {
            const data = JSON.parse(result);
            if(data.version === 2) { // Encrypted
                setPendingRestoreData(result);
                setIsRestoreKeyDialogOpen(true);
            } else if (data.version === 1) { // Unencrypted
                setPendingRestoreData(result);
                setIsRestoreConfirmOpen(true);
            } else {
                 throw new Error("Unsupported backup version.");
            }
        } catch(error) { // Could be encrypted without version or not json
            setPendingRestoreData(result);
            setIsRestoreKeyDialogOpen(true);
        }
      };
      reader.readAsText(file);
    }
    if (event.target) event.target.value = '';
  };

  const handleRestoreWithKey = async () => {
    if (!pendingRestoreData || !restoreKey) return;
    try {
      const decryptedString = await decryptData(pendingRestoreData, restoreKey);
      const data = JSON.parse(decryptedString);
      
      if (data && Array.isArray(data.codes)) {
        setIsRestoreKeyDialogOpen(false);
        setPendingRestoreData(decryptedString);
        setIsRestoreConfirmOpen(true);
      } else {
        throw new Error(t.settings.invalidBackupFormat);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t.settings.restoreError,
        description: t.settings.decryptionFailed,
      });
      setIsRestoreKeyDialogOpen(false);
      setRestoreKey('');
      setPendingRestoreData(null);
    }
  };

  const confirmRestore = useCallback(async () => {
    if (pendingRestoreData) {
        try {
            const data = JSON.parse(pendingRestoreData);
            restoreCodes(data.codes);
            toast({
                title: t.settings.restoreSuccess,
                description: t.settings.restoreSuccessDesc,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: t.settings.restoreError,
                description: t.settings.restoreProcessError,
            });
        }
    }
    setIsRestoreConfirmOpen(false);
    setPendingRestoreData(null);
    setRestoreKey('');
  }, [pendingRestoreData, restoreCodes, t, toast]);
  
  const handleSetPassword = () => {
    if (newPassword.length < 8) {
      setPasswordError(t.settings.passwordErrorLength);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t.settings.passwordErrorMatch);
      return;
    }
    setMasterPassword(newPassword);
    setPasswordError('');
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordDialogOpen(false);
    toast({ title: t.settings.passwordUpdated, description: t.settings.passwordUpdatedDesc });
  };
  
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
    setIsSettingsPasswordDialogOpen(false);
    toast({ title: t.settings.settingsPasswordUpdated, description: t.settings.settingsPasswordUpdatedDesc });
  };
  
  const handlePanicModeToggle = (checked: boolean) => {
    togglePanicMode(checked);
    if(checked) {
        toast({
            title: t.header.panicTitle,
            description: t.header.panicDesc,
            variant: 'destructive',
        });
    }
  };

  const handleDiscreetModeChange = (value: 'none' | 'notes' | 'calendar' | 'weather') => {
    setPendingDiscreetApp(value);
    if (value === 'none') {
        updateSettings({ discreetMode: { app: 'none', pin: null } });
        toast({ title: t.settings.discreetMode.disabledTitle, description: t.settings.discreetMode.disabledDesc });
    } else {
        setIsPinDialogOpen(true);
    }
  };

  const handleSetPin = () => {
    if (newPin.length !== 4) {
        setPinError(t.settings.discreetMode.pinErrorLength);
        return;
    }
    if (newPin !== confirmPin) {
        setPinError(t.settings.discreetMode.pinErrorMatch);
        return;
    }

    updateSettings({ discreetMode: { app: pendingDiscreetApp, pin: newPin } });
    toast({ title: t.settings.discreetMode.pinSetTitle, description: t.settings.discreetMode.pinSetDesc });
    setIsPinDialogOpen(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  }

  const handleCancelPin = () => {
    setIsPinDialogOpen(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };


  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {selfDestructInfo.triggerTimestamp && (
           <Card className="border-destructive bg-destructive/10">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /> {t.settings.selfDestructWarningTitle}</CardTitle>
                  <CardDescription className="text-destructive/80">
                      {t.settings.selfDestructWarningDesc}
                  </CardDescription>
              </CardHeader>
          </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sun className="h-5 w-5" /> {t.settings.appearance}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme">{t.settings.theme}</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light"><Sun className="inline-block mr-2 h-4 w-4"/>{t.settings.light}</SelectItem>
                <SelectItem value="dark"><Moon className="inline-block mr-2 h-4 w-4"/>{t.settings.dark}</SelectItem>
                <SelectItem value="system"><Laptop className="inline-block mr-2 h-4 w-4"/>{t.settings.system}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Languages className="h-5 w-5" /> {t.settings.languageRegion}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
              <Label htmlFor="language">{t.settings.language}</Label>
              <Select 
                  value={settings.language} 
                  onValueChange={(val) => updateSettings({ language: val })}>
                  <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t.settings.selectLanguage} />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ro">Română</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
              </Select>
              </div>
          </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> {t.settings.security}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
              <Label htmlFor="change-password" className="flex flex-col space-y-1">
                  <span>{t.settings.masterPassword}</span>
                  <span className="font-normal leading-snug text-muted-foreground text-xs">
                      {t.settings.masterPasswordDesc}
                  </span>
              </Label>
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                  <DialogTrigger asChild>
                      <Button variant="outline"><KeyRound className="mr-2 h-4 w-4" /> {hasMasterPassword ? t.settings.change : t.settings.set}</Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>{hasMasterPassword ? t.settings.changePasswordTitle : t.settings.setPasswordTitle}</DialogTitle>
                          <DialogDescription>
                              {t.settings.passwordDialogDesc}
                          </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                           <Input 
                              id="new-password" 
                              type="password" 
                              placeholder={t.settings.newPasswordPlaceholder}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                           />
                           <Input 
                              id="confirm-password" 
                              type="password" 
                              placeholder={t.settings.confirmPasswordPlaceholder}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                      </div>
                      <DialogFooter>
                          <Button onClick={handleSetPassword}>{t.settings.savePassword}</Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
          </div>
          
          <div className="flex items-center justify-between">
              <Label htmlFor="change-settings-password" className="flex flex-col space-y-1">
                  <span>{t.settings.settingsPassword}</span>
                  <span className="font-normal leading-snug text-muted-foreground text-xs">
                      {t.settings.settingsPasswordDesc}
                  </span>
              </Label>
              <Dialog open={isSettingsPasswordDialogOpen} onOpenChange={setIsSettingsPasswordDialogOpen}>
                  <DialogTrigger asChild>
                      <Button variant="outline"><Lock className="mr-2 h-4 w-4" /> {hasSettingsPassword ? t.settings.change : t.settings.set}</Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>{hasSettingsPassword ? t.settings.changeSettingsPasswordTitle : t.settings.setSettingsPasswordTitle}</DialogTitle>
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
          </div>

          <div className="flex items-center justify-between">
              <Label htmlFor="discreet-mode" className="flex flex-col space-y-1">
                  <span>{t.settings.discreetMode.title}</span>
                  <span className="font-normal leading-snug text-muted-foreground text-xs">
                      {t.settings.discreetMode.desc}
                  </span>
              </Label>
               <Select 
                  value={settings.discreetMode?.app || 'none'} 
                  onValueChange={handleDiscreetModeChange}
               >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t.settings.discreetMode.selectApp} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.settings.discreetMode.disabled}</SelectItem>
                    <SelectItem value="notes"><Notebook className="inline-block mr-2 h-4 w-4"/>{t.settings.discreetMode.appNotes}</SelectItem>
                    <SelectItem value="calendar"><Calendar className="inline-block mr-2 h-4 w-4"/>{t.settings.discreetMode.appCalendar}</SelectItem>
                    <SelectItem value="weather"><CloudSun className="inline-block mr-2 h-4 w-4"/>{t.settings.discreetMode.appWeather}</SelectItem>
                  </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="autolock" className="flex flex-col space-y-1">
                <span>{t.settings.autoLock}</span>
                  <span className="font-normal leading-snug text-muted-foreground text-xs">
                      {t.settings.autoLockDesc}
                  </span>
            </Label>
            <Select 
              value={String(settings.autoLock)} 
              onValueChange={(val) => updateSettings({ autoLock: Number(val) })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 {t.settings.seconds}</SelectItem>
                <SelectItem value="30">30 {t.settings.seconds}</SelectItem>
                <SelectItem value="60">1 {t.settings.minute}</SelectItem>
                <SelectItem value="300">5 {t.settings.minutes}</SelectItem>
                <SelectItem value="0">{t.settings.never}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasMasterPassword && (
            <div className="flex items-center justify-between">
               <Label htmlFor="biometric-unlock" className="flex flex-col space-y-1">
                <span className="flex items-center gap-2"><Fingerprint className="h-4 w-4"/>{t.settings.biometricUnlock}</span>
                <span className="font-normal leading-snug text-muted-foreground text-xs">
                    {!isBiometricSupported 
                        ? t.settings.biometricNotSupported
                        : t.settings.biometricUnlockDesc
                    }
                </span>
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* We need a wrapper div for the tooltip to work on a disabled element */}
                    <div>
                      <Switch
                        id="biometric-unlock"
                        checked={settings.isBiometricEnabled}
                        onCheckedChange={handleBiometricToggle}
                        disabled={!isBiometricSupported}
                      />
                    </div>
                  </TooltipTrigger>
                  {!isBiometricSupported && (
                    <TooltipContent>
                      <p>{t.settings.biometricNotSupported}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
           
          {settings.isBiometricEnabled && (
            <div className="flex items-center justify-between">
               <Label htmlFor="biometric-per-code" className="flex flex-col space-y-1">
                <span className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-primary"/>{t.settings.requireBiometricsForCodes}</span>
                <span className="font-normal leading-snug text-muted-foreground text-xs">
                  {t.settings.requireBiometricsForCodesDesc}
                </span>
              </Label>
              <Switch
                id="biometric-per-code"
                checked={settings.requireBiometricsForCodes}
                onCheckedChange={(checked) => updateSettings({ requireBiometricsForCodes: checked })}
                disabled={!settings.isBiometricEnabled}
              />
            </div>
          )}
          
           <div className="flex items-center justify-between">
              <Label htmlFor="panic-mode" className="flex flex-col space-y-1">
                  <span className='flex items-center gap-2'><ShieldAlert className="h-4 w-4 text-destructive"/>{t.settings.panicMode}</span>
                  <span className="font-normal leading-snug text-muted-foreground text-xs">
                      {t.settings.panicModeDesc}
                  </span>
              </Label>
              <Switch
                  id="panic-mode"
                  checked={isPanicModeActive}
                  onCheckedChange={handlePanicModeToggle}
              />
          </div>
           <div className="flex items-center justify-between">
              <Label htmlFor="visual-obfuscation" className="flex flex-col space-y-1">
                  <span className='flex items-center gap-2'><EyeOff className="h-4 w-4"/>{t.settings.visualObfuscation}</span>
                  <span className="font-normal leading-snug text-muted-foreground text-xs">
                      {t.settings.visualObfuscationDesc}
                  </span>
              </Label>
              <Switch
                  id="visual-obfuscation"
                  checked={settings.visualObfuscation}
                  onCheckedChange={(checked) => updateSettings({ visualObfuscation: checked })}
              />
          </div>

          <div className="border-t pt-4 space-y-2">
              <Label className="font-bold flex items-center gap-2"><AlertTriangle className='text-destructive' /> {t.settings.selfDestructTitle}</Label>
              <p className="text-xs text-muted-foreground">{t.settings.selfDestructDesc}</p>
               <div className="flex items-center justify-between">
                  <Label htmlFor="self-destruct-enabled" className="flex flex-col space-y-1">
                      <span>{t.settings.enableSelfDestruct}</span>
                  </Label>
                  <Switch
                      id="self-destruct-enabled"
                      checked={settings.selfDestructEnabled}
                      onCheckedChange={(checked) => updateSettings({ selfDestructEnabled: checked })}
                      disabled={!hasMasterPassword}
                  />
              </div>
               <div className="flex items-center justify-between">
                  <Label htmlFor="self-destruct-grace-period" className="flex flex-col space-y-1">
                      <span>{t.settings.gracePeriod}</span>
                  </Label>
                  <Select 
                      value={String(settings.selfDestructGracePeriod)} 
                      onValueChange={(val) => updateSettings({ selfDestructGracePeriod: Number(val) })}
                      disabled={!settings.selfDestructEnabled}
                  >
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="0">{t.settings.immediately}</SelectItem>
                          <SelectItem value="3600">1 {t.settings.hour}</SelectItem>
                          <SelectItem value="86400">24 {t.settings.hours}</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
          </div>

           <div className="border-t pt-4 space-y-2">
              <Label className="font-bold">{t.settings.encryptedBackupTitle}</Label>
              <p className="text-xs text-muted-foreground">{t.settings.encryptedBackupDesc}</p>
              <div className="flex flex-col gap-2 pt-2">
                  <Button variant="outline" onClick={handleCreateEncryptedBackup}><Download className="mr-2 h-4 w-4" /> {t.settings.createBackup}</Button>
                  <Button variant="outline" onClick={handleRestoreClick}><Upload className="mr-2 h-4 w-4" /> {t.settings.restoreBackup}</Button>
              </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileWarning className="h-5 w-5" /> {t.settings.simpleBackupTitle}</CardTitle>
          <CardDescription>{t.settings.simpleBackupDesc}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
            <Button variant="secondary" onClick={handleCreateSimpleBackup}><Download className="mr-2 h-4 w-4" /> {t.settings.exportUnencrypted}</Button>
            <Button variant="secondary" onClick={handleRestoreClick}><Upload className="mr-2 h-4 w-4" /> {t.settings.importUnencrypted}</Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.json"
              className="hidden"
            />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" />{t.settings.accessibilityTitle}</CardTitle>
          <CardDescription>{t.settings.userGuide.intro}</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>{t.settings.userGuide.passwordsTitle}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <h4 className="font-bold text-foreground">{t.settings.masterPassword}</h4>
                    <p>{t.settings.userGuide.masterPasswordDesc}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{t.settings.settingsPassword}</h4>
                    <p>{t.settings.userGuide.settingsPasswordDesc}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>{t.settings.userGuide.duressFeaturesTitle}</AccordionTrigger>
               <AccordionContent>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <h4 className="font-bold text-foreground">{t.settings.panicMode}</h4>
                    <p>{t.settings.userGuide.panicModeDesc}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{t.settings.discreetMode.title}</h4>
                    <p>{t.settings.userGuide.discreetModeDesc}</p>
                  </div>
                   <div>
                    <h4 className="font-bold text-foreground">{t.settings.selfDestructTitle}</h4>
                    <p>{t.settings.userGuide.selfDestructDesc}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{t.settings.visualObfuscation}</h4>
                    <p>{t.settings.userGuide.visualObfuscationDesc}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>{t.settings.userGuide.backupTitle}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <h4 className="font-bold text-foreground">{t.settings.encryptedBackupTitle}</h4>
                    <p>{t.settings.userGuide.encryptedBackupDesc}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{t.settings.simpleBackupTitle}</h4>
                    <p>{t.settings.userGuide.simpleBackupDesc}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-4">
              <AccordionTrigger>{t.settings.userGuide.biometricsTitle}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-sm text-muted-foreground">
                   <p>{t.settings.userGuide.biometricsDesc}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      
      {/* Discreet Mode PIN Dialog */}
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t.settings.discreetMode.pinDialogTitle}</DialogTitle>
                <DialogDescription>{t.settings.discreetMode.pinDialogDesc}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                 <Input 
                    type="password"
                    maxLength={4} 
                    placeholder={t.settings.discreetMode.pinPlaceholder}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="text-center tracking-widest"
                 />
                 <Input 
                    type="password"
                    maxLength={4}
                    placeholder={t.settings.discreetMode.pinConfirmPlaceholder}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="text-center tracking-widest"
                />
                {pinError && <p className="text-sm text-destructive text-center">{pinError}</p>}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={handleCancelPin}>{t.settings.cancel}</Button>
                <Button onClick={handleSetPin}>{t.settings.discreetMode.setPinButton}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Encrypted Backup Key Dialog */}
      <Dialog open={isBackupKeyDialogOpen} onOpenChange={setIsBackupKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.settings.encryptionKeyTitle}</DialogTitle>
            <DialogDescription className="text-destructive font-bold pt-2">
              {t.settings.encryptionKeyDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 my-4">
            <Input id="backup-key" value={backupKey} readOnly className="font-mono"/>
            <Button type="button" size="icon" onClick={() => handleCopyKey(backupKey)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={downloadEncryptedBackup}>{t.settings.keySavedButton}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Restore Key Dialog */}
      <Dialog open={isRestoreKeyDialogOpen} onOpenChange={setIsRestoreKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.settings.decryptionKeyTitle}</DialogTitle>
            <DialogDescription>
              {t.settings.decryptionKeyDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input 
              id="restore-key" 
              placeholder={t.settings.pasteKeyPlaceholder}
              value={restoreKey}
              onChange={(e) => setRestoreKey(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleRestoreWithKey}>{t.settings.decryptButton}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Restore Confirmation */}
      <AlertDialog open={isRestoreConfirmOpen} onOpenChange={setIsRestoreConfirmOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>{t.settings.restoreConfirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                  {t.settings.restoreConfirmDesc}
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setPendingRestoreData(null);
                setRestoreKey('');
              }}>{t.settings.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRestore} className="bg-destructive hover:bg-destructive/90">
                  {t.settings.restoreConfirmAction}
              </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
