
"use client";

import React, { useEffect, useState } from 'react';
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
import { Loader2, Construction, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { RecipientSelectionModal } from './RecipientSelectionModal';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Input } from '../ui/input';

const settingsSchema = z.object({
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().min(10, 'A mensagem de manutenção deve ter pelo menos 10 caracteres.'),
  allowedUserIds: z.array(z.string()).optional(),
  termsContent: z.string().min(20, 'O conteúdo dos termos deve ter pelo menos 20 caracteres.'),
  termsVersion: z.coerce.number().min(1, 'A versão deve ser um número maior que zero.'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

function TermsManager() {
    const { settings, updateSystemSettings } = useSystemSettings();
    const { handleSubmit, register, reset, formState: { errors, isSubmitting, isDirty } } = useForm<Pick<SettingsFormValues, 'termsContent' | 'termsVersion'>>({
        resolver: zodResolver(settingsSchema.pick({ termsContent: true, termsVersion: true })),
        defaultValues: {
            termsContent: settings.termsContent,
            termsVersion: settings.termsVersion,
        }
    });

    useEffect(() => {
        reset({
            termsContent: settings.termsContent,
            termsVersion: settings.termsVersion,
        });
    }, [settings, reset]);

    const onTermsSubmit = async (data: Pick<SettingsFormValues, 'termsContent' | 'termsVersion'>) => {
        try {
            await updateSystemSettings(data);
            toast({ title: "Termos de Uso salvos com sucesso." });
            reset(data); // Reseta o 'dirty' state
        } catch (error) {
            toast({ title: "Erro ao salvar os termos.", description: (error as Error).message, variant: "destructive"});
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-6 w-6"/> Gerenciamento de Termos de Uso</CardTitle>
                <CardDescription>
                    Edite o conteúdo e a versão dos Termos de Uso. Aumentar a versão forçará todos os usuários a aceitarem os termos novamente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onTermsSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="termsVersion">Versão dos Termos</Label>
                        <Input id="termsVersion" type="number" {...register('termsVersion')} className="w-24" />
                        {errors.termsVersion && <p className="text-sm text-destructive mt-1">{errors.termsVersion.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="termsContent">Conteúdo dos Termos</Label>
                        <Textarea id="termsContent" {...register('termsContent')} rows={10} placeholder="Cole ou digite os termos de uso aqui..."/>
                        {errors.termsContent && <p className="text-sm text-destructive mt-1">{errors.termsContent.message}</p>}
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting || !isDirty} className="bg-admin-primary hover:bg-admin-primary/90">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Termos
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}


export function MaintenanceMode() {
  const { settings, loading, updateSystemSettings } = useSystemSettings();
  const { collaborators } = useCollaborators();
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting, isDirty } } = useForm<Omit<SettingsFormValues, 'termsContent' | 'termsVersion'>>({
    resolver: zodResolver(settingsSchema.omit({ termsContent: true, termsVersion: true })),
    defaultValues: {
      maintenanceMode: false,
      maintenanceMessage: '',
      allowedUserIds: [],
    },
  });

  useEffect(() => {
    if (!loading) {
      reset({
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        allowedUserIds: settings.allowedUserIds || [],
      });
    }
  }, [settings, loading, reset]);

  const onSubmit = async (data: Omit<SettingsFormValues, 'termsContent' | 'termsVersion'>) => {
    try {
      await updateSystemSettings({ 
        maintenanceMode: data.maintenanceMode,
        maintenanceMessage: data.maintenanceMessage,
        allowedUserIds: data.allowedUserIds,
      });
      toast({
        title: "Configurações de Manutenção Salvas",
        description: "As alterações foram salvas com sucesso.",
      });
      reset({ ...data }); 
    } catch (error) {
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar as configurações de manutenção.',
        variant: 'destructive',
      });
    }
  };
  
  const maintenanceModeOn = watch('maintenanceMode');
  const allowedUserIds = watch('allowedUserIds') || [];

  const getRecipientDescription = (ids: string[]) => {
      if (!ids || ids.length === 0) return 'Nenhum usuário extra autorizado.';
      if (ids.length === 1) return '1 usuário autorizado.';
      return `${ids.length} usuários autorizados.`;
  }

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Construction className="h-6 w-6"/>Modo de Manutenção</CardTitle>
            <CardDescription>
                Ative para suspender o acesso, exceto para Super Admins e usuários autorizados.
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
                        ? "Acesso restrito a usuários autorizados."
                        : "Acesso liberado para todos os colaboradores."
                      }
                    </p>
                  </div>
                  <Switch
                    id="maintenance-mode-switch"
                    checked={maintenanceModeOn}
                    onCheckedChange={(checked) => setValue('maintenanceMode', checked, { shouldDirty: true })}
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

              <Separator/>
              
              <div className="space-y-2">
                <Label>Usuários Autorizados na Manutenção</Label>
                <p className="text-sm text-muted-foreground">
                  Estes usuários poderão acessar a plataforma mesmo com o modo de manutenção ativo.
                  Super Admins sempre têm acesso.
                </p>
                <Button type="button" variant="outline" className="w-full justify-start text-left" onClick={() => setIsSelectionModalOpen(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>{getRecipientDescription(allowedUserIds)}</span>
                </Button>
              </div>


              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || !isDirty} className="bg-admin-primary hover:bg-admin-primary/90">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Configs de Manutenção
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <Separator />

        <TermsManager />

        <RecipientSelectionModal
            isOpen={isSelectionModalOpen}
            onClose={() => setIsSelectionModalOpen(false)}
            allCollaborators={collaborators}
            selectedIds={allowedUserIds}
            onConfirm={(newIds) => {
                const finalIds = newIds.includes('all') ? [] : newIds;
                setValue('allowedUserIds', finalIds, { shouldDirty: true, shouldValidate: true });
                setIsSelectionModalOpen(false);
            }}
        />
    </div>
  );
}
