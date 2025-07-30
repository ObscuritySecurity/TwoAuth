
'use client';

import { useRef, useContext, useState } from 'react';
import { QrCode, Image, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';
import * as OTPAuth from 'otpauth';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AppContext } from '@/context/app-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface AnalysisResult {
  isSafe: boolean;
  reason: string;
  issuer: string;
  account: string;
}

// Offline, heuristic-based phishing analysis
function analyzeQrCodeLocally(qrData: string): AnalysisResult {
  try {
    const totp = OTPAuth.URI.parse(qrData);
    const issuer = totp.issuer;
    const account = totp.label;

    // List of suspicious keywords often used in phishing attempts
    const suspiciousKeywords = ['security', 'login', 'account', 'verify', 'support', 'admin', 'update', 'secure'];
    
    // Check for common brand names combined with suspicious keywords
    const commonBrands = ['google', 'microsoft', 'apple', 'facebook', 'instagram', 'twitter', 'amazon', 'paypal', 'binance', 'coinbase', 'github', 'discord'];
    
    const lowerCaseIssuer = issuer.toLowerCase();

    // 1. Check for suspicious keywords in issuer
    for (const keyword of suspiciousKeywords) {
      if (lowerCaseIssuer.includes(keyword)) {
        // Allow if it's a known pattern, e.g. "Apple ID"
        if (lowerCaseIssuer === 'apple id') continue;
        return { isSafe: false, reason: `Issuer name contains suspicious keyword: "${keyword}".`, issuer, account };
      }
    }

    // 2. Check for compound issuer names (e.g., "Google-Security")
    if (/[^a-zA-Z0-9\s]/.test(issuer.replace(/\./g, ''))) { // Allow periods like in company names
        for (const brand of commonBrands) {
            if (lowerCaseIssuer.includes(brand) && lowerCaseIssuer !== brand && lowerCaseIssuer !== `${brand}.com`) {
                 return { isSafe: false, reason: `Issuer name "${issuer}" is a suspicious combination.`, issuer, account };
            }
        }
    }

    // 3. Check for lookalike characters (homoglyphs) - very basic check
    if (issuer.includes('PayPaI') || issuer.includes('G00gle')) {
      return { isSafe: false, reason: 'Issuer name may contain lookalike characters.', issuer, account };
    }

    // If no red flags, it's likely safe
    return { isSafe: true, reason: 'Looks legitimate.', issuer, account };

  } catch (error) {
    // If parsing fails, it's not a valid OTP URI.
    return { isSafe: false, reason: 'Invalid QR code data format.', issuer: 'Unknown', account: 'Unknown' };
  }
}

export function QuickActions() {
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const context = useContext(AppContext);
  const [isProcessing, setIsProcessing] = useState(false);
  const [phishingAlert, setPhishingAlert] = useState<{ open: boolean, reason: string, onContinue: () => void }>({ open: false, reason: '', onContinue: () => {} });

  if (!context) return null;
  const { t } = context;

  const handleScanFromImageClick = () => {
    fileInputRef.current?.click();
  };

  const navigateWithData = (totp: OTPAuth.TOTP) => {
    const query = new URLSearchParams({
      issuer: totp.issuer,
      account: totp.label,
      secret: totp.secret.b32,
      algorithm: totp.algorithm,
      digits: String(totp.digits),
      period: String(totp.period),
      tab: 'manual'
    }).toString();
    router.push(`/add?${query}`);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, img.width, img.height);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
               const analysis = analyzeQrCodeLocally(code.data);
               
               const continueToAdd = () => {
                  try {
                     const totp = OTPAuth.URI.parse(code.data);
                     navigateWithData(totp);
                  } catch(e) {
                      toast({ variant: 'destructive', title: t.quickActions.invalidQr, description: t.quickActions.invalidQrDesc });
                  }
               }

               if (analysis.isSafe) {
                  continueToAdd();
               } else {
                  setPhishingAlert({
                     open: true,
                     reason: analysis.reason,
                     onContinue: () => {
                        setPhishingAlert({ open: false, reason: '', onContinue: () => {} });
                        continueToAdd();
                     }
                  });
               }
               setIsProcessing(false);
            } else {
              toast({ variant: 'destructive', title: t.quickActions.noQr, description: t.quickActions.noQrDesc });
              setIsProcessing(false);
            }
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
    // Reset file input value to allow selecting the same file again
    event.target.value = '';
  };

  return (
    <>
      <div className="flex gap-2 border-b p-4">
        <Button variant="outline" className="flex-1" size="sm" asChild>
          <Link href={'/add?tab=scan'}>
            <QrCode />
            {t.quickActions.scanQr}
          </Link>
        </Button>
        <Button variant="outline" className="flex-1" size="sm" onClick={handleScanFromImageClick} disabled={isProcessing}>
          {isProcessing ? (
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : <Image />}
          {isProcessing ? t.add.analyzing : t.quickActions.fromImage}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isProcessing}
        />
      </div>

      <AlertDialog open={phishingAlert.open} onOpenChange={(open) => {
         if (!open) {
            setPhishingAlert({ open: false, reason: '', onContinue: () => {} });
         }
      }}>
         <AlertDialogContent>
             <AlertDialogHeader>
                 <AlertDialogTitle className='flex items-center gap-2'>
                     <ShieldAlert className='text-destructive' />
                     {t.add.phishingWarning.title}
                 </AlertDialogTitle>
                 <AlertDialogDescription>
                    {t.add.phishingWarning.reason_prefix} <span className="font-bold text-foreground">{phishingAlert.reason}</span>
                    <br/><br/>
                    {t.add.phishingWarning.advice}
                 </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter>
                 <AlertDialogCancel>
                     {t.add.phishingWarning.cancel}
                 </AlertDialogCancel>
                 <AlertDialogAction onClick={phishingAlert.onContinue} className="bg-destructive hover:bg-destructive/90">
                     {t.add.phishingWarning.continue}
                 </AlertDialogAction>
             </AlertDialogFooter>
         </AlertDialogContent>
     </AlertDialog>
    </>
  );
}
