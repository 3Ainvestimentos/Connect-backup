
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { PollType, usePolls } from '@/contexts/PollsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PollModalProps {
  poll: PollType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PollModal({ poll, open, onOpenChange }: PollModalProps) {
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitResponse } = usePolls();
  const { user } = useAuth();
  const { collaborators } = useCollaborators();

  const handleSubmit = async () => {
    if (!selectedValue) {
      toast({ title: 'Por favor, selecione uma opção.', variant: 'destructive' });
      return;
    }
    const currentUser = collaborators.find(c => c.email === user?.email);
    if (!currentUser) {
      toast({ title: 'Erro de autenticação', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitResponse(poll.id, {
        userId: currentUser.id3a,
        userName: currentUser.name,
        answer: selectedValue,
        answeredAt: new Date().toISOString(),
      });
      toast({ title: 'Obrigado por responder!', description: 'Sua resposta foi registrada.', variant: 'success' });
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Erro ao enviar resposta', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{poll.question}</DialogTitle>
          <DialogDescription>Sua opinião é importante para nós.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={selectedValue} onValueChange={setSelectedValue}>
            <div className="space-y-2">
              {poll.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>{option}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Fechar
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting || !selectedValue} className="bg-success hover:bg-success/90">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Resposta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
