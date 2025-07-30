
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { toast } from '@/hooks/use-toast';
import { Loader2, Construction } from 'lucide-react';

const maintenanceSchema = z.object({
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().min(10, 'A mensagem deve ter pelo menos 10 caracteres.'),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

export function MaintenanceMode() {
  const { settings, loading, updateSystemSettings } = useSystemSettings();

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting, isDirty } } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: settings,
  });

  // When settings are loaded from the context, reset the form with those values
  useEffect(() => {
    if (!loading) {
      reset(settings);
    }
  }, [settings, loading, reset]);

  const onSubmit = async (data: MaintenanceFormValues) => {
    try {
      await updateSystemSettings(data);
      toast({
        title: 'Configurações Salvas!',
        description: 'O modo de manutenção foi atualizado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar as configurações de manutenção.',
        variant: 'destructive',
      });
    }
  };
  
  const maintenanceModeOn = watch('maintenanceMode');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Construction className="h-6 w-6"/>Modo de Manutenção</CardTitle>
        <CardDescription>
            Ative para suspender o acesso de todos os usuários, exceto Super Admins.
            Ideal para realizar atualizações ou manutenções na plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center space-x-4 rounded-lg border p-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="maintenance-mode-switch" className="text-base">
                Ativar Modo de Manutenção
              </Label>
              <p className="text-sm text-muted-foreground">
                {maintenanceModeOn 
                  ? "Acesso restrito apenas para Super Administradores."
                  : "Acesso liberado para todos os colaboradores."
                }
              </p>
            </div>
            <Switch
              id="maintenance-mode-switch"
              {...register('maintenanceMode')}
              checked={maintenanceModeOn}
              onCheckedChange={(checked) => reset({ ...watch(), maintenanceMode: checked })}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenanceMessage">Mensagem de Manutenção</Label>
            <Textarea
              id="maintenanceMessage"
              {...register('maintenanceMessage')}
              rows={4}
              placeholder="Digite a mensagem que será exibida na tela de login..."
              disabled={isSubmitting}
            />
             {errors.maintenanceMessage && <p className="text-sm text-destructive mt-1">{errors.maintenanceMessage.message}</p>}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !isDirty} className="bg-admin-primary hover:bg-admin-primary/90">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
