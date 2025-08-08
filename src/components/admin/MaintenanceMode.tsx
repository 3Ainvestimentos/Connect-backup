
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useSystemSettings, type SystemSettings } from '@/contexts/SystemSettingsContext';
import { toast } from '@/hooks/use-toast';
import { Loader2, Construction, Users, FileText, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { RecipientSelectionModal } from './RecipientSelectionModal';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Input } from '../ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactMarkdown } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Schema for the maintenance message and allowed users
const maintenanceDetailsSchema = z.object({
  maintenanceMessage: z.string().min(10, 'A mensagem de manutenção deve ter pelo menos 10 caracteres.'),
  allowedUserIds: z.array(z.string()).optional(),
});
type MaintenanceDetailsFormValues = z.infer<typeof maintenanceDetailsSchema>;

// Schema for the legal documents
const legalDocsSchema = z.object({
  termsUrl: z.string().url("Por favor, insira uma URL válida para os Termos de Uso.").or(z.literal('')),
  privacyPolicyUrl: z.string().url("Por favor, insira uma URL válida para a Política de Privacidade.").or(z.literal('')),
  termsVersion: z.coerce.number().min(1, 'A versão deve ser um número maior que zero.'),
});
type LegalDocsFormValues = z.infer<typeof legalDocsSchema>;


function MaintenanceCard() {
  const { settings, loading, updateSystemSettings } = useSystemSettings();
  const { collaborators } = useCollaborators();
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isUpdatingSwitch, setIsUpdatingSwitch] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting, isDirty } } = useForm<MaintenanceDetailsFormValues>({
    resolver: zodResolver(maintenanceDetailsSchema),
    defaultValues: {
      maintenanceMessage: '',
      allowedUserIds: [],
    },
  });

  useEffect(() => {
    if (!loading && settings) {
      reset({
        maintenanceMessage: settings.maintenanceMessage,
        allowedUserIds: settings.allowedUserIds,
      });
    }
  }, [settings, loading, reset]);

  const onSubmitMaintenanceDetails = async (data: MaintenanceDetailsFormValues) => {
    try {
      await updateSystemSettings({ 
        maintenanceMessage: data.maintenanceMessage,
        allowedUserIds: data.allowedUserIds,
      });
      toast({
        title: "Detalhes de Manutenção Salvos",
        description: "A mensagem e os usuários autorizados foram atualizados.",
      });
      reset(data);
    } catch (error) {
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar os detalhes da manutenção.',
        variant: 'destructive',
      });
    }
  };
  
  const handleMaintenanceToggle = async (checked: boolean) => {
    setIsUpdatingSwitch(true);
    try {
        await updateSystemSettings({ maintenanceMode: checked });
        toast({
            title: `Modo de Manutenção ${checked ? 'ATIVADO' : 'DESATIVADO'}`,
            description: `A plataforma agora está ${checked ? 'restrita a usuários autorizados' : 'acessível a todos'}.`,
            variant: checked ? 'destructive' : 'default',
        });
    } catch (error) {
        toast({
            title: "Erro",
            description: "Não foi possível alterar o modo de manutenção.",
            variant: "destructive"
        });
    } finally {
        setIsUpdatingSwitch(false);
    }
  };

  const allowedUserIds = watch('allowedUserIds') || [];

  const getRecipientDescription = (ids: string[]) => {
      if (!ids || ids.length === 0) return 'Nenhum usuário extra autorizado.';
      if (ids.length === 1) return '1 usuário autorizado.';
      return `${ids.length} usuários autorizados.`;
  }
  
  return (
    <>
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Construction className="h-6 w-6"/>Modo de Manutenção</CardTitle>
            <CardDescription>
                Ative para suspender o acesso, exceto para Super Admins e usuários autorizados.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className={cn(
                "rounded-lg border p-4 transition-colors duration-300",
                settings.maintenanceMode ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'
            )}>
                <div className="flex items-center space-x-4">
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="maintenance-mode-switch" className="text-base font-bold">
                        {settings.maintenanceMode ? "MANUTENÇÃO ATIVA" : "MANUTENÇÃO INATIVA"}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                        {settings.maintenanceMode 
                            ? "Acesso restrito a usuários autorizados."
                            : "Acesso liberado para todos os colaboradores."
                        }
                        </p>
                    </div>
                     <Switch
                        id="maintenance-mode-switch"
                        checked={settings.maintenanceMode}
                        onCheckedChange={handleMaintenanceToggle}
                        disabled={isUpdatingSwitch || loading}
                        className="data-[state=checked]:bg-[hsl(0,72%,51%)] data-[state=unchecked]:bg-[hsl(142,71%,45%)]"
                    />
                </div>
            </div>
             <form onSubmit={handleSubmit(onSubmitMaintenanceDetails)} className="space-y-4">
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
                    <Button type="submit" disabled={isSubmitting || !isDirty} className="bg-admin-primary hover:bg-admin-primary/90 shadow-lg">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Detalhes
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>

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
    </>
  );
}


