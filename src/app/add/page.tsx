
'use client';

import { useContext, useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, CameraOff, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import jsQR from 'jsqr';
import * as OTPAuth from 'otpauth';

import { AppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { translations } from '@/lib/translations';

const formSchema = z.object({
  issuer: z.string().min(1, 'Issuer is required'),
  account: z.string().min(1, 'Account name is required'),
  secret: z.string().min(8, 'Secret key is too short').regex(/^[A-Z2-7=]+$/, 'Invalid secret key format'),
  category: z.string().optional(),
  algorithm: z.enum(['SHA1', 'SHA256', 'SHA512']).optional(),
  digits: z.number().optional(),
  period: z.number().optional(),
});

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


function AddCodePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = useContext(AppContext);
  const { toast } = useToast();

  const prefillIssuer = searchParams.get('issuer') || '';
  const prefillAccount = searchParams.get('account') || '';
  const prefillSecret = searchParams.get('secret') || '';
  const prefillCategory = searchParams.get('category') || '';
  const prefillAlgorithm = searchParams.get('algorithm') || undefined;
  const prefillDigits = searchParams.get('digits');
  const prefillPeriod = searchParams.get('period');
  const initialTab = searchParams.get('tab') || (prefillIssuer && !prefillSecret ? 'scan' : 'manual');

  const [activeTab, setActiveTab] = useState(initialTab);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [phishingAlert, setPhishingAlert] = useState<{ open: boolean, reason: string, onContinue: () => void }>({ open: false, reason: '', onContinue: () => {} });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!context) {
    router.push('/');
    return null;
  }
  const { settings, addCode } = context;
  const t = translations[settings.language as keyof typeof translations] || translations.en;


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issuer: prefillIssuer,
      account: prefillAccount,
      secret: prefillSecret,
      category: prefillCategory || 'General',
      algorithm: prefillAlgorithm as 'SHA1' | 'SHA256' | 'SHA512' | undefined,
      digits: prefillDigits ? parseInt(prefillDigits, 10) : undefined,
      period: prefillPeriod ? parseInt(prefillPeriod, 10) : undefined,
    },
  });

  useEffect(() => {
    if (prefillIssuer) form.setValue('issuer', prefillIssuer);
    if (prefillAccount) form.setValue('account', prefillAccount);
    if (prefillSecret) form.setValue('secret', prefillSecret);
    if (prefillCategory) form.setValue('category', prefillCategory);
    if (prefillAlgorithm) form.setValue('algorithm', prefillAlgorithm as 'SHA1' | 'SHA256' | 'SHA512');
    if (prefillDigits) form.setValue('digits', parseInt(prefillDigits, 10));
    if (prefillPeriod) form.setValue('period', parseInt(prefillPeriod, 10));
    if (prefillSecret) setActiveTab('manual');
  }, [prefillIssuer, prefillAccount, prefillSecret, prefillAlgorithm, prefillDigits, prefillPeriod, prefillCategory, form]);


  useEffect(() => {
    if (activeTab === 'scan') {
      startScan();
    } else {
      stopScan();
    }

    return () => stopScan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  
  const startScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setHasCameraPermission(true);
        requestAnimationFrame(tick);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
    }
  };

  const stopScan = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if(videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && !isProcessing) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          setIsProcessing(true);
          handleQrCode(code.data);
          return; // Stop scanning
        }
      }
    }
    if (streamRef.current) {
        requestAnimationFrame(tick);
    }
  };
  
  const fillFormAndNotify = (totp: OTPAuth.TOTP) => {
    form.setValue('issuer', totp.issuer);
    form.setValue('account', totp.label);
    form.setValue('secret', totp.secret.b32);
    form.setValue('algorithm', totp.algorithm as 'SHA1' | 'SHA256' | 'SHA512');
    form.setValue('digits', totp.digits);
    form.setValue('period', totp.period);
    form.setValue('category', 'General');
    toast({
        title: t.add.qrScanned,
        description: t.add.qrScannedDesc,
    });
    setActiveTab('manual');
  };
  
  const handleQrCode = async (data: string) => {
    stopScan();
    
    const analysis = analyzeQrCodeLocally(data);

    const continueToAdd = () => {
      try {
        const totp = OTPAuth.URI.parse(data);
        fillFormAndNotify(totp);
      } catch (error) {
        console.error('Failed to parse QR code:', error);
        toast({ variant: 'destructive', title: t.add.invalidQr, description: t.add.invalidQrDesc });
        setIsProcessing(false);
        startScan(); // Resume scanning
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
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addCode({
      issuer: values.issuer,
      account: values.account,
      secret: values.secret.toUpperCase().replace(/\s/g, ''),
      category: values.category || 'General',
      algorithm: values.algorithm,
      digits: values.digits,
      period: values.period,
    });
    toast({
      title: t.add.codeAdded,
      description: `${t.add.codeAddedDesc} ${values.issuer}.`,
    });
    router.push('/');
  };

  const handleDemoClick = () => {
    form.setValue('issuer', 'Demo Service');
    form.setValue('account', 'user@example.com');
    form.setValue('secret', 'JBSWY3DPEHPK3PXP');
    form.setValue('category', 'Demos');
    form.setValue('algorithm', 'SHA1');
    form.setValue('digits', 6);
    form.setValue('period', 30);
  };

  return (
    <>
      <header className="flex items-center border-b p-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="ml-4 font-headline text-xl font-bold">{t.add.title}</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan">{t.add.scanQrTab}</TabsTrigger>
            <TabsTrigger value="manual">{t.add.manualTab}</TabsTrigger>
          </TabsList>
          <TabsContent value="scan">
            <Card>
              <CardHeader>
                <CardTitle>{t.add.scanQrTitle}</CardTitle>
                <CardDescription>{t.add.scanQrDesc}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-0">
                <div className="relative w-full aspect-square bg-muted overflow-hidden">
                   <video 
                     ref={videoRef} 
                     className="w-full h-full object-cover" 
                     autoPlay 
                     playsInline
                     muted 
                   />
                   <canvas ref={canvasRef} className="hidden" />
                   {isProcessing ? (
                     <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-4 text-muted-foreground">{t.add.analyzing}</p>
                     </div>
                   ) : (
                    <div className="absolute inset-0 border-[20px] border-background/50" />
                   )}
                </div>
                {!hasCameraPermission && (
                  <div className='p-4 w-full'>
                    <Alert variant="destructive">
                      <CameraOff className="h-4 w-4" />
                      <AlertTitle>{t.add.cameraErrorTitle}</AlertTitle>
                      <AlertDescription>
                        {t.add.cameraErrorDesc}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="manual">
            <Card>
                <CardHeader>
                    <CardTitle>{t.add.manualTitle}</CardTitle>
                    <CardDescription>{t.add.manualDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                        control={form.control}
                        name="issuer"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t.add.issuerLabel}</FormLabel>
                            <FormControl>
                                <Input placeholder={t.add.issuerPlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="account"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t.add.accountLabel}</FormLabel>
                            <FormControl>
                                <Input placeholder={t.add.accountPlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="secret"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t.add.secretLabel}</FormLabel>
                            <FormControl>
                                <Input placeholder={t.add.secretPlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t.add.categoryLabel}</FormLabel>
                            <FormControl>
                                <Input placeholder={t.add.categoryPlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div className="flex gap-2">
                           <Button type="submit" className="flex-1">
                                {t.add.addButton}
                            </Button>
                            <Button type="button" variant="outline" onClick={handleDemoClick}>
                                {t.add.demoButton}
                            </Button>
                        </div>
                    </form>
                    </Form>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
       <AlertDialog open={phishingAlert.open} onOpenChange={(open) => {
            if (!open) {
                setPhishingAlert({ open: false, reason: '', onContinue: () => {} });
                setIsProcessing(false);
                if (activeTab === 'scan') startScan();
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
                    <AlertDialogCancel onClick={() => {
                       setIsProcessing(false);
                       if (activeTab === 'scan') startScan();
                    }}>
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

export default function AddCodePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddCodePageContent />
    </Suspense>
  )
}
