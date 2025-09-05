
"use client";

import React, { useState, useMemo, useRef } from 'react';
import { useFabMessages, type FabMessageType, type FabMessagePayload, campaignSchema } from '@/contexts/FabMessagesContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2, Loader2, Send, MessageSquare, Edit2, Play, Pause, AlertTriangle, Search, Filter, ChevronUp, ChevronDown, Upload, FileDown, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { useCollaborators, type Collaborator } from '@/contexts/CollaboratorsContext';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '../ui/dropdown-menu';
import Papa from 'papaparse';


const formSchema = z.object({
    pipeline: z.array(campaignSchema).min(1, "O pipeline deve ter pelo menos uma campanha."),
});

type FabMessageFormValues = z.infer<typeof formSchema>;
type SortKey = 'name' | 'status' | 'isActive';
type CampaignType = z.infer<typeof campaignSchema>;


const statusOptions = {
    pending_cta: { label: 'Pendente CTA', className: 'bg-yellow-100 text-yellow-800' },
    pending_follow_up: { label: 'Pendente Acomp.', className: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
    not_created: { label: 'Não Criada', className: 'bg-gray-100 text-gray-800' },
};

const StatusBadge = ({ status }: { status: keyof typeof statusOptions }) => {
    const config = statusOptions[status];
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
};


export function ManageFabMessages() {
    const { fabMessages, upsertMessageForUser, deleteMessageForUser } = useFabMessages();
    const { collaborators } = useCollaborators();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Collaborator | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    const commercialUsers = useMemo(() => {
        const testUsers = [
            'desenvolvedor@3ariva.com.br',
            'matheus@3ainvestimentos.com.br'
        ];
        return collaborators.filter(c => c.axis === 'Comercial' || testUsers.includes(c.email));
    }, [collaborators]);

    const userMessageMap = useMemo(() => {
        const map = new Map<string, FabMessageType>();
        fabMessages.forEach(msg => map.set(msg.userId, msg));
        return map;
    }, [fabMessages]);

     const filteredAndSortedUsers = useMemo(() => {
        let items = [...commercialUsers];

        if (searchTerm) {
            items = items.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (statusFilter.length > 0) {
            items = items.filter(user => {
                const message = userMessageMap.get(user.id3a);
                const status = message?.status || 'not_created';
                return statusFilter.includes(status);
            });
        }
        
        if (activeFilter !== 'all') {
            items = items.filter(user => {
                 const message = userMessageMap.get(user.id3a);
                 const isActive = message?.isActive ?? false;
                 return activeFilter === 'active' ? isActive : !isActive;
            });
        }
        
        items.sort((a, b) => {
            const messageA = userMessageMap.get(a.id3a);
            const messageB = userMessageMap.get(b.id3a);

            let valA: any, valB: any;
            
            switch (sortKey) {
                case 'name':
                    valA = a.name;
                    valB = b.name;
                    break;
                case 'status':
                    valA = messageA?.status || 'not_created';
                    valB = messageB?.status || 'not_created';
                    break;
                case 'isActive':
                    valA = messageA?.isActive ?? false;
                    valB = messageB?.isActive ?? false;
                    break;
                default:
                    return 0;
            }

            let comparison = 0;
            if (valA > valB) comparison = 1;
            else if (valA < valB) comparison = -1;

            return sortDirection === 'asc' ? comparison : -comparison;
        });


        return items;
    }, [commercialUsers, userMessageMap, searchTerm, statusFilter, activeFilter, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };
    
    const toggleStatusFilter = (status: string) => {
        setStatusFilter(prev => 
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const form = useForm<FabMessageFormValues>({
        resolver: zodResolver(formSchema),
    });
    
    const { formState: { isSubmitting }, reset, handleSubmit, control } = form;
    const { fields, append, remove } = useFieldArray({ control, name: "pipeline" });


    const handleOpenForm = (user: Collaborator) => {
        setEditingUser(user);
        const existingMessage = userMessageMap.get(user.id3a);
        if (existingMessage && existingMessage.pipeline) {
            reset({ pipeline: existingMessage.pipeline });
        } else {
             reset({
                pipeline: [{
                    id: `campaign_${Date.now()}`,
                    ctaMessage: 'Sua mensagem de CTA aqui...',
                    followUpMessage: 'Sua mensagem de acompanhamento aqui...'
                }]
            });
        }
        setIsFormOpen(true);
    };
    
    const handleToggleActivation = async (user: Collaborator, isActive: boolean) => {
        const message = userMessageMap.get(user.id3a);
        if (!message) {
            toast({ title: "Atenção", description: "Crie uma campanha primeiro antes de ativá-la.", variant: "destructive" });
            return;
        }
        try {
            await upsertMessageForUser(user.id3a, { isActive });
            toast({ title: "Sucesso", description: `Campanha ${isActive ? 'ativada' : 'pausada'} para ${user.name}.`, variant: 'default' });
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível alterar o status da campanha.", variant: "destructive" });
        }
    };

    const onSubmit = async (data: FabMessageFormValues) => {
        if (!editingUser) return;
        
        const existingMessage = userMessageMap.get(editingUser.id3a);
        const payload: FabMessagePayload = {
            userId: editingUser.id3a,
            userName: editingUser.name,
            pipeline: data.pipeline,
            isActive: existingMessage?.isActive ?? true,
            status: 'pending_cta', // Reset status on new pipeline
            activeCampaignIndex: 0, // Reset index
            archivedCampaigns: existingMessage?.archivedCampaigns || [],
        };

        try {
            await upsertMessageForUser(editingUser.id3a, payload);
            toast({ title: "Sucesso", description: `Pipeline de mensagens para ${editingUser.name} foi salvo.` });
            setIsFormOpen(false);
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível salvar o pipeline.", variant: "destructive" });
        }
    };
    
    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);

        Papa.parse<{ [key: string]: string }>(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const requiredHeaders = ['userEmail', 'ctaMessage', 'followUpMessage'];
                if (!requiredHeaders.every(h => results.meta.fields?.includes(h))) {
                    toast({ title: "Erro de Cabeçalho", description: `O CSV deve conter as colunas: ${requiredHeaders.join(', ')}`, variant: "destructive", duration: 10000 });
                    setIsImporting(false);
                    return;
                }

                const userCampaigns: { [userId: string]: { userName: string, campaigns: CampaignType[] } } = {};

                for (const row of results.data) {
                    const user = collaborators.find(c => c.email === row.userEmail?.trim());
                    if (!user) {
                        console.warn(`Usuário não encontrado para o email: ${row.userEmail}`);
                        continue;
                    }

                    const campaign: CampaignType = {
                        id: `campaign_${Date.now()}_${Math.random()}`,
                        ctaMessage: row.ctaMessage,
                        followUpMessage: row.followUpMessage,
                    };
                    
                    if (!userCampaigns[user.id3a]) {
                        userCampaigns[user.id3a] = { userName: user.name, campaigns: [] };
                    }
                    userCampaigns[user.id3a].campaigns.push(campaign);
                }

                try {
                    const upsertPromises = Object.entries(userCampaigns).map(([userId, { userName, campaigns }]) => {
                        const payload: FabMessagePayload = {
                            userId,
                            userName,
                            pipeline: campaigns,
                            isActive: true,
                            status: 'pending_cta',
                            activeCampaignIndex: 0,
                            archivedCampaigns: [],
                        };
                        return upsertMessageForUser(userId, payload);
                    });
                    
                    await Promise.all(upsertPromises);
                    toast({ title: "Importação Concluída!", description: `${Object.keys(userCampaigns).length} pipelines de usuário foram criados/atualizados.` });
                    setIsImportOpen(false);

                } catch (e) {
                    toast({ title: "Erro na Importação", description: (e as Error).message, variant: "destructive" });
                } finally {
                    setIsImporting(false);
                }
            },
            error: (err) => {
                toast({ title: "Erro ao Ler Arquivo", description: err.message, variant: "destructive" });
                setIsImporting(false);
            }
        });
    };

    const handleDelete = async (userId: string) => {
        if (!window.confirm("Tem certeza que deseja apagar a configuração de mensagens para este usuário? Esta ação é irreversível.")) return;
        try {
             await deleteMessageForUser(userId);
             toast({ title: "Sucesso!", description: "Configuração de mensagens removida." });
        } catch (error) {
             toast({ title: "Erro", description: "Não foi possível remover a configuração.", variant: "destructive" });
        }
    }

    const SortableHeader = ({ tKey, label }: { tKey: SortKey, label: string }) => (
        <TableHead onClick={() => handleSort(tKey)} className="cursor-pointer hover:bg-muted/50">
            <div className="flex items-center gap-1">
                {label}
                {sortKey === tKey && (sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
            </div>
        </TableHead>
    );
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gerenciamento de Mensagens por Colaborador</CardTitle>
                <CardDescription>Configure e envie campanhas de mensagens individuais para os colaboradores do eixo Comercial.</CardDescription>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-4">
                     <div className="relative flex-grow w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por colaborador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex w-full sm:w-auto gap-2">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Status ({statusFilter.length || 'Todos'})
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {Object.entries(statusOptions).map(([key, { label }]) => (
                                    <DropdownMenuCheckboxItem
                                        key={key}
                                        checked={statusFilter.includes(key)}
                                        onCheckedChange={() => toggleStatusFilter(key)}
                                    >
                                        {label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                         <Button onClick={() => setIsImportOpen(true)} variant="outline" className="flex-grow">
                            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                            Importar CSV
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".csv"
                            onChange={handleFileImport}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHeader tKey="name" label="Colaborador" />
                                <SortableHeader tKey="status" label="Status da Campanha" />
                                <TableHead>Progresso</TableHead>
                                <SortableHeader tKey="isActive" label="Ativa" />
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedUsers.map(user => {
                                const message = userMessageMap.get(user.id3a);
                                const progress = message ? `Campanha ${message.activeCampaignIndex + 1}/${message.pipeline.length}` : 'N/A';
                                return (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={message?.status || 'not_created'} />
                                    </TableCell>
                                     <TableCell>
                                        {progress}
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                          checked={message?.isActive ?? false}
                                          onCheckedChange={(checked) => handleToggleActivation(user, checked)}
                                          disabled={!message}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenForm(user)} className="hover:bg-admin-primary/10 hover:text-admin-primary">
                                            <Edit2 className="mr-2 h-4 w-4"/> Gerenciar
                                        </Button>
                                         <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id3a)} disabled={!message}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Configurar Pipeline para</DialogTitle>
                        <DialogDescription>{editingUser?.name}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-6 mt-4 max-h-[60vh] overflow-y-auto pr-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-lg space-y-4 relative bg-card">
                                    <Badge variant="secondary" className="absolute -top-2.5 right-4 bg-muted text-muted-foreground border-border">Campanha {index + 1}</Badge>
                                    
                                    <div>
                                        <Label htmlFor={`pipeline.${index}.ctaMessage`}>Mensagem de CTA (Curta)</Label>
                                        <Textarea 
                                            {...form.register(`pipeline.${index}.ctaMessage`)}
                                            placeholder="Ex: Nova oportunidade de investimento disponível!"
                                            rows={2}
                                        />
                                         {form.formState.errors.pipeline?.[index]?.ctaMessage && <p className="text-sm text-destructive mt-1">{form.formState.errors.pipeline[index]?.ctaMessage?.message}</p>}
                                    </div>
                                    <Separator/>
                                    <div>
                                        <Label htmlFor={`pipeline.${index}.followUpMessage`}>Mensagem de Acompanhamento (Detalhada)</Label>
                                        <Textarea 
                                            {...form.register(`pipeline.${index}.followUpMessage`)}
                                            placeholder="Ex: Explore os detalhes do nosso novo fundo imobiliário com foco em logística..."
                                            rows={4}
                                        />
                                        {form.formState.errors.pipeline?.[index]?.followUpMessage && <p className="text-sm text-destructive mt-1">{form.formState.errors.pipeline[index]?.followUpMessage?.message}</p>}
                                    </div>

                                     <div className="flex justify-end">
                                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            ))}

                             <Button type="button" variant="outline" className="w-full" onClick={() => append({ id: `campaign_${Date.now()}`, ctaMessage: '', followUpMessage: '' })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Campanha ao Pipeline
                            </Button>
                        </div>
                         <DialogFooter className="!justify-between mt-6">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
                            </DialogClose>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    Salvar Pipeline
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Importar Campanhas via CSV</DialogTitle>
                        <DialogDescription>
                            Faça o upload de um arquivo CSV para criar ou substituir pipelines de campanhas para múltiplos usuários.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                         <div className="p-4 rounded-md border border-amber-500/50 bg-amber-500/10 text-amber-700">
                           <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-600 flex-shrink-0"/>
                                <div>
                                    <p className="font-semibold">Atenção: A importação irá sobrescrever o pipeline existente para os e-mails informados no arquivo.</p>
                                </div>
                           </div>
                        </div>

                        <h3 className="font-semibold">Instruções:</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                            <li>Crie uma planilha com uma linha para **cada campanha** de um usuário.</li>
                            <li>A primeira linha **deve** ser um cabeçalho com os seguintes nomes de coluna, exatamente como mostrado:
                                <code className="block bg-muted p-2 rounded-md my-2 text-xs">userEmail,ctaMessage,followUpMessage</code>
                            </li>
                             <li>Para criar um pipeline para um usuário, adicione múltiplas linhas com o mesmo `userEmail`. A ordem das linhas no arquivo definirá a ordem do pipeline.</li>
                             <li>Exporte ou salve o arquivo no formato **CSV (Valores Separados por Vírgula)**.</li>
                        </ol>
                         <a href="/templates/modelo_campanhas_fab.csv" download className="inline-block" >
                            <Button variant="secondary">
                                <FileDown className="mr-2 h-4 w-4"/>
                                Baixar Modelo CSV
                            </Button>
                        </a>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImportOpen(false)} disabled={isImporting}>
                            Cancelar
                        </Button>
                        <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
                            {isImporting ? 'Importando...' : 'Selecionar Arquivo'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
