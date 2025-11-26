
"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface DailyRssModalProps {
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DailyRssModal({ forceOpen = false, onOpenChange }: DailyRssModalProps) {
  const { settings, loading: settingsLoading } = useSystemSettings();
  const [lastSeen, setLastSeen] = useLocalStorage<string>('dailyRssLastSeen', '');
  const [hidePermanently, setHidePermanently] = useLocalStorage<boolean>('hideDailyRss', false);
  const [isOpen, setIsOpen] = useState(false);

  const newsletterUrl = settings.rssNewsletterUrl;

  // Log inicial para debug
  useEffect(() => {
    console.log('[DailyRssModal] Componente montado/atualizado', {
      forceOpen,
      settingsLoading,
      isRssNewsletterActive: settings.isRssNewsletterActive,
      newsletterUrl,
      hidePermanently,
      lastSeen,
      isOpen,
    });
  }, [forceOpen, settingsLoading, settings.isRssNewsletterActive, newsletterUrl, hidePermanently, lastSeen, isOpen]);

  useEffect(() => {
    console.log('[DailyRssModal] useEffect executado', {
      forceOpen,
      settingsLoading,
      isRssNewsletterActive: settings.isRssNewsletterActive,
      newsletterUrl,
      hidePermanently,
      lastSeen,
    });

    if (forceOpen) {
      console.log('[DailyRssModal] forceOpen é true, abrindo modal');
      setIsOpen(true);
      return;
    }

    if (settingsLoading) {
      console.log('[DailyRssModal] Settings ainda carregando, aguardando...');
      return;
    }

    if (!settings.isRssNewsletterActive) {
      console.log('[DailyRssModal] Newsletter não está ativa');
      return;
    }

    if (hidePermanently) {
      console.log('[DailyRssModal] Usuário escondeu permanentemente');
      return;
    }

    if (!newsletterUrl) {
      console.log('[DailyRssModal] URL da newsletter não configurada');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    console.log('[DailyRssModal] Verificando data', { today, lastSeen, isEqual: lastSeen === today });

    if (lastSeen !== today) {
      console.log('[DailyRssModal] Criando timer para abrir modal em 2.5s');
      const timer = setTimeout(() => {
        console.log('[DailyRssModal] Timer executado, abrindo modal');
        setIsOpen(true);
      }, 2500); // Delay opening the modal

      return () => {
        console.log('[DailyRssModal] Limpando timer');
        clearTimeout(timer);
      };
    } else {
      console.log('[DailyRssModal] Já foi visto hoje, não abrindo modal');
    }
  }, [settingsLoading, settings.isRssNewsletterActive, lastSeen, hidePermanently, forceOpen, newsletterUrl]);

  const handleClose = () => {
    console.log('[DailyRssModal] Modal fechado', { forceOpen });
    if (forceOpen && onOpenChange) {
      onOpenChange(false);
    } else {
      const today = new Date().toISOString().split('T')[0];
      // Atualiza lastSeen para hoje, impedindo que apareça novamente hoje
      console.log('[DailyRssModal] Atualizando lastSeen para', today);
      setLastSeen(today);
    }
    setIsOpen(false);
  };

  if (!newsletterUrl) {
    console.log('[DailyRssModal] Retornando null - newsletterUrl não configurada');
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl flex flex-col h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-headline">
            DailyFin
          </DialogTitle>
          <DialogDescription>
            As principais notícias do mercado para começar o seu dia bem informado.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0 border rounded-md overflow-hidden">
          <iframe
            src={newsletterUrl}
            className="w-full h-full border-0"
            title="Newsletter"
          />
        </div>
        <DialogFooter className="flex justify-end items-center pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="hover:bg-muted">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
