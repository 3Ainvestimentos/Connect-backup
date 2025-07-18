
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format, formatISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, Paperclip, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import type { DateRange } from 'react-day-picker';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { FormFieldDefinition, WorkflowDefinition } from '@/contexts/ApplicationsContext';
import { uploadFile } from '@/lib/firestore-service';

type DynamicFormData = { [key: string]: any };

interface WorkflowSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowDefinition: WorkflowDefinition;
}

export default function WorkflowSubmissionModal({ open, onOpenChange, workflowDefinition }: WorkflowSubmissionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileFields, setFileFields] = useState<{[key: string]: File | null}>({});
  const { addRequest, updateRequestAndNotify } = useWorkflows();
  const { user } = useAuth();
  const { collaborators } = useCollaborators();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<DynamicFormData>();

  useEffect(() => {
    // Reset form when definition changes or modal opens/closes
    if (open) {
      const defaultValues: DynamicFormData = {};
      workflowDefinition.fields.forEach(field => {
        defaultValues[field.id] = field.type === 'date-range' ? { from: undefined, to: undefined } : '';
      });
      reset(defaultValues);
      setFileFields({});
    }
  }, [open, workflowDefinition, reset]);

  const handleFileChange = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileFields(prev => ({...prev, [fieldId]: e.target.files![0]}));
    }
  };

  const onSubmit = async (data: DynamicFormData) => {
    const currentUserCollab = collaborators.find(c => c.email === user?.email);

    if (!user || !currentUserCollab) {
      toast({ title: "Erro de Autenticação", description: "Não foi possível identificar o colaborador.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
        const now = new Date();
        const initialStatus = workflowDefinition.statuses?.[0]?.id || 'pending';
        
        // 1. Create the initial request to get an ID
        const initialRequestPayload = {
            type: workflowDefinition.name,
            status: initialStatus,
            submittedBy: { userId: currentUserCollab.id3a, userName: currentUserCollab.name, userEmail: currentUserCollab.email },
            submittedAt: formatISO(now),
            lastUpdatedAt: formatISO(now),
            formData: {}, // To be populated later
            history: [{ timestamp: formatISO(now), status: initialStatus, userId: currentUserCollab.id3a, userName: currentUserCollab.name, notes: 'Solicitação criada.' }],
        };

        const newRequest = await addRequest(initialRequestPayload);

        // 2. Upload files if any
        const fileUploadPromises = Object.entries(fileFields).map(([fieldId, file]) => {
            if (file) {
                return uploadFile(file, currentUserCollab.id3a, newRequest.id, file.name);
            }
            return Promise.resolve(null);
        });

        const uploadedFileUrls = await Promise.all(fileUploadPromises);
        
        // 3. Prepare the final form data
        const formDataForFirestore = { ...data };
        let fileUrlIndex = 0;
        for (const fieldId in fileFields) {
            if (fileFields[fieldId]) {
                formDataForFirestore[fieldId] = uploadedFileUrls[fileUrlIndex];
                fileUrlIndex++;
            }
        }
         workflowDefinition.fields.forEach(field => {
            if (field.type === 'date-range' && formDataForFirestore[field.id]) {
                formDataForFirestore[field.id] = {
                    from: formDataForFirestore[field.id].from ? formatISO(formDataForFirestore[field.id].from, { representation: 'date' }) : null,
                    to: formDataForFirestore[field.id].to ? formatISO(formDataForFirestore[field.id].to, { representation: 'date' }) : null,
                };
            }
        });

        // 4. Update the request with the complete form data
        await updateRequestAndNotify({
            id: newRequest.id,
            formData: formDataForFirestore
        });

        toast({ title: "Solicitação Enviada!", description: `Seu pedido de '${workflowDefinition.name}' foi enviado para aprovação.` });
        onOpenChange(false);

    } catch (error) {
      console.error("Failed to submit workflow request:", error);
      toast({ title: "Erro ao Enviar", description: error instanceof Error ? error.message : "Não foi possível enviar sua solicitação.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormFieldDefinition) => {
    const error = errors[field.id];
    
    switch (field.type) {
      case 'file':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}{field.required && ' *'}</Label>
            <div className="relative">
                <Input id={field.id} type="file" onChange={(e) => handleFileChange(field.id, e)} className="pl-10" disabled={isSubmitting}/>
                <Paperclip className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {fileFields[field.id] && <p className="text-xs text-muted-foreground">Arquivo selecionado: {fileFields[field.id]?.name}</p>}
            {error && <p className="text-sm text-destructive">{error.message?.toString()}</p>}
          </div>
        );
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}{field.required && ' *'}</Label>
            <Controller name={field.id} control={control} rules={{ required: field.required }} render={({ field: controllerField }) => <Input id={field.id} {...controllerField} placeholder={field.placeholder} disabled={isSubmitting} />} />
            {error && <p className="text-sm text-destructive">{error.message?.toString()}</p>}
          </div>
        );
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}{field.required && ' *'}</Label>
            <Controller name={field.id} control={control} rules={{ required: field.required }} render={({ field: controllerField }) => <Textarea id={field.id} {...controllerField} placeholder={field.placeholder} disabled={isSubmitting} />} />
            {error && <p className="text-sm text-destructive">{error.message?.toString()}</p>}
          </div>
        );
      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}{field.required && ' *'}</Label>
            <Controller
              name={field.id}
              control={control}
              rules={{ required: field.required }}
              render={({ field: controllerField }) => (
                <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value} disabled={isSubmitting}>
                  <SelectTrigger id={field.id}><SelectValue placeholder={field.placeholder || 'Selecione...'} /></SelectTrigger>
                  <SelectContent>
                    {field.options?.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {error && <p className="text-sm text-destructive">{error.message?.toString()}</p>}
          </div>
        );
      case 'date-range':
        return (
           <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}{field.required && ' *'}</Label>
            <Controller
              name={field.id}
              control={control}
              rules={{ required: field.required }}
              render={({ field: controllerField }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id={field.id}
                      variant={'outline'}
                      className={cn('w-full justify-start text-left font-normal', !controllerField.value?.from && 'text-muted-foreground')}
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {controllerField.value?.from ? (
                        controllerField.value.to ? (
                          <>{format(controllerField.value.from, 'LLL dd, y', { locale: ptBR })} - {format(controllerField.value.to, 'LLL dd, y', { locale: ptBR })}</>
                        ) : (
                          format(controllerField.value.from, 'LLL dd, y', { locale: ptBR })
                        )
                      ) : (
                        <span>{field.placeholder || 'Escolha um período'}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={controllerField.value?.from}
                      selected={controllerField.value as DateRange}
                      onSelect={controllerField.onChange}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {error && <p className="text-sm text-destructive">{error.message?.toString()}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg font-body">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{workflowDefinition.name}</DialogTitle>
          <DialogDescription>{workflowDefinition.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
          {workflowDefinition.fields.map(field => renderField(field))}
        </form>
         <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting} className="hover:bg-muted">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enviar Solicitação
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
