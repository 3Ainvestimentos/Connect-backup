
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
import { RecipientSelectionModal } from './RecipientSelectionModal';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Input } from '../ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const maintenanceSchema = z.object({
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().min(10, 'A mensagem de manutenção deve ter pelo menos 10 caracteres.'),
  allowedUserIds: z.array(z.string()).optional(),
});
type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

const termsSchema = z.object({
  termsUrl: z.string().url("Por favor, insira uma URL válida.").or(z.literal('')),
});
type TermsFormValues = z.infer<typeof termsSchema>;

const privacySchema = z.object({
  privacyPolicyUrl: z.string().url("Por favor, insira uma URL válida.").or(z.literal('')),
});
type PrivacyFormValues = z.infer<typeof privacySchema>;


function MaintenanceCard() {
  const { settings, loading, updateSystemSettings } = useSystemSettings();
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isUpdatingSwitch, setIsUpdatingSwitch] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting: isFormSubmitting } } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
  });

  useEffect(() => {
    if (!loading && settings) {
      reset({
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        allowedUserIds: settings.allowedUserIds,
      });
    }
  }, [settings, loading, reset]);

  const onSubmitMaintenanceDetails = async (data: MaintenanceFormValues) => {
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
  const { collaborators } = useCollaborators();

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
                        disabled={isFormSubmitting}
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
                    <Button type="submit" disabled={isFormSubmitting} className="bg-admin-primary hover:bg-admin-primary/90 shadow-lg">
                        {isFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Detalhes da Manutenção
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

    const termsForm = useForm<TermsFormValues>({
        resolver: zodResolver(termsSchema),
    });

    const privacyForm = useForm<PrivacyFormValues>({
        resolver: zodResolver(privacySchema),
    });

    useEffect(() => {
        if (!loading && settings) {
            termsForm.reset({
                termsUrl: settings.termsUrl,
            });
            privacyForm.reset({
                privacyPolicyUrl: settings.privacyPolicyUrl,
            });
        }
    }, [settings, loading, termsForm.reset, privacyForm.reset]);

    const onSubmitTerms = async (data: TermsFormValues) => {
        const currentVersion = settings.termsVersion || 1;
        const newVersion = currentVersion + 1;
        
        try {
            await updateSystemSettings({
                termsUrl: data.termsUrl,
                termsVersion: newVersion,
            });
            toast({
                title: "Termos de Uso Publicados",
                description: `A versão foi atualizada para ${newVersion.toFixed(1)} e uma nova rodada de aceite será iniciada.`,
            });
            termsForm.reset(data);
        } catch (error) {
            toast({ title: 'Erro ao Salvar', description: 'Não foi possível salvar os Termos de Uso.', variant: 'destructive' });
        }
    };
    
    const onSubmitPrivacy = async (data: PrivacyFormValues) => {
        const currentVersion = settings.privacyPolicyVersion || 1;
        const newVersion = currentVersion + 1;
        try {
            await updateSystemSettings({
                privacyPolicyUrl: data.privacyPolicyUrl,
                privacyPolicyVersion: newVersion,
            });
            toast({ title: "Política de Privacidade Salva", description: `A URL foi atualizada com sucesso para a versão ${newVersion.toFixed(1)}.` });
            privacyForm.reset(data);
        } catch (error) {
            toast({ title: 'Erro ao Salvar', description: 'Não foi possível salvar a Política de Privacidade.', variant: 'destructive' });
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
                    Gerencie os links para os Termos de Uso e Política de Privacidade.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 <form onSubmit={termsForm.handleSubmit(onSubmitTerms)} className="space-y-4">
                    <div className="p-4 border rounded-lg bg-background">
                         <h3 className="font-semibold text-lg">Termos de Uso</h3>
                         <p className="text-sm text-muted-foreground mb-4">Atualize o link e salve para forçar uma nova rodada de aceite pelos usuários.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Versão Atual</Label>
                                <div className="h-10 px-3 py-2 border rounded-md bg-muted text-muted-foreground w-24 flex items-center">
                                    {(settings.termsVersion || 1).toFixed(1)}
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 border rounded-md bg-muted/50 flex flex-col items-center justify-center gap-1">
                                    <UserCheck className="h-6 w-6 text-green-600" />
                                    <p className="text-xl font-bold">{collaborators.length - pendingAcceptanceCount}</p>
                                    <p className="text-xs text-muted-foreground">Aceites</p>
                                </div>
                                <div className="p-3 border rounded-md bg-muted/50 flex flex-col items-center justify-center gap-1">
                                    <Users className="h-6 w-6 text-yellow-600" />
                                    <p className="text-xl font-bold">{pendingAcceptanceCount}</p>
                                    <p className="text-xs text-muted-foreground">Pendentes</p>
                                </div>
                             </div>
                        </div>
                        <div className="space-y-2 mt-4">
                            <Label htmlFor="termsUrl">URL dos Termos de Uso (.docx)</Label>
                            <Input id="termsUrl" {...termsForm.register('termsUrl')} placeholder="Cole a URL pública do seu arquivo .docx aqui..."/>
                            <p className="text-xs text-muted-foreground mt-1">Este documento será exibido no modal de aceite.</p>
                            {termsForm.formState.errors.termsUrl && <p className="text-sm text-destructive mt-1">{termsForm.formState.errors.termsUrl.message}</p>}
                        </div>
                        <div className="flex justify-end mt-4">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" disabled={!termsForm.formState.isDirty} className="bg-admin-primary hover:bg-admin-primary/90">
                                        Salvar e Publicar Nova Versão
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar Nova Versão?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Ao salvar, a versão dos Termos de Uso será incrementada para {(settings.termsVersion + 1).toFixed(1)}. Todos os usuários serão solicitados a aceitar os novos termos no próximo acesso. Deseja continuar?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={termsForm.handleSubmit(onSubmitTerms)}>Sim, publicar nova versão</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </form>

                 <form onSubmit={privacyForm.handleSubmit(onSubmitPrivacy)} className="space-y-4">
                     <div className="p-4 border rounded-lg bg-background">
                        <h3 className="font-semibold text-lg">Política de Privacidade</h3>
                        <p className="text-sm text-muted-foreground mb-4">Atualize o link que será exibido no FAQ. Esta ação não solicita novo aceite dos usuários.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                             <div className="space-y-2">
                                <Label>Versão Atual</Label>
                                <div className="h-10 px-3 py-2 border rounded-md bg-muted text-muted-foreground w-24 flex items-center">
                                    {(settings.privacyPolicyVersion || 1).toFixed(1)}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 mt-4">
                            <Label htmlFor="privacyPolicyUrl">URL da Política de Privacidade (.docx)</Label>
                            <Input id="privacyPolicyUrl" {...privacyForm.register('privacyPolicyUrl')} placeholder="Cole a URL pública do seu arquivo .docx aqui..."/>
                            {privacyForm.formState.errors.privacyPolicyUrl && <p className="text-sm text-destructive mt-1">{privacyForm.formState.errors.privacyPolicyUrl.message}</p>}
                        </div>
                         <div className="flex justify-end mt-4">
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" disabled={!privacyForm.formState.isDirty} className="bg-admin-primary hover:bg-admin-primary/90">
                                        Salvar e Publicar Nova Versão
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar Nova Versão?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Ao salvar, a versão da Política de Privacidade será incrementada para {(settings.privacyPolicyVersion + 1).toFixed(1)} para fins de controle, mas não solicitará um novo aceite dos usuários. Deseja continuar?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={privacyForm.handleSubmit(onSubmitPrivacy)}>Sim, publicar nova versão</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </form>
            </CardContent>
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
