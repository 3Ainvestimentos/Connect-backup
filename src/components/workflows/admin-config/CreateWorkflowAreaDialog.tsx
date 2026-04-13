"use client";

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getIcon } from '@/lib/icons';
import { iconList } from '@/lib/icon-list';
import { useAuth } from '@/contexts/AuthContext';
import { createWorkflowArea } from '@/lib/workflows/admin-config/api-client';

const schema = z.object({
  name: z.string().min(1, 'Informe o nome da area.'),
  icon: z.string().min(1, 'Selecione um icone.'),
});

type FormValues = z.infer<typeof schema>;

export function CreateWorkflowAreaDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      icon: 'FolderOpen',
    },
  });

  useEffect(() => {
    if (open) {
      reset({ name: '', icon: 'FolderOpen' });
    }
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      return;
    }

    try {
      const area = await createWorkflowArea(user, values);
      toast({
        title: 'Area criada',
        description: `A area ${area.name} foi criada com sucesso.`,
      });
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast({
        title: 'Falha ao criar area',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova area</DialogTitle>
          <DialogDescription>Crie uma nova area administrativa sem expor o path de storage na UI.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="workflow-area-name">Nome da area</Label>
            <Input id="workflow-area-name" {...register('name')} />
            {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Icone</Label>
            <Controller
              name="icon"
              control={control}
              render={({ field }) => {
                const Icon = getIcon(field.value);
                return (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{field.value}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-72">
                        {iconList.map((iconName) => {
                          const ItemIcon = getIcon(iconName);
                          return (
                            <SelectItem key={iconName} value={iconName}>
                              <div className="flex items-center gap-2">
                                <ItemIcon className="h-4 w-4" />
                                <span>{iconName}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                );
              }}
            />
            <p className="text-xs text-muted-foreground">
              `storageFolderPath` sera derivado automaticamente no servidor.
            </p>
            {errors.icon ? <p className="text-sm text-destructive">{errors.icon.message}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Criar area
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
