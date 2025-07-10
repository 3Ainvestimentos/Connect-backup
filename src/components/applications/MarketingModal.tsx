
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface MarketingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MarketingModal({ open, onOpenChange }: MarketingModalProps) {
  const marketingFormLink = "https://forms.office.com/Pages/ResponsePage.aspx?id=ACXbfB7NAUCLvGYkkS8Uk0wzLLokHd5Mrr88ExH4nVVUN0JCUDBWUjlHN1hPMFU5NlNCOFUyRloxVS4u";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md font-body">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Solicitações Marketing</DialogTitle>
          <DialogDescription className="text-left pt-2 text-sm text-foreground">
            Preencha o formulário abaixo de forma clara e objetiva. As solicitações serão desenvolvidas por ordem de prioridade e urgência.
            <br/><br/>
            O SLA do atendimento será enviado por meio de Slack no momento de recebimento da sua demanda.
            <br/><br/>
            Obrigada!
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <p className="font-bold text-sm">Link:</p>
          <Button variant="link" asChild className="p-0 h-auto font-normal text-base text-accent -translate-x-1 whitespace-normal text-left break-all">
              <Link href={marketingFormLink} target="_blank" rel="noopener noreferrer">
                  {marketingFormLink}
              </Link>
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline" className="hover:bg-muted">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
