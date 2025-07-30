
'use client';

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import { translations } from '@/lib/translations';

export interface TotpCode {
  id: string;
  issuer: string;
  account: string;
  secret: string;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: number;
  period?: number;
  category?: string;
  iconUrl?: string;
}

export type DeletedTotpCode = TotpCode & { deletedAt: number };

export interface SelfDestructInfo {
    triggerTimestamp: number | null; // Unix timestamp in milliseconds
    gracePeriod: number; // in seconds, 0 for immediate
}

export interface DiscreetModeSettings {
  app: 'none' | 'notes' | 'calendar' | 'weather';
  pin: string | null;
}

export interface Settings {
  theme: 'dark' | 'light' | 'system';
  autoLock: number; // in seconds, 0 for never
  language: string;
  isBiometricEnabled: boolean;
  visualObfuscation: boolean;
  requireBiometricsForCodes: boolean;
  selfDestructEnabled: boolean;
  selfDestructGracePeriod: number; // in seconds
  discreetMode: DiscreetModeSettings;
  promptedForSettingsPassword?: boolean;
}

type CodesByCategory = Record<string, TotpCode[]>;

interface AppContextType {
  codes: TotpCode[];
  deletedCodes: DeletedTotpCode[];
  addCode: (code: Omit<TotpCode, 'id' | 'iconUrl'>) => void;
  updateCode: (code: TotpCode) => void;
  deleteCode: (id: string) => void;
  restoreCode: (id: string) => void;
  deleteCodePermanently: (id: string) => void;
  emptyTrash: () => void;
  restoreCodes: (newCodes: TotpCode[]) => void;
  
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  
  isInitialized: boolean;
  isLocked: boolean;
  lockApp: () => void;
  unlockApp: (password: string) => boolean;

  hasMasterPassword: boolean;
  setMasterPassword: (password: string) => void;
  
  registerBiometrics: () => Promise<boolean>;
  unregisterBiometrics: () => void;
  unlockWithBiometrics: () => Promise<boolean>;
  verifyWithBiometrics: () => Promise<boolean>;
  
  isObfuscated: boolean;
  clearObfuscation: () => void;

  hasSettingsPassword: boolean;
  setSettingsPassword: (password: string) => void;
  verifySettingsPassword: (password: string) => boolean;
  
  isPanicModeActive: boolean;
  togglePanicMode: (active: boolean) => void;

  getCategories: () => string[];
  codesByCategory: CodesByCategory;

  selfDestructInfo: SelfDestructInfo;
  failedAttempts: number;
  cancelSelfDestruct: () => void;

  verifyDiscreetModePin: (pin: string) => boolean;
  exitDiscreetMode: () => void;

  t: typeof translations.en; // Translation object
}

const defaultSettings: Settings = {
  theme: 'dark',
  autoLock: 30,
  language: 'en', // Default language
  isBiometricEnabled: false,
  visualObfuscation: true,
  requireBiometricsForCodes: false,
  selfDestructEnabled: false,
  selfDestructGracePeriod: 86400, // 24 hours
  discreetMode: {
    app: 'none',
    pin: null,
  },
  promptedForSettingsPassword: false,
};

export const AppContext = createContext<AppContextType | null>(null);

