"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const GOOGLE_FORM_EMBED_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdZgUCsdah8ED2bieRUFbjw4wuzOO-bouQTxW18xhjLdhyp-Q/viewform?embedded=true';

interface FormularioGoogleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FormularioGoogleModal({ open, onOpenChange }: FormularioGoogleModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-[min(96vw,42rem)] max-w-[42rem] flex-col gap-0 overflow-hidden p-0 sm:max-w-[42rem]">
        <DialogHeader className="shrink-0 space-y-0 border-b px-3 py-3 sm:px-4">
          <DialogTitle className="text-base font-headline sm:text-lg">Formulário</DialogTitle>
        </DialogHeader>
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-muted/20">
          <iframe
            src={GOOGLE_FORM_EMBED_URL}
            className="absolute left-[-12px] top-0 h-full w-[calc(100%+12px)] max-w-none border-0 bg-background"
            title="Formulário Google"
          />
        </div>
        <DialogFooter className="shrink-0 border-t px-3 py-2 sm:px-4 sm:py-3">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="font-body">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
