
"use client";

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import type { DateRange } from 'react-day-picker';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { useAuth } from '@/contexts/AuthContext';

const vacationRequestSchema = z.object({
  requestType: z.string().min(1, "O tipo de solicitação é obrigatório."),
  dateRange: z.object({
    from: z.date({ required_error: "A data de início é obrigatória." }),
    to: z.date({ required_error: "A data de término é obrigatória." }),
  }),
  note: z.string().optional(),
});

type VacationRequestForm = z.infer<typeof vacationRequestSchema>;

interface VacationRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingDays?: number;
}

export default function VacationRequestModal({ open, onOpenChange, remainingDays = 20 }: VacationRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addRequest } = useWorkflows();
  const { user } = useAuth();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<VacationRequestForm>({
    resolver: zodResolver(vacationRequestSchema),
    defaultValues: {
      requestType: 'Férias',
      dateRange: { from: undefined, to: undefined },
      note: '',
    },
  });
  
  const dateRange = watch("dateRange");

  const onSubmit = async (data: VacationRequestForm) => {
    if (!user) {
        toast({
            title: "Erro de Autenticação",
            description: "Você precisa estar logado para fazer uma solicitação.",
            variant: "destructive"
        });
        return;
    }

    setIsSubmitting(true);
    
    try {
        const now = new Date();
        await addRequest({
            type: 'vacation_request',
            status: 'pending',
            submittedBy: {
                userId: user.uid,
                userName: user.displayName || 'Nome não encontrado',
                userEmail: user.email || 'Email não encontrado',
            },
            submittedAt: formatISO(now),
            lastUpdatedAt: formatISO(now),
            formData: {
                requestType: data.requestType,
                startDate: formatISO(data.dateRange.from, { representation: 'date' }),
                endDate: formatISO(data.dateRange.to, { representation: 'date' }),
                note: data.note || '',
                remainingDaysOnSubmit: remainingDays,
            },
            history: [{
                timestamp: formatISO(now),
                status: 'pending',
                userId: user.uid,
                userName: user.displayName || 'Nome não encontrado',
                notes: 'Solicitação criada.'
            }],
        });
        
        toast({
            title: "Solicitação Enviada!",
            description: `Seu pedido de ${data.requestType.toLowerCase()} foi enviado para aprovação.`,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] font-body">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Solicitar Férias</DialogTitle>
          <DialogDescription>
            Você tem <span className="font-bold text-primary">{remainingDays} dias</span> de férias restantes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="requestType">Tipo de solicitação</Label>
            <Controller
              name="requestType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                  <SelectTrigger id="requestType">
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Férias">Férias</SelectItem>
                    <SelectItem value="Licença Médica">Licença Médica</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.requestType && <p className="text-sm text-destructive">{errors.requestType.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
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
            <Label htmlFor="note">Nota (Opcional)</Label>
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
