
"use client";

import React, { useState, useMemo, useRef } from 'react';
import { useOpportunityMap } from '@/contexts/OpportunityMapContext';
import { useCollaborators, Collaborator } from '@/contexts/CollaboratorsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Edit, Upload, FileDown, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { EditDataModal } from './EditDataModal';
import { ScrollArea } from '@/components/ui/scroll-area';

type CsvRow = { [key: string]: string };

export function PapManager() {
    const { opportunityData, upsertOpportunityData, loading: mapLoading } = useOpportunityMap();
    const { collaborators, loading: collabLoading } = useCollaborators();
    const [searchTerm, setSearchTerm] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [editingUser, setEditingUser] = useState<Collaborator | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loading = mapLoading || collabLoading;

    const usersWithData = useMemo(() => {
        const dataMap = new Map(opportunityData.map(d => [d.id, d]));
        let users = collaborators.map(user => ({
            ...user,
            sectionData: dataMap.get(user.id)?.pap || {},
        }));
        if (searchTerm) {
            users = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return users;
    }, [collaborators, opportunityData, searchTerm]);

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsImporting(true);

        Papa.parse<CsvRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const { data, meta } = results;
                    if (!meta.fields?.includes('userEmail')) {
                        throw new Error("O CSV deve conter a coluna 'userEmail'.");
                    }

                    const promises = data.map(row => {
                        const email = row.userEmail?.trim().toLowerCase();
                        const user = collaborators.find(c => c.email.toLowerCase() === email);
                        if (!user) {
                            console.warn(`Usuário não encontrado para o email: ${email}`);
                            return Promise.resolve();
                        }
                        const { userEmail, ...papData } = row;
                        const payload = { userName: user.name, pap: papData };
                        return upsertOpportunityData(user.id, payload);
                    });

                    await Promise.all(promises);
                    toast({ title: "Importação Concluída!", description: "Os dados de PAP foram atualizados." });
                } catch (error) {
                    toast({ title: "Erro na Importação", description: (error as Error).message, variant: "destructive" });
                } finally {
                    setIsImporting(false);
                }
            },
            error: (error) => {
                toast({ title: "Erro ao Ler o Arquivo", description: error.message, variant: "destructive" });
                setIsImporting(false);
            },
        });
        if (event.target) event.target.value = '';
    };

    const handleEditClick = (user: Collaborator) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Importar Dados de PAP</CardTitle>
                        <CardDescription>
                            Faça o upload de um arquivo CSV para carregar os dados de PAP para múltiplos usuários.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".csv"
                            onChange={handleFileImport}
                        />
                        <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting || loading} className="w-full bg-admin-primary hover:bg-admin-primary/90">
                            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                            {isImporting ? 'Importando...' : `Importar CSV para PAP`}
                        </Button>
                    </CardContent>
                    <CardFooter>
                        <a href="/templates/modelo_mapa_oportunidades_pap.csv" download="modelo_pap.csv" className="w-full">
                            <Button variant="secondary" className="w-full">
                                <FileDown className="mr-2 h-4 w-4"/>
                                Baixar Modelo CSV
                            </Button>
                        </a>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Visão Coletiva: PAP</CardTitle>
                        <CardDescription>Visualize e edite os dados individuais de PAP para cada colaborador.</CardDescription>
                        <div className="relative pt-2">
                             <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                             <Input 
                                placeholder="Buscar colaborador..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10"
                             />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[40rem]">
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Colaborador</TableHead>
                                            <TableHead>Dados Atuais</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usersWithData.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1 max-w-md">
                                                        {user.sectionData && Object.keys(user.sectionData).length > 0 ? (
                                                            Object.entries(user.sectionData).map(([key, value]) => (
                                                                <div key={key} className="bg-muted px-2 py-1 rounded-md text-xs">
                                                                    <span className="font-semibold">{key}:</span> {String(value)}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">Sem dados</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(user)} className="hover:bg-muted">
                                                        <Edit className="mr-2 h-4 w-4"/>
                                                        Editar
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {editingUser && (
                <EditDataModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    user={editingUser}
                    section="pap"
                    sectionTitle="PAP"
                    opportunityData={opportunityData.find(d => d.id === editingUser.id)}
                />
            )}
        </>
    );
}
