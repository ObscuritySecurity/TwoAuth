'use client';

import { TotpCard } from './totp-card';
import { AnimatePresence, motion } from 'framer-motion';
import type { TotpCode } from '@/context/app-context';

interface TotpListProps {
  codes: TotpCode[];
  isPanicMode?: boolean;
}

export function TotpList({ codes, isPanicMode = false }: TotpListProps) {
  return (
    <div className="space-y-4">
        <AnimatePresence>
            {codes.map((code) => (
                <motion.div
                    key={code.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <TotpCard code={code} isPanicMode={isPanicMode} />
                </motion.div>
            ))}
        </AnimatePresence>
    </div>
  );
}
