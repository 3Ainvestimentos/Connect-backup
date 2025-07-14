
"use client";

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format, formatISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import type { DateRange } from 'react-day-picker';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import type { Application } from '@/contexts/ApplicationsContext';


// Define a more flexible structure for the form data
interface WorkflowRequestForm {
  dateRange?: DateRange;
  note?: string;
}

interface WorkflowSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowType: Application;
}

export default function WorkflowSubmissionModal({ open, onOpenChange, workflowType }: WorkflowSubmissionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addRequest } = useWorkflows();
  const { user } = useAuth();
  const { collaborators } = useCollaborators();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<WorkflowRequestForm>({
    defaultValues: {
      dateRange: { from: undefined, to: undefined },
      note: '',
    },
  });
  
  const dateRange = watch("dateRange");

  const onSubmit = async (data: WorkflowRequestForm) => {
    const currentUserCollab = collaborators.find(c => c.email === user?.email);

    if (!user || !currentUserCollab) {
        toast({
            title: "Erro de Autenticação",
            description: "Não foi possível identificar o colaborador. Verifique se seu e-mail está cadastrado.",
            variant: "destructive"
        });
        return;
    }
    if (!workflowType) {
        toast({ title: "Erro", description: "Tipo de workflow não definido.", variant: "destructive" });
        return;
    }
    
    // Basic validation for date range if it's part of the form
    if (!data.dateRange?.from || !data.dateRange?.to) {
        toast({ title: "Erro de Validação", description: "Por favor, selecione um período de início e fim.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    
    try {
        const now = new Date();
        await addRequest({
            type: workflowType.name,
            status: 'pending',
            submittedBy: {
                userId: currentUserCollab.id3a,
                userName: currentUserCollab.name,
                userEmail: currentUserCollab.email,
            },
            submittedAt: formatISO(now),
            lastUpdatedAt: formatISO(now),
            formData: {
                startDate: data.dateRange.from ? formatISO(data.dateRange.from, { representation: 'date' }) : undefined,
                endDate: data.dateRange.to ? formatISO(data.dateRange.to, { representation: 'date' }) : undefined,
                note: data.note || '',
            },
            history: [{
                timestamp: formatISO(now),
                status: 'pending',
                userId: currentUserCollab.id3a,
                userName: currentUserCollab.name,
                notes: 'Solicitação criada.'
            }],
        });
        
        toast({
            title: "Solicitação Enviada!",
            description: `Seu pedido de '${workflowType.name}' foi enviado para aprovação.`,
        });

        reset();
        onOpenChange(false);

    } catch (error) {
        console.error("Failed to submit workflow request:", error);
        toast({
            title: "Erro ao Enviar",
            description: "Não foi possível enviar sua solicitação. Tente novamente.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  // Close and reset form when dialog is closed
  React.useEffect(() => {
    if (!open) {
      reset({
        dateRange: { from: undefined, to: undefined },
        note: '',
      });
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] font-body">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{workflowType.name}</DialogTitle>
          <DialogDescription>
            {workflowType.description || "Preencha as informações abaixo para iniciar sua solicitação."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="date">Período</Label>
            <Controller
              name="dateRange"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value?.from && 'text-muted-foreground'
                      )}
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value?.from ? (
                        field.value.to ? (
                          <>
                            {format(field.value.from, 'LLL dd, y', { locale: ptBR })} -{' '}
                            {format(field.value.to, 'LLL dd, y', { locale: ptBR })}
                          </>
                        ) : (
                          format(field.value.from, 'LLL dd, y', { locale: ptBR })
                        )
                      ) : (
                        <span>Escolha um período</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={field.value?.from}
                      selected={field.value as DateRange}
                      onSelect={(range) => setValue("dateRange", range || { from: undefined, to: undefined })}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
             {(errors.dateRange?.from || errors.dateRange?.to) && <p className="text-sm text-destructive">Por favor, selecione um período de início e fim.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Observação (Opcional)</Label>
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                 <Textarea
                    id="note"
                    placeholder="Adicione um comentário para o seu gestor..."
                    className="resize-none"
                    {...field}
                    disabled={isSubmitting}
                  />
              )}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting} className="hover:bg-muted">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" variant="secondary" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
