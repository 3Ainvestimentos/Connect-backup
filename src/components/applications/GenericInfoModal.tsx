
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { ApplicationLinkItem } from '@/contexts/ApplicationsContext';
import { Link as LinkIcon } from 'lucide-react';

interface GenericInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: {
    title: string;
    description: string;
    items: ApplicationLinkItem[];
  };
}

export default function GenericInfoModal({ open, onOpenChange, content }: GenericInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg font-body">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>
        <div className="py-2 max-h-[60vh] overflow-y-auto pr-4">
          <Accordion type="single" collapsible className="w-full">
            {content.items.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={item.id}>
                <AccordionTrigger className="font-headline text-base text-left">{item.label}</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  {item.subtext && <p className="text-sm text-foreground">{item.subtext}</p>}
                  {item.link && (
                    <div className='flex items-center gap-2'>
                        <LinkIcon className="h-4 w-4 text-accent"/>
                        <Link
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base text-accent hover:underline break-all"
                        >
                            Acessar Link
                        </Link>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline" className="hover:bg-muted">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
