
"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Rss } from 'lucide-react';

interface DailyRssModalProps {
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DailyRssModal({ forceOpen = false, onOpenChange }: DailyRssModalProps) {
  const { settings, loading: settingsLoading } = useSystemSettings();
  const [lastSeen, setLastSeen] = useLocalStorage<string>('dailyRssLastSeen', '');
  const [hidePermanently, setHidePermanently] = useLocalStorage<boolean>('hideDailyRss', false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }
    if (settingsLoading || !settings.isRssNewsletterActive || hidePermanently) {
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (lastSeen !== today) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2500); // Delay opening the modal

      return () => clearTimeout(timer);
    }
  }, [settingsLoading, settings.isRssNewsletterActive, lastSeen, hidePermanently, forceOpen]);

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    } else {
        const today = new Date().toISOString().split('T')[0];
        setLastSeen(today);
        if (dontShowAgain) {
          setHidePermanently(true);
        }
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl flex flex-col h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-headline">
            <Rss />
            DailyFin
          </DialogTitle>
          <DialogDescription>
            As principais notícias do mercado para começar o seu dia bem informado.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0 border rounded-md overflow-hidden">
          <iframe
            src="https://newsletter.radarfin.com.br/p/609"
            className="w-full h-full border-0"
            title="Newsletter"
          />
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-end items-center pt-4 border-t">
          {!forceOpen && (
             <div className="flex items-center space-x-2">
               <Checkbox id="dont-show-again" checked={dontShowAgain} onCheckedChange={(checked) => setDontShowAgain(!!checked)} />
               <Label htmlFor="dont-show-again" className="text-xs text-muted-foreground">
                 Não mostrar novamente hoje
               </Label>
             </div>
          )}
           <DialogClose asChild>
              <Button type="button" variant="outline" className="hover:bg-muted">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
