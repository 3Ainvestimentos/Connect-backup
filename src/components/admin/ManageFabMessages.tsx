

"use client";

import React, { useState, useMemo, useRef } from 'react';
import { useFabMessages, type FabMessageType, type FabMessagePayload, campaignSchema, campaignTags, CampaignType } from '@/contexts/FabMessagesContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2, Loader2, Send, MessageSquare, Edit2, Play, Pause, AlertTriangle, Search, Filter, ChevronUp, ChevronDown, Upload, FileDown, GripVertical, PieChart, Archive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { useCollaborators, type Collaborator } from '@/contexts/CollaboratorsContext';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '../ui/dropdown-menu';
import Papa from 'papaparse';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '../ui/scroll-area';


const formSchema = z.object({
    pipeline: z.array(campaignSchema).min(1, "O pipeline deve ter pelo menos uma campanha."),
});

type FabMessageFormValues = z.infer<typeof formSchema>;
type SortKey = keyof Collaborator | 'status' | 'isActive';


const statusOptions: { [key: string]: { label: string, className: string } } = {
    ready: { label: 'Pronto para Envio', className: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-200 dark:border-cyan-800' },
    pending_cta: { label: 'Pendente CTA', className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-800' },
    completed: { label: 'Concluído', className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-800' },
    not_created: { label: 'Não Criada', className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/50 dark:text-gray-200 dark:border-gray-600' },
};


const campaignStatusBadgeClasses: Record<CampaignType['status'], string> = {
    loaded: "bg-gray-200 text-gray-800",
    active: "bg-yellow-200 text-yellow-800 animate-pulse",
    completed: "bg-green-200 text-green-800",
};


const StatusBadge = ({ status }: { status: keyof typeof statusOptions }) => {
    const config = statusOptions[status];
    if (!config) {
        return <Badge variant="outline">Desconhecido</Badge>;
    }
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
};

export function ManageFabMessages() {
    const { fabMessages, upsertMessageForUser, deleteMessageForUser, startCampaign, archiveIndividualCampaign } = useFabMessages();
    const { collaborators } = useCollaborators();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Collaborator | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isSendingBulk, setIsSendingBulk] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    
    const [filters, setFilters] = useState<{
        area: string[],
        position: string[],
        segment: string[],
        leader: string[],
        status: string[],
    }>({ area: [], position: [], segment: [], leader: [], status: [] });

    const commercialUsers = useMemo(() => {
        const testUsers = [
            'desenvolvedor@3ariva.com.br',
            'matheus@3ainvestimentos.com.br'
        ];
        return collaborators.filter(c => c.axis === 'Comercial' || testUsers.includes(c.email));
    }, [collaborators]);
    
    const { uniqueAreas, uniquePositions, uniqueSegments, uniqueLeaders } = useMemo(() => {
        const areas = new Set<string>();
        const positions = new Set<string>();
        const segments = new Set<string>();
        const leaders = new Set<string>();
        commercialUsers.forEach(c => {
            areas.add(c.area);
            positions.add(c.position);
            segments.add(c.segment);
            leaders.add(c.leader);
        });
        return {
            uniqueAreas: [...areas].sort(),
            uniquePositions: [...positions].sort(),
            uniqueSegments: [...segments].sort(),
            uniqueLeaders: [...leaders].sort(),
        }
    }, [commercialUsers]);

    const userMessageMap = useMemo(() => {
        const map = new Map<string, FabMessageType>();
        fabMessages.forEach(msg => map.set(msg.userId, msg));
        return map;
    }, [fabMessages]);

     const filteredAndSortedUsers = useMemo(() => {
        let items = [...commercialUsers];

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            items = items.filter(user => 
                user.name.toLowerCase().includes(lowercasedTerm) ||
                user.email.toLowerCase().includes(lowercasedTerm)
            );
        }
        
        Object.entries(filters).forEach(([key, values]) => {
            if (values.length > 0) {
                 if (key === 'status') {
                    items = items.filter(user => {
                        const message = userMessageMap.get(user.id3a);
                        const status = message?.status || 'not_created';
                        return values.includes(status);
                    });
                } else {
                    items = items.filter(user => values.includes(user[key as keyof Collaborator] as string));
                }
            }
        });
        
        items.sort((a, b) => {
            let valA: any, valB: any;
            
            if (sortKey === 'status' || sortKey === 'isActive') {
                 const messageA = userMessageMap.get(a.id3a);
                 const messageB = userMessageMap.get(b.id3a);
                 valA = sortKey === 'status' ? (messageA?.status || 'not_created') : (messageA?.isActive ?? false);
                 valB = sortKey === 'status' ? (messageB?.status || 'not_created') : (messageB?.isActive ?? false);
            } else {
                 valA = a[sortKey as keyof Collaborator] as any;
                 valB = b[sortKey as keyof Collaborator] as any;
            }

            let comparison = 0;
            if (valA > valB) comparison = 1;
            else if (valA < valB) comparison = -1;

            return sortDirection === 'asc' ? comparison : -comparison;
        });


        return items;
    }, [commercialUsers, userMessageMap, searchTerm, filters, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };
    
    const handleFilterChange = (filterKey: keyof typeof filters, value: string) => {
        setFilters(prev => {
            const currentValues = prev[filterKey];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [filterKey]: newValues };
        });
    };

    const handleBulkStartCampaign = async () => {
        if (selectedUserIds.length === 0) return;
        setIsSendingBulk(true);
        const promises = selectedUserIds.map(userId => startCampaign(userId));
        try {
            await Promise.all(promises);
            toast({
                title: "Sucesso!",
                description: `${selectedUserIds.length} campanha(s) enviada(s) para os colaboradores.`,
                variant: 'success'
            });
            setSelectedUserIds([]);
        } catch (error) {
            toast({
                title: "Erro ao Enviar em Lote",
                description: (error as Error).message,
                variant: "destructive"
            });
        } finally {
            setIsSendingBulk(false);
        }
    };
    
    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            const readyUserIds = filteredAndSortedUsers
                .filter(user => {
                    const message = userMessageMap.get(user.id3a);
                    return message?.status === 'ready';
                })
                .map(user => user.id3a);
            setSelectedUserIds(readyUserIds);
        } else {
            setSelectedUserIds([]);
        }
    };
    
    const isAllReadyUsersSelected = useMemo(() => {
        const readyUserIds = filteredAndSortedUsers
            .filter(user => userMessageMap.get(user.id3a)?.status === 'ready')
            .map(user => user.id3a);
        return readyUserIds.length > 0 && readyUserIds.every(id => selectedUserIds.includes(id));
    }, [filteredAndSortedUsers, selectedUserIds, userMessageMap]);

    const form = useForm<FabMessageFormValues>({
        resolver: zodResolver(formSchema),
    });
    
    const { formState: { isSubmitting }, reset, handleSubmit, control } = form;
    const { fields, append, remove } = useFieldArray({ control, name: "pipeline" });

    const handleRemoveCampaign = async (index: number) => {
        if (!editingUser) return;
        const currentPipeline = form.getValues('pipeline');
        const newPipeline = currentPipeline.filter((_, i) => i !== index);

        // Remove from the form state first for instant UI update
        remove(index);

        // Then, persist this change to the backend
        try {
            await upsertMessageForUser(editingUser.id3a, { pipeline: newPipeline });
            toast({ title: 'Campanha removida do pipeline.' });
        } catch (error) {
            toast({ title: 'Erro ao remover', description: (error as Error).message, variant: 'destructive' });
            // If the backend fails, revert the form state (optional, but good practice)
            reset({ pipeline: currentPipeline });
        }
    };
    
    const handleArchiveCampaignClick = async (campaignId: string) => {
        if (!editingUser) return;
        setIsArchiving(true);
        try {
            await archiveIndividualCampaign(editingUser.id3a, campaignId);
            const updatedMessage = fabMessages.find(m => m.userId === editingUser.id3a);
            if (updatedMessage) {
                reset({ pipeline: updatedMessage.pipeline });
            }
            toast({ title: 'Campanha arquivada com sucesso!' });
        } catch (error) {
            toast({ title: 'Erro ao arquivar', description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsArchiving(false);
        }
    }


    const handleOpenForm = (user: Collaborator) => {
        setEditingUser(user);
        const existingMessage = userMessageMap.get(user.id3a);
        if (existingMessage && existingMessage.pipeline) {
            reset({ pipeline: existingMessage.pipeline });
        } else {
             reset({
                pipeline: [{
                    id: `campaign_${Date.now()}`,
                    ctaMessage: '',
                    followUpMessage: '',
                    tag: 'Relacionamento',
                    status: 'loaded',
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
        
        // Reset status of completed campaigns that might have been edited.
        const updatedPipeline = data.pipeline.map(campaign => {
            if (campaign.status === 'completed') {
                return { ...campaign, status: 'loaded' as const };
            }
            return campaign;
        });

        const payload: FabMessagePayload = {
            userId: editingUser.id3a,
            userName: editingUser.name,
            pipeline: updatedPipeline,
            isActive: existingMessage?.isActive ?? true,
            status: 'ready', // Always set to 'ready' on save, so it can be sent.
            activeCampaignIndex: existingMessage?.activeCampaignIndex ?? 0,
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
                const requiredHeaders = ['userEmail', 'ctaMessage', 'followUpMessage', 'tag'];
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
                    
                    const tag = row.tag as typeof campaignTags[number];
                    if (!campaignTags.includes(tag)) {
                        console.warn(`Tag inválida "${tag}" para o usuário ${user.email}. Usando 'Relacionamento' como padrão.`);
                    }

                    const campaign: CampaignType = {
                        id: `campaign_${Date.now()}_${Math.random()}`,
                        ctaMessage: row.ctaMessage,
                        followUpMessage: row.followUpMessage,
                        tag: campaignTags.includes(tag) ? tag : 'Relacionamento',
                        status: 'loaded'
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
                            status: 'ready', // Default to ready
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

    const FilterableHeader = ({ fkey, label, uniqueValues }: { fkey: keyof typeof filters, label: string, uniqueValues: string[] | readonly { value: string, label: string }[] }) => (
        <TableHead>
            <div className="flex items-center gap-2">
                <span className="flex-grow">{label}</span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Filtrar por {label}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <ScrollArea className="max-h-60">
                        {uniqueValues.map(item => {
                            const value = typeof item === 'string' ? item : item.value;
                            const displayLabel = typeof item === 'string' ? item : item.label;
                            return (
                            <DropdownMenuCheckboxItem
                                key={value}
                                checked={filters[fkey].includes(value)}
                                onCheckedChange={() => handleFilterChange(fkey, value)}
                            >
                                {displayLabel}
                            </DropdownMenuCheckboxItem>
                        )})}
                        </ScrollArea>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </TableHead>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gerenciamento de Mensagens por Colaborador</CardTitle>
                 <CardDescription>
                   Crie, envie e monitore as campanhas de comunicação. O status 'Pronto' indica que a campanha está aguardando o envio manual.
                </CardDescription>
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
                    <div className="flex w-full sm:w-auto flex-wrap gap-2">
                        <Button variant="outline" onClick={handleBulkStartCampaign} disabled={selectedUserIds.length === 0 || isSendingBulk}>
                            {isSendingBulk ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                            Enviar para Selecionados ({selectedUserIds.length})
                        </Button>
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
                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                 <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={isAllReadyUsersSelected}
                                        onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                                        aria-label="Selecionar todos os usuários prontos"
                                    />
                                </TableHead>
                                <SortableHeader tKey="name" label="Colaborador" />
                                <FilterableHeader fkey="area" label="Área" uniqueValues={uniqueAreas}/>
                                <FilterableHeader fkey="position" label="Cargo" uniqueValues={uniquePositions}/>
                                <FilterableHeader fkey="segment" label="Segmento" uniqueValues={uniqueSegments}/>
                                <FilterableHeader fkey="leader" label="Líder" uniqueValues={uniqueLeaders}/>
                                <FilterableHeader fkey="status" label="Status" uniqueValues={Object.entries(statusOptions).map(([value, {label}]) => ({value, label}))}/>
                                <TableHead>Progresso</TableHead>
                                <SortableHeader tKey="isActive" label="Ativa" />
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedUsers.map(user => {
                                const message = userMessageMap.get(user.id3a);
                                
                                let progressText = '0/0';
                                if (message) {
                                    const completedCount = message.archivedCampaigns?.length || 0;
                                    const totalCount = message.pipeline.length + (message.archivedCampaigns?.length || 0);
                                    progressText = `${completedCount}/${totalCount}`;
                                }


                                const isReady = message?.status === 'ready';
                                return (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedUserIds.includes(user.id3a)}
                                            onCheckedChange={(checked) => {
                                                setSelectedUserIds(prev =>
                                                    checked ? [...prev, user.id3a] : prev.filter(id => id !== user.id3a)
                                                );
                                            }}
                                            aria-label={`Selecionar ${user.name}`}
                                            disabled={!isReady}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.area}</TableCell>
                                    <TableCell>{user.position}</TableCell>
                                    <TableCell>{user.segment}</TableCell>
                                    <TableCell>{user.leader}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={message?.status || 'not_created'} />
                                    </TableCell>
                                     <TableCell>
                                        {progressText}
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                          checked={message?.isActive ?? false}
                                          onCheckedChange={(checked) => handleToggleActivation(user, checked)}
                                          disabled={!message}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
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
                                    <div className="flex justify-between items-start">
                                        <Badge className={campaignStatusBadgeClasses[field.status]}>{field.status}</Badge>
                                        {field.status === 'completed' && (
                                            <Button type="button" variant="outline" size="sm" onClick={() => handleArchiveCampaignClick(field.id)} disabled={isArchiving}>
                                                {isArchiving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Archive className="mr-2 h-4 w-4"/>}
                                                Arquivar
                                            </Button>
                                        )}
                                    </div>
                                    
                                     <div>
                                        <Label htmlFor={`pipeline.${index}.tag`}>Tag da Campanha</Label>
                                        <Controller
                                            name={`pipeline.${index}.tag`}
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger><SelectValue placeholder="Selecione uma tag..."/></SelectTrigger>
                                                    <SelectContent>
                                                        {campaignTags.map(tag => (
                                                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {form.formState.errors.pipeline?.[index]?.tag && <p className="text-sm text-destructive mt-1">{form.formState.errors.pipeline[index]?.tag?.message}</p>}
                                    </div>
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
                                        <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveCampaign(index)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                            ))}

                             <Button type="button" variant="outline" className="w-full" onClick={() => append({ id: `campaign_${Date.now()}`, ctaMessage: '', followUpMessage: '', tag: 'Relacionamento', status: 'loaded' })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Campanha ao Pipeline
                            </Button>
                        </div>
                         <DialogFooter className="!justify-between mt-6">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
                            </DialogClose>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={isSubmitting} className="bg-admin-primary hover:bg-admin-primary/90">
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
                                <code className="block bg-muted p-2 rounded-md my-2 text-xs">userEmail,ctaMessage,followUpMessage,tag</code>
                            </li>
                             <li>Para criar um pipeline para um usuário, adicione múltiplas linhas com o mesmo `userEmail`. A ordem das linhas no arquivo definirá a ordem do pipeline.</li>
                             <li>O valor da coluna `tag` deve corresponder a uma das opções: {campaignTags.join(', ')}.</li>
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