function LegalDocsCard() {
    const { settings, loading, updateSystemSettings } = useSystemSettings();
    const { collaborators } = useCollaborators();

    const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<LegalDocsFormValues>({
        resolver: zodResolver(legalDocsSchema),
        defaultValues: {
            termsUrl: '',
            privacyPolicyUrl: '',
            termsVersion: 1,
        },
    });

    useEffect(() => {
        if (!loading && settings) {
            reset({
                termsUrl: settings.termsUrl,
                privacyPolicyUrl: settings.privacyPolicyUrl,
                termsVersion: settings.termsVersion,
            });
        }
    }, [settings, loading, reset]);

    const onSubmitLegalDocs = async (data: LegalDocsFormValues) => {
        try {
            await updateSystemSettings({
                termsUrl: data.termsUrl,
                privacyPolicyUrl: data.privacyPolicyUrl,
                termsVersion: data.termsVersion,
            });
            toast({
                title: "Documentos Legais Salvos",
                description: "As URLs e a versão dos termos foram atualizadas com sucesso.",
            });
            reset(data);
        } catch (error) {
            toast({
                title: 'Erro ao Salvar',
                description: 'Não foi possível salvar as configurações dos documentos.',
                variant: 'destructive',
            });
        }
    };
    
    const pendingAcceptanceCount = useMemo(() => {
        if (loading || !collaborators.length) return 0;
        return collaborators.filter(c => (c.acceptedTermsVersion || 0) < settings.termsVersion).length;
    }, [collaborators, settings.termsVersion, loading]);
    
    return (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-6 w-6"/>Gerenciamento de Documentos Legais</CardTitle>
                <CardDescription>
                    Insira as URLs dos documentos e aumente a versão dos Termos para forçar todos os usuários a aceitá-los novamente.
                </CardDescription>
            </CardHeader>
             <form onSubmit={handleSubmit(onSubmitLegalDocs)}>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="termsVersion">Versão dos Termos</Label>
                            <Input id="termsVersion" type="number" {...register('termsVersion')} className="w-24" />
                            {errors.termsVersion && <p className="text-sm text-destructive mt-1">{errors.termsVersion.message}</p>}
                        </div>
                         <div className="p-3 border rounded-md bg-muted/50 flex items-center justify-center gap-4">
                             <UserCheck className="h-8 w-8 text-green-600" />
                             <div className="text-center">
                                <p className="text-2xl font-bold">{collaborators.length - pendingAcceptanceCount}</p>
                                <p className="text-xs text-muted-foreground">Usuários Aceitaram</p>
                             </div>
                             <Users className="h-8 w-8 text-yellow-600" />
                              <div className="text-center">
                                <p className="text-2xl font-bold">{pendingAcceptanceCount}</p>
                                <p className="text-xs text-muted-foreground">Aceites Pendentes</p>
                             </div>
                         </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="termsUrl">URL dos Termos de Uso (.docx)</Label>
                        <Input id="termsUrl" {...register('termsUrl')} placeholder="Cole a URL pública do seu arquivo .docx aqui..."/>
                        <p className="text-xs text-muted-foreground">Este documento será exibido no modal de aceite.</p>
                        {errors.termsUrl && <p className="text-sm text-destructive mt-1">{errors.termsUrl.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="privacyPolicyUrl">URL da Política de Privacidade (.docx)</Label>
                        <Input id="privacyPolicyUrl" {...register('privacyPolicyUrl')} placeholder="Cole a URL pública do seu arquivo .docx aqui..."/>
                        <p className="text-xs text-muted-foreground">Este documento será acessível no FAQ.</p>
                        {errors.privacyPolicyUrl && <p className="text-sm text-destructive mt-1">{errors.privacyPolicyUrl.message}</p>}
                    </div>
                </CardContent>
                <div className="p-6 pt-0 flex justify-end">
                    <Button type="submit" disabled={isSubmitting || !isDirty} className="bg-admin-primary hover:bg-admin-primary/90 shadow-lg">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Documentos Legais
                    </Button>
                </div>
            </form>
        </Card>
    );
}

export function MaintenanceMode() {
  return (
    <div className="space-y-6">
      <MaintenanceCard />
      <LegalDocsCard />
    </div>
  );
}

