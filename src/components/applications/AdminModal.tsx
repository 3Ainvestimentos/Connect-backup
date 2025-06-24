
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminModal({ open, onOpenChange }: AdminModalProps) {
  const sharepointLink = "https://gruporivaaai.sharepoint.com/:u:/s/3arivainvestimentos/EUBgzGqPS9hEmUFIRK1Bj0oBbeuqOr0Yb5f6IwSBdRCqsg?e=StGSA3";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg font-body">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Administrativo</DialogTitle>
          <DialogDescription>
            Acesse os formulários e informações do setor administrativo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 max-h-[60vh] overflow-y-auto pr-4">
          <Accordion type="single" collapsible className="w-full" defaultValue='item-1'>
            <AccordionItem value="item-1">
              <AccordionTrigger className="font-headline text-base text-left">Compra de suprimentos</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <ul className="list-disc list-inside space-y-2 text-sm text-foreground">
                  <li>Matérias de escritório</li>
                  <li>Suprimentos em geral</li>
                  <li className="font-bold text-destructive">Somente Líderes ou Autorizados</li>
                </ul>
                <div>
                  <p className="font-bold text-sm">Link:</p>
                  <Button variant="link" asChild className="p-0 h-auto font-normal text-base text-accent -translate-x-1">
                    <Link href="https://bit.ly/3AQEGIh" target="_blank" rel="noopener noreferrer">
                      https://bit.ly/3AQEGIh
                    </Link>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="font-headline text-base text-left">Solicitação de compras em geral</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <ul className="list-disc list-inside space-y-2 text-sm text-foreground">
                  <li>Equipamentos de escritório</li>
                  <li className="font-bold text-destructive">Somente Líderes</li>
                </ul>
                <div>
                  <p className="font-bold text-sm">Link:</p>
                   <Button variant="link" asChild className="p-0 h-auto font-normal text-base text-accent -translate-x-1 text-left break-all">
                    <Link href={sharepointLink} target="_blank" rel="noopener noreferrer">
                      {sharepointLink}
                    </Link>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="font-headline text-base text-left">Manutenções de escritório</AccordionTrigger>
              <AccordionContent className="pt-2">
                <div>
                  <p className="font-bold text-sm">Link:</p>
                  <Button variant="link" asChild className="p-0 h-auto font-normal text-base text-accent -translate-x-1">
                    <Link href="https://forms.office.com/r/jB8iCrsHy7" target="_blank" rel="noopener noreferrer">
                      https://forms.office.com/r/jB8iCrsHy7
                    </Link>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
