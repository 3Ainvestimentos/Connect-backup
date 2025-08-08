
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TermsOfUseModalProps {
  isOpen: boolean;
  content: string;
  onAccept: () => Promise<boolean>;
  onDecline: () => void;
}

export function TermsOfUseModal({ isOpen, content, onAccept, onDecline }: TermsOfUseModalProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    setIsSubmitting(true);
    const success = await onAccept();
    if (!success) {
      setIsSubmitting(false); // Only stop loading on failure, as success will unmount
    }
  };

  const handleDecline = () => {
    toast({
        title: "Acesso Recusado",
        description: "Você precisa aceitar os termos para utilizar a plataforma.",
        variant: "destructive"
    });
    onDecline();
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-2xl flex flex-col h-[90vh]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">Termos de Uso e Política de Privacidade</DialogTitle>
          <DialogDescription>
            Por favor, leia e aceite os termos para continuar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0 border rounded-md">
            <ScrollArea className="h-full p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {content}
                </div>
            </ScrollArea>
        </div>
        <div className="flex items-center space-x-2 pt-4">
          <Checkbox id="terms-checkbox" checked={isChecked} onCheckedChange={(checked) => setIsChecked(!!checked)} />
          <Label htmlFor="terms-checkbox" className="font-medium text-sm">
            Eu li e concordo com os Termos de Uso e a Política de Privacidade.
          </Label>
        </div>
        <DialogFooter>
          <Button variant="destructive" onClick={handleDecline}>Recusar e Sair</Button>
          <Button onClick={handleAccept} disabled={!isChecked || isSubmitting} className="bg-success hover:bg-success/90">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Aceitar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
