
'use client';

import React, { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Copy, Eye, EyeOff, Trash2, ShieldQuestion, AlertTriangle } from 'lucide-react';
import type { TotpCode } from '@/context/app-context';
import { AppContext } from '@/context/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as OTPAuth from 'otpauth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { translations } from '@/lib/translations';

// Generate a real TOTP code
function generateRealTotp(code: TotpCode): string {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: code.issuer,
      label: code.account,
      algorithm: code.algorithm || 'SHA1',
      digits: code.digits || 6,
      period: code.period || 30,
      secret: code.secret.replace(/\s/g, ''),
    });
    return totp.generate();
  } catch (error) {
    console.error('Error generating TOTP:', error);
    return 'Error';
  }
}

// Generate a plausible but fake TOTP code that changes
function generateFakeTotp(secret: string, period: number): string {
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / period);
  // A simple hash-like function to generate a number from the seed and time
  let hash = 0;
  for (let i = 0; i < secret.length; i++) {
    hash = (hash << 5) - hash + secret.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const code = Math.abs((hash + timeStep) % 1000000).toString().padStart(6, '0');
  return code;
}


function TotpCardComponent({ code, isPanicMode = false }: { code: TotpCode, isPanicMode?: boolean }) {
  const [totp, setTotp] = useState('------');
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasIconError, setHasIconError] = useState(false);
  const { toast } = useToast();
  const context = useContext(AppContext);

  const period = code.period || 30;
  
  useEffect(() => {
    const updateTotp = () => {
      const epoch = Math.floor(Date.now() / 1000);
      const newSecondsLeft = period - (epoch % period);
      
      if (newSecondsLeft === period) {
         setTotp(isPanicMode ? generateFakeTotp(code.secret, period) : generateRealTotp(code));
      }
      setSecondsLeft(newSecondsLeft);
    };

    const initialTotp = isPanicMode ? generateFakeTotp(code.secret, period) : generateRealTotp(code);
    if(initialTotp !== 'Error') setTotp(initialTotp);
    
    updateTotp();
    const interval = setInterval(updateTotp, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, isPanicMode]);

  if (!context) return null;
  const { deleteCode, settings, verifyWithBiometrics } = context;
  const t = translations[settings.language as keyof typeof translations] || translations.en;
  
  const handleDelete = () => {
    if (isPanicMode) return; // Cannot delete in panic mode
    deleteCode(code.id);
    toast({
      title: t.totp.deleted,
      description: `${t.totp.deletedDesc} ${code.issuer}.`,
    });
  };

  const handleCopy = () => {
    if (isPanicMode) return; // Cannot copy in panic mode
    if (totp !== '------' && totp !== 'Error') {
      navigator.clipboard.writeText(totp);
      toast({
        title: t.totp.copied,
        description: `${t.totp.copiedDesc} ${code.issuer}.`,
      });
    }
  };

  const handleToggleReveal = async () => {
    if (isRevealed) {
      setIsRevealed(false);
      return;
    }
    
    if (settings.requireBiometricsForCodes && !isPanicMode) {
      const success = await verifyWithBiometrics();
      if (success) {
        setIsRevealed(true);
      } else {
        toast({
          variant: 'destructive',
          title: t.lock.biometricUnlockFailed,
          description: t.lock.biometricUnlockFailedDesc,
        });
      }
    } else {
      setIsRevealed(true);
    }
  };


  const progress = (secondsLeft / period) * 100;
  
  const renderIcon = () => {
    const iconUrl = isPanicMode ? `https://www.google.com/s2/favicons?domain=${code.issuer.toLowerCase()}.com&sz=64` : code.iconUrl;
    if (iconUrl && !hasIconError) {
      return (
        <Image 
            src={iconUrl} 
            alt={`${code.issuer} logo`} 
            width={24} 
            height={24} 
            className="rounded-full"
            onError={() => setHasIconError(true)}
        />
      );
    }
    return <ShieldQuestion className="h-6 w-6 text-muted-foreground" />;
  };


  return (
    <Card className="overflow-hidden bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2 min-w-0">
            <div className="flex-shrink-0">{renderIcon()}</div>
            <CardTitle className="text-sm font-medium truncate">{code.issuer}</CardTitle>
        </div>
        <span className="text-xs text-muted-foreground truncate pl-2">{code.account}</span>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div 
            className="font-mono text-3xl font-bold tracking-widest text-primary cursor-pointer"
            onClick={handleToggleReveal}
          >
            {isRevealed ? totp.replace(/(\d{3})(?=\d)/, '$1 ') : '••• •••'}
          </div>
          <div className="flex items-center gap-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isPanicMode}>
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Trash2 className="text-destructive"/>
                        {t.totp.deleteConfirmTitle}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {t.totp.deleteConfirmDesc1} <span className="font-bold">{code.issuer} ({code.account})</span> {t.totp.deleteConfirmDesc2}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.totp.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">{t.totp.delete}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="icon" onClick={handleToggleReveal}>
              {isRevealed ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!isRevealed || totp === 'Error' || totp === '------' || isPanicMode}>
              <Copy className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
      <div className="relative h-1 w-full bg-muted">
        <motion.div
          className="h-1 bg-primary"
          initial={{ width: `${progress}%` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>
    </Card>
  );
}

export const TotpCard = React.memo(TotpCardComponent);
