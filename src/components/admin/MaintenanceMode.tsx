
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
import { cn } from '@/lib/utils';

const maintenanceSchema = z.object({
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().min(10, 'A mensagem deve ter pelo menos 10 caracteres.'),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

export function MaintenanceMode() {
  const { settings, loading, updateSystemSettings } = useSystemSettings();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting, isDirty } } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      maintenanceMode: false,
      maintenanceMessage: '',
    },
  });

  // When settings are loaded from the context, reset the form with those values
  useEffect(() => {
    if (!loading) {
      reset(settings);
    }
  }, [settings, loading, reset]);

  const handleSwitchToggle = async (checked: boolean) => {
      setValue('maintenanceMode', checked, { shouldDirty: true });
      try {
        await updateSystemSettings({ maintenanceMode: checked });
         if (checked) {
            toast({
              title: "Modo de Manutenção Ativado!",
              description: "O acesso à plataforma agora está restrito a Super Administradores.",
            });
          } else {
            toast({
              title: "Modo de Manutenção Desativado.",
              description: "O acesso à plataforma foi restaurado para todos os colaboradores.",
            });
          }
      } catch (error) {
           toast({
            title: 'Erro ao Ativar/Desativar',
            description: 'Não foi possível alterar o modo de manutenção.',
            variant: 'destructive',
          });
          // Revert visual state on failure
          setValue('maintenanceMode', !checked, { shouldDirty: true }); 
      }
  };

  const onSubmit = async (data: MaintenanceFormValues) => {
    try {
      // Only update the message, as the switch is handled separately
      await updateSystemSettings({ maintenanceMessage: data.maintenanceMessage });
      toast({
        title: "Mensagem de Manutenção Salva",
        description: "A mensagem foi atualizada com sucesso.",
      });
      reset({ ...data }); // Resets dirty state for the form
    } catch (error) {
      toast({
        title: 'Erro ao Salvar Mensagem',
        description: 'Não foi possível salvar a mensagem de manutenção.',
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
          <div className={cn(
            "rounded-lg border p-4 transition-colors duration-300",
            maintenanceModeOn ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'
          )}>
            <div className="flex items-center space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="maintenance-mode-switch" className="text-base font-bold">
                  {maintenanceModeOn ? "MANUTENÇÃO ATIVA" : "MANUTENÇÃO INATIVA"}
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
                checked={maintenanceModeOn}
                onCheckedChange={handleSwitchToggle}
                disabled={isSubmitting || loading}
                className="data-[state=checked]:bg-[hsl(0,72%,51%)] data-[state=unchecked]:bg-[hsl(142,71%,45%)]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenanceMessage">Mensagem de Manutenção</Label>
            <Textarea
              id="maintenanceMessage"
              {...register('maintenanceMessage')}
              rows={4}
              placeholder="Digite a mensagem que será exibida na tela de login durante a manutenção..."
              disabled={isSubmitting}
            />
             {errors.maintenanceMessage && <p className="text-sm text-destructive mt-1">{errors.maintenanceMessage.message}</p>}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !isDirty} className="bg-admin-primary hover:bg-admin-primary/90">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Mensagem
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
