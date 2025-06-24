"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SupportModal({ open, onOpenChange }: SupportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md font-body">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Suporte T.I</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm text-foreground">
          <ul className="list-disc list-inside space-y-2">
            <li>Redes Wi-Fi</li>
            <li>Manutenção de Computadores</li>
            <li>Configuração de Impressoras</li>
            <li>Manutenção e criação de fluxos automatizados</li>
            <li>Demais demandas correlatas</li>
          </ul>
          <div className="pt-2">
            <p className="font-bold">Link:</p>
            <Button variant="link" asChild className="p-0 h-auto font-normal text-base text-accent -translate-x-1">
                <Link href="https://forms.office.com/r/Vy5x0qAhC7" target="_blank" rel="noopener noreferrer">
                    https://forms.office.com/r/Vy5x0qAhC7
                </Link>
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