// Helper function to convert base64url to ArrayBuffer
function bufferDecode(value: string) {
  const s = value.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

// Helper function to convert ArrayBuffer to base64url
function bufferEncode(value: ArrayBuffer) {
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(value)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Function to generate a likely icon URL from the issuer name
function getIconUrl(issuer: string): string {
  try {
    // Sanitize issuer name to get a domain-like string
    const domain = issuer.trim().toLowerCase().replace(/\s+/g, '').split('.')[0];
    return `https://www.google.com/s2/favicons?domain=${domain}.com&sz=64`;
  } catch {
    return ''; // Return empty if any error occurs
  }
}

const MAX_FAILED_ATTEMPTS = 5;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [codes, setCodes] = useLocalStorage<TotpCode[]>('twoauth_codes', []);
  const [deletedCodes, setDeletedCodes] = useLocalStorage<DeletedTotpCode[]>('twoauth_deleted_codes', []);
  const [settings, setSettings] = useLocalStorage<Settings>('twoauth_settings', defaultSettings);
  const [masterPasswordHash, setMasterPasswordHash] = useLocalStorage<string | null>('twoauth_master_hash', null);
  const [settingsPasswordHash, setSettingsPasswordHash] = useLocalStorage<string | null>('twoauth_settings_hash', null);
  const [webAuthnCredentialId, setWebAuthnCredentialId] = useLocalStorage<string | null>('twoauth_webauthn_id', null);
  const [isPanicModeActive, setIsPanicModeActive] = useLocalStorage<boolean>('twoauth_panic_mode', false);
  const [failedAttempts, setFailedAttempts] = useLocalStorage<number>('twoauth_failed_attempts', 0);
  const [selfDestructInfo, setSelfDestructInfo] = useLocalStorage<SelfDestructInfo>('twoauth_selfdestruct', { triggerTimestamp: null, gracePeriod: 0 });
  
  const [isLocked, setIsLocked] = useState(true);
  const [isObfuscated, setIsObfuscated] = useState(false);
  
  const [t, setT] = useState(translations.en);

  useEffect(() => {
    const lang = settings.language as keyof typeof translations;
    setT(translations[lang] || translations.en);
  }, [settings.language]);

  const checkAndExecuteSelfDestruct = useCallback(() => {
    if (selfDestructInfo.triggerTimestamp && codes.length > 0) {
      const now = Date.now();
      const endTime = selfDestructInfo.triggerTimestamp + selfDestructInfo.gracePeriod * 1000;
      if (now >= endTime) {
        setCodes([]);
        setSelfDestructInfo({ triggerTimestamp: null, gracePeriod: 0 });
        setFailedAttempts(0);
        console.log("Self-destruct executed.");
      }
    }
  }, [codes.length, selfDestructInfo, setCodes, setFailedAttempts, setSelfDestructInfo]);

  useEffect(() => {
    checkAndExecuteSelfDestruct();
    // Check every minute
    const interval = setInterval(checkAndExecuteSelfDestruct, 60000);
    return () => clearInterval(interval);
  }, [checkAndExecuteSelfDestruct]);


  useEffect(() => {
    // Try to get browser language on first load if no language is set
    if (typeof window !== 'undefined' && !settings.language) {
        const browserLang = navigator.language.split('-')[0];
        updateSettings({ language: ['en', 'ro', 'es'].includes(browserLang) ? browserLang : 'en' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addCode = (code: Omit<TotpCode, 'id' | 'iconUrl'>) => {
    const newCode: TotpCode = { 
      ...code, 
      id: crypto.randomUUID(),
      category: code.category || 'General',
      iconUrl: getIconUrl(code.issuer),
    };
    setCodes([...codes, newCode]);
  };
  
  const updateCode = (updatedCode: TotpCode) => {
    setCodes(codes.map(c => c.id === updatedCode.id ? { ...updatedCode, iconUrl: getIconUrl(updatedCode.issuer) } : c));
  };
  
  const deleteCode = (id: string) => {
    const codeToMove = codes.find(c => c.id === id);
    if (codeToMove) {
      const deletedCode: DeletedTotpCode = { ...codeToMove, deletedAt: Date.now() };
      setDeletedCodes([...deletedCodes, deletedCode]);
      setCodes(codes.filter(c => c.id !== id));
    }
  };

  const restoreCode = (id: string) => {
    const codeToRestore = deletedCodes.find(c => c.id === id);
    if (codeToRestore) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { deletedAt, ...originalCode } = codeToRestore;
      setCodes([...codes, originalCode]);
      setDeletedCodes(deletedCodes.filter(c => c.id !== id));
    }
  };
  
  const deleteCodePermanently = (id: string) => {
    setDeletedCodes(deletedCodes.filter(c => c.id !== id));
  };
  
  const emptyTrash = () => {
    setDeletedCodes([]);
  };

  const restoreCodes = (newCodes: TotpCode[]) => {
    const processedCodes = newCodes.map(c => ({
        ...c,
        category: c.category || 'General',
        iconUrl: getIconUrl(c.issuer),
    }));
    setCodes(processedCodes);
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prevSettings) => ({ ...prevSettings, ...newSettings }));
  };
  
  const getCategories = useCallback((): string[] => {
      const categories = new Set(codes.map(c => c.category || 'General'));
      return Array.from(categories);
  }, [codes]);

  const codesByCategory = useMemo((): CodesByCategory => {
    return codes.reduce((acc, code) => {
      const category = code.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(code);
      return acc;
    }, {} as CodesByCategory);
  }, [codes]);

  const lockApp = useCallback(() => {
    if (masterPasswordHash) {
      setIsLocked(true);
    }
  }, [masterPasswordHash]);
  

  const cancelSelfDestruct = () => {
    setFailedAttempts(0);
    setSelfDestructInfo({ triggerTimestamp: null, gracePeriod: 0 });
  }

  const unlockApp = (password: string): boolean => {
    if (isPanicModeActive) {
        if(password === settingsPasswordHash) {
            cancelSelfDestruct();
            setIsLocked(false);
            return true;
        }
        return false;
    }
    
    // Normal unlock flow
    if (password === masterPasswordHash) {
      cancelSelfDestruct();
      setIsLocked(false);
      return true;
    }

    if (settings.selfDestructEnabled) {
      const newAttemptCount = failedAttempts + 1;
      setFailedAttempts(newAttemptCount);

      if (newAttemptCount >= MAX_FAILED_ATTEMPTS) {
        setSelfDestructInfo({
          triggerTimestamp: Date.now(),
          gracePeriod: settings.selfDestructGracePeriod,
        });
        if (settings.selfDestructGracePeriod === 0) {
            checkAndExecuteSelfDestruct();
        }
      }
    }
    
    return false;
  };

  const setMasterPassword = (password: string) => {
    setMasterPasswordHash(password);
    setIsLocked(false);
  };

  const clearObfuscation = () => {
    setIsObfuscated(false);
  }

  const setSettingsPassword = (password: string) => {
      setSettingsPasswordHash(password);
  }
  
  const verifySettingsPassword = (password: string): boolean => {
      return password === settingsPasswordHash;
  }

  const togglePanicMode = (active: boolean) => {
    // Only allow deactivation from settings if password is provided
    if (!active && isPanicModeActive) {
        setIsPanicModeActive(false);
        return;
    }
    // Activation logic
    setIsPanicModeActive(active);
    if(active) {
        lockApp();
    }
  }

  const verifyDiscreetModePin = (pin: string): boolean => {
    return settings.discreetMode.pin === pin;
  };
  
  const exitDiscreetMode = () => {
    // This function will simply prepare the app state to show the real lock screen.
    // The component will handle the rest.
    lockApp();
  };

  // --- Biometrics ---
  const registerBiometrics = async (): Promise<boolean> => {
    try {
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: {
          name: 'TwoAuth',
          id: window.location.hostname,
        },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: 'user@twoauth.app',
          displayName: 'TwoAuth User',
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }], // ES256
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (credential?.id) {
        const credentialId = bufferEncode(credential.rawId);
        setWebAuthnCredentialId(credentialId);
        updateSettings({ isBiometricEnabled: true });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Biometric registration failed:', err);
      updateSettings({ isBiometricEnabled: false });
      return false;
    }
  };
  
  const unregisterBiometrics = () => {
      setWebAuthnCredentialId(null);
      updateSettings({ isBiometricEnabled: false, requireBiometricsForCodes: false });
  };
  
  const verifyWithBiometrics = async (): Promise<boolean> => {
    if (!webAuthnCredentialId || !settings.isBiometricEnabled) return false;
    
    try {
       const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{
          id: bufferDecode(webAuthnCredentialId),
          type: 'public-key',
        }],
        timeout: 60000,
        userVerification: 'required',
      };
      
      const credential = await navigator.credentials.get({ publicKey: publicKeyCredentialRequestOptions });
      
      return !!credential;
    } catch(err) {
      console.error('Biometric verification failed:', err);
      return false;
    }
  }

  const unlockWithBiometrics = async (): Promise<boolean> => {
    if (isPanicModeActive) return false;
    const success = await verifyWithBiometrics();
    if(success) {
      cancelSelfDestruct();
      setIsLocked(false);
      return true;
    }
    return false;
  };


  // Auto-lock and obfuscation timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isLocked && settings.autoLock > 0) {
      const handleInactivity = () => {
          if (settings.visualObfuscation) {
            setIsObfuscated(true);
          }
          lockApp();
      };
      
      const resetTimer = () => {
        clearObfuscation();
        clearTimeout(timer);
        timer = setTimeout(handleInactivity, settings.autoLock * 1000);
      };
      
      window.addEventListener('pointermove', resetTimer);
      window.addEventListener('keypress', resetTimer);
      window.addEventListener('click', resetTimer);
      window.addEventListener('touchstart', resetTimer);
      resetTimer();

      return () => {
        clearTimeout(timer);
        window.removeEventListener('pointermove', resetTimer);
        window.removeEventListener('keypress', resetTimer);
        window.removeEventListener('click', resetTimer);
        window.removeEventListener('touchstart', resetTimer);
      };
    }
  }, [isLocked, settings.autoLock, settings.visualObfuscation, lockApp]);

  useEffect(() => {
    if (!masterPasswordHash) {
      setIsLocked(true); // Treat "no password" as locked until one is set.
    }
    
    if (!webAuthnCredentialId) {
        if(settings.isBiometricEnabled) {
            updateSettings({ isBiometricEnabled: false, requireBiometricsForCodes: false });
        }
    }
    setIsInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterPasswordHash, webAuthnCredentialId]);


  return (
    <AppContext.Provider
      value={{
        codes,
        deletedCodes,
        addCode,
        updateCode,
        deleteCode,
        restoreCode,
        deleteCodePermanently,
        emptyTrash,
        restoreCodes,
        settings,
        updateSettings,
        isInitialized,
        isLocked,
        lockApp,
        unlockApp,
        hasMasterPassword: masterPasswordHash !== null,
        setMasterPassword,
        registerBiometrics,
        unregisterBiometrics,
        unlockWithBiometrics,
        verifyWithBiometrics,
        isObfuscated,
        clearObfuscation,
        hasSettingsPassword: settingsPasswordHash !== null,
        setSettingsPassword,
        verifySettingsPassword,
        isPanicModeActive,
        togglePanicMode,
        getCategories,
        codesByCategory,
        selfDestructInfo,
        failedAttempts,
        cancelSelfDestruct,
        verifyDiscreetModePin,
        exitDiscreetMode,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
