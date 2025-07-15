
"use client";
import React, { useState, useRef, useMemo } from 'react';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2, Loader2, Upload, FileDown, AlertTriangle, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';

const collaboratorSchema = z.object({
    id: z.string().optional(),
    id3a: z.string().min(1, "ID 3A RIVA é obrigatório"),
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    photoURL: z.string().url("URL da imagem inválida").optional().or(z.literal('')),
    axis: z.string().min(1, "Eixo é obrigatório"),
    area: z.string().min(1, "Área é obrigatória"),
    position: z.string().min(1, "Cargo é obrigatório"),
    segment: z.string().min(1, "Segmento é obrigatório"),
    leader: z.string().min(1, "Líder é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
});

type CollaboratorFormValues = z.infer<typeof collaboratorSchema>;

type CsvRow = { [key: string]: string };

type SortKey = keyof Collaborator | '';
type SortDirection = 'asc' | 'desc';


export function ManageCollaborators() {
    const { collaborators, addCollaborator, updateCollaborator, deleteCollaboratorMutation, addMultipleCollaborators } = useCollaborators();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');


    const filteredAndSortedCollaborators = useMemo(() => {
        let items = [...collaborators];
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            items = items.filter(c => {
                const nameMatch = c.name?.toLowerCase().includes(lowercasedTerm) ?? false;
                const emailMatch = c.email?.toLowerCase().includes(lowercasedTerm) ?? false;
                const id3aMatch = c.id3a?.toLowerCase().includes(lowercasedTerm) ?? false;
                const areaMatch = c.area?.toLowerCase().includes(lowercasedTerm) ?? false;
                const positionMatch = c.position?.toLowerCase().includes(lowercasedTerm) ?? false;
                return nameMatch || emailMatch || id3aMatch || areaMatch || positionMatch;
            });
        }
        if (sortKey) {
            items.sort((a, b) => {
                const valA = a[sortKey];
                const valB = b[sortKey];
                let comparison = 0;
                if (valA && valB) {
                    comparison = String(valA).localeCompare(String(valB));
                }
                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }
        return items;
    }, [collaborators, searchTerm, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const handleFormDialogOpen = (collaborator: Collaborator | null) => {
        setEditingCollaborator(collaborator);
        if (collaborator) {
            reset(collaborator);
        } else {
            reset({
                id: undefined,
                id3a: '',
                name: '',
                email: '',
                photoURL: '',
                axis: '',
                area: '',
                position: '',
                segment: '',
                leader: '',
                city: '',
            });
        }
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir este colaborador?")) return;

        try {
            await deleteCollaboratorMutation.mutateAsync(id);
            toast({ title: "Sucesso!", description: "Colaborador excluído." });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
            toast({ title: "Falha na Exclusão", description: errorMessage, variant: "destructive" });
        }
    };
    
    const onSubmit = async (data: CollaboratorFormValues) => {
        try {
            if (editingCollaborator) {
                await updateCollaborator({ ...editingCollaborator, ...data });
                toast({ title: "Colaborador atualizado com sucesso." });
            } else {
                const { id, ...dataWithoutId } = data;
                await addCollaborator(dataWithoutId as Omit<Collaborator, 'id'>);
                toast({ title: "Colaborador adicionado com sucesso." });
            }
            setIsFormOpen(false);
            setEditingCollaborator(null);
        } catch (error) {
            toast({
                title: "Erro ao salvar",
                description: error instanceof Error ? error.message : "Não foi possível salvar o colaborador.",
                variant: "destructive"
            });
        }
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);

        Papa.parse<CsvRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const requiredHeaders = ['id3a', 'name', 'email', 'axis', 'area', 'position', 'segment', 'leader', 'city'];
                const fileHeaders = results.meta.fields;
                
                if (!fileHeaders || !requiredHeaders.every(h => fileHeaders.includes(h))) {
                    toast({
                        title: "Erro no Arquivo CSV",
                        description: `O arquivo deve conter as seguintes colunas: ${requiredHeaders.join(', ')}.`,
                        variant: "destructive",
                    });
                    setIsImporting(false);
                    return;
                }

                const newCollaborators = results.data
                    .map(row => ({
                        id3a: row.id3a?.trim(),
                        name: row.name?.trim(),
                        email: row.email?.trim().toLowerCase(),
                        photoURL: row.photoURL?.trim() || '',
                        axis: row.axis?.trim(),
                        area: row.area?.trim(),
                        position: row.position?.trim(),
                        segment: row.segment?.trim(),
                        leader: row.leader?.trim(),
                        city: row.city?.trim(),
                    }))
                    .filter(c => c.id3a && c.name && c.email); // Basic validation

                if (newCollaborators.length === 0) {
                     toast({
                        title: "Nenhum dado válido encontrado",
                        description: "Verifique o conteúdo do seu arquivo CSV.",
                        variant: "destructive",
                    });
                    setIsImporting(false);
                    return;
                }
                
                try {
                    await addMultipleCollaborators(newCollaborators as Omit<Collaborator, 'id'>[]);
                    toast({
                        title: "Importação Concluída!",
                        description: `${newCollaborators.length} colaboradores foram adicionados com sucesso.`,
                    });
                    setIsImportOpen(false);
                } catch(e) {
                     toast({
                        title: "Erro na importação",
                        description: e instanceof Error ? e.message : "Ocorreu um erro desconhecido.",
                        variant: "destructive",
                    });
                } finally {
                    setIsImporting(false);
                }
            },
            error: (error) => {
                toast({
                    title: "Erro ao processar o arquivo",
                    description: error.message,
                    variant: "destructive",
                });
                setIsImporting(false);
            }
        });

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const SortableHeader = ({ tkey, label }: { tkey: SortKey, label: string }) => (
        <TableHead onClick={() => handleSort(tkey)} className="cursor-pointer hover:bg-muted/50">
            {label}
            {sortKey === tkey && (sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />)}
        </TableHead>
    );

    return (
        <>
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                     <div className="flex-grow">
                        <CardTitle>Gerenciar Colaboradores</CardTitle>
                        <CardDescription>Adicione, edite ou remova colaboradores da lista.</CardDescription>
                    </div>
                     <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
                        <div className="relative flex-grow sm:flex-grow-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar colaborador..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => setIsImportOpen(true)} variant="outline" className="flex-grow">
                                <Upload className="mr-2 h-4 w-4" />
                                Importar
                            </Button>
                            <Button onClick={() => handleFormDialogOpen(null)} className="bg-admin-primary hover:bg-admin-primary/90 flex-grow">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Adicionar
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableHeader tkey="id3a" label="ID 3A RIVA" />
                                    <SortableHeader tkey="name" label="Nome" />
                                    <SortableHeader tkey="email" label="Email" />
                                    <SortableHeader tkey="area" label="Área" />
                                    <SortableHeader tkey="position" label="Cargo" />
                                    <SortableHeader tkey="axis" label="Eixo" />
                                    <SortableHeader tkey="segment" label="Segmento" />
                                    <SortableHeader tkey="city" label="Cidade" />
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedCollaborators.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.id3a}</TableCell>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.email}</TableCell>
                                        <TableCell>{item.area}</TableCell>
                                        <TableCell>{item.position}</TableCell>
                                        <TableCell>{item.axis}</TableCell>
                                        <TableCell>{item.segment}</TableCell>
                                        <TableCell>{item.city}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleFormDialogOpen(item)} className="hover:bg-muted">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:bg-muted" disabled={deleteCollaboratorMutation.isPending && deleteCollaboratorMutation.variables === item.id}>
                                                {deleteCollaboratorMutation.isPending && deleteCollaboratorMutation.variables === item.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                     {filteredAndSortedCollaborators.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">Nenhum colaborador encontrado.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingCollaborator(null); setIsFormOpen(isOpen); }}>
                <DialogContent className="max-w-2xl">
                <ScrollArea className="max-h-[80vh]">
                  <div className="p-6 pt-0">
                    <DialogHeader>
                        <DialogTitle>{editingCollaborator ? 'Editar Colaborador' : 'Adicionar Colaborador'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="id3a">ID 3A RIVA</Label>
                                <Input id="id3a" {...register('id3a')} disabled={isFormSubmitting}/>
                                {errors.id3a && <p className="text-sm text-destructive mt-1">{errors.id3a.message}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" {...register('name')} disabled={isFormSubmitting}/>
                                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" {...register('email')} disabled={isFormSubmitting}/>
                            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="photoURL">URL da Foto (opcional)</Label>
                            <Input id="photoURL" {...register('photoURL')} placeholder="https://..." disabled={isFormSubmitting}/>
                            {errors.photoURL && <p className="text-sm text-destructive mt-1">{errors.photoURL.message}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="axis">Eixo</Label>
                                <Input id="axis" {...register('axis')} disabled={isFormSubmitting}/>
                                {errors.axis && <p className="text-sm text-destructive mt-1">{errors.axis.message}</p>}
                            </div>
                             <div>
                                <Label htmlFor="area">Área</Label>
                                <Input id="area" {...register('area')} disabled={isFormSubmitting}/>
                                {errors.area && <p className="text-sm text-destructive mt-1">{errors.area.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                                <Label htmlFor="position">Cargo</Label>
                                <Input id="position" {...register('position')} disabled={isFormSubmitting}/>
                                {errors.position && <p className="text-sm text-destructive mt-1">{errors.position.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="segment">Segmento</Label>
                                <Input id="segment" {...register('segment')} disabled={isFormSubmitting}/>
                                {errors.segment && <p className="text-sm text-destructive mt-1">{errors.segment.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="leader">Líder</Label>
                                <Input id="leader" {...register('leader')} disabled={isFormSubmitting}/>
                                {errors.leader && <p className="text-sm text-destructive mt-1">{errors.leader.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="city">Cidade</Label>
                                <Input id="city" {...register('city')} disabled={isFormSubmitting}/>
                                {errors.city && <p className="text-sm text-destructive mt-1">{errors.city.message}</p>}
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <DialogClose asChild><Button type="button" variant="outline" disabled={isFormSubmitting}>Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isFormSubmitting} className="bg-admin-primary hover:bg-admin-primary/90">
                                {isFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                  </div>
                  </ScrollArea>
                </DialogContent>
            </Dialog>

            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Importar Colaboradores via CSV</DialogTitle>
                        <DialogDescription>
                            Faça o upload de um arquivo CSV para adicionar múltiplos colaboradores de uma só vez.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 rounded-md border border-amber-500/50 bg-amber-500/10 text-amber-700">
                           <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-600 flex-shrink-0"/>
                                <div>
                                    <p className="font-semibold">Atenção: A importação irá adicionar novos colaboradores, mas não irá atualizar ou remover os existentes.</p>
                                </div>
                           </div>
                        </div>

                        <h3 className="font-semibold">Instruções:</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                            <li>Crie uma planilha (no Excel, Google Sheets, etc.).</li>
                            <li>A primeira linha **deve** ser um cabeçalho com os seguintes nomes de coluna, exatamente como mostrado:
                                <code className="block bg-muted p-2 rounded-md my-2 text-xs">id3a,name,email,axis,area,position,segment,leader,city,photoURL</code>
                            </li>
                             <li>A coluna `photoURL` é opcional, as outras são obrigatórias.</li>
                            <li>Preencha as linhas com os dados de cada colaborador.</li>
                            <li>Exporte ou salve o arquivo no formato **CSV (Valores Separados por Vírgula)**.</li>
                            <li>Clique no botão abaixo para selecionar e enviar o arquivo.</li>
                        </ol>
                         <a href="/templates/modelo_colaboradores.csv" download className="inline-block" >
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
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".csv"
                            onChange={handleFileImport}
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
