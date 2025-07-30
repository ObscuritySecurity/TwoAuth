
'use client';

import { useContext, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Trash2, ShieldQuestion, AlertTriangle, Undo2 } from 'lucide-react';
import { AppContext, DeletedTotpCode } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays } from 'date-fns';

const TRASH_RETENTION_DAYS = 30;

function DeletedCodeCard({ code }: { code: DeletedTotpCode }) {
  const context = useContext(AppContext);
  const { toast } = useToast();
  const [hasIconError, setHasIconError] = useState(false);

  if (!context) return null;
  const { restoreCode, deleteCodePermanently, t } = context;

  const handleRestore = () => {
    restoreCode(code.id);
    toast({
      title: t.trash.codeRestored,
      description: t.trash.codeRestoredDesc,
    });
  };

  const handleDeletePermanent = () => {
    deleteCodePermanently(code.id);
    toast({
      title: t.trash.codeDeleted,
      variant: 'destructive',
    });
  };

  const renderIcon = () => {
    const iconUrl = code.iconUrl;
    if (iconUrl && !hasIconError) {
      return (
        <Image
          src={iconUrl}
          alt={`${code.issuer} logo`}
          width={32}
          height={32}
          className="rounded-full"
          onError={() => setHasIconError(true)}
        />
      );
    }
    return <ShieldQuestion className="h-8 w-8 text-muted-foreground" />;
  };

  const daysSinceDeletion = differenceInDays(new Date(), new Date(code.deletedAt));
  const daysLeft = Math.max(0, TRASH_RETENTION_DAYS - daysSinceDeletion);
  
  return (
    <Card className="bg-card/50">
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">{renderIcon()}</div>

          {/* Info */}
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{code.issuer}</p>
            <p className="truncate text-sm text-muted-foreground">{code.account}</p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleRestore} aria-label={t.trash.restore}>
              <Undo2 className="h-5 w-5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label={t.trash.deletePermanent}>
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="text-destructive"/>
                    {t.trash.deletePermanentConfirmTitle}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.trash.deletePermanentConfirmDesc}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.totp.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletePermanent} className="bg-destructive hover:bg-destructive/90">
                    {t.trash.deletePermanent}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        {/* Deletion Info */}
        <div className="pt-4 border-t border-border/50">
           <p className="text-xs text-muted-foreground">
             {t.trash.deletedOn} {new Date(code.deletedAt).toLocaleDateString()}. {t.trash.autoDeleteIn} {daysLeft} {daysLeft === 1 ? t.trash.day : t.trash.days}.
           </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrashPage() {
  const context = useContext(AppContext);

  if (!context) {
    return null; // Or a loading state
  }

  const { deletedCodes, emptyTrash, t } = context;

  return (
    <>
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="font-headline text-xl font-bold">{t.trash.title}</h1>
        </div>
        {deletedCodes.length > 0 && (
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t.trash.emptyTrash}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-destructive"/>
                            {t.trash.emptyTrashConfirmTitle}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t.trash.emptyTrashConfirmDesc}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t.totp.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={emptyTrash} className="bg-destructive hover:bg-destructive/90">
                            {t.trash.emptyTrash}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        {deletedCodes.length > 0 ? (
          <div className="space-y-4">
            {deletedCodes.map((code) => (
              code ? <DeletedCodeCard key={code.id} code={code} /> : null
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Trash2 className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 font-headline text-2xl font-bold">{t.trash.emptyTitle}</h2>
            <p className="mt-2 max-w-xs text-muted-foreground">{t.trash.emptySubtitle}</p>
          </div>
        )}
      </main>
    </>
  );
}
