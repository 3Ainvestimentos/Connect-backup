
"use client";

import React, { useState, useMemo, useRef } from 'react';
import { useOpportunityMap, OpportunityMapData } from '@/contexts/OpportunityMapContext';
import { useCollaborators, Collaborator } from '@/contexts/CollaboratorsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Edit, Upload, FileDown, Loader2, AlertTriangle, FileText, SlidersHorizontal, Users, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { EditDataModal } from './EditDataModal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OpportunityType } from '@/contexts/OpportunityMapMissionsContext';
import { MissionGroupsManager } from './MissionGroupsManager';
import { Separator } from '@/components/ui/separator';
import { ObjectivesManager } from './ObjectivesManager';
import { useMissionGroups } from '@/contexts/MissionGroupsContext';

interface SectionManagerProps {
  opportunityType: OpportunityType;
}

type CsvRow = { [key: string]: string };

export function SectionManager({ opportunityType }: SectionManagerProps) {
    const { opportunityData, upsertOpportunityData, loading: mapLoading } = useOpportunityMap();
    const { collaborators, loading: collabLoading } = useCollaborators();
    const [searchTerm, setSearchTerm] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [editingUser, setEditingUser] = useState<Collaborator | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { missionGroups } = useMissionGroups(opportunityType.id);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);


    const loading = mapLoading || collabLoading;

    const visibleUsers = useMemo(() => {
        if (opportunityType.recipientIds.includes('all')) {
            return collaborators;
        }
        return collaborators.filter(c => opportunityType.recipientIds.includes(c.id3a));
    }, [collaborators, opportunityType]);


    const usersWithData = useMemo(() => {
        const dataMap = new Map(opportunityData.map(d => [d.id, d]));
        
        let users = visibleUsers.map(user => {
            const data = dataMap.get(user.id);
            return {
                ...user,
                sectionData: data ? data[opportunityType.id] : {},
                userName: data?.userName || user.name
            };
        });

        if (searchTerm) {
            users = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        return users;
    }, [visibleUsers, opportunityData, opportunityType.id, searchTerm]);

     const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);

        Papa.parse<CsvRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const { data, meta } = results;

                if (!meta.fields?.includes('userEmail')) {
                    toast({
                        title: "Erro no Cabeçalho",
                        description: `O CSV deve conter a coluna 'userEmail'.`,
                        variant: "destructive",
                    });
                    setIsImporting(false);
                    return;
                }

                try {
                    const promises = data.map(row => {
                        const email = row.userEmail?.trim().toLowerCase();
                        if (!email) return Promise.resolve();

                        const user = collaborators.find(c => c.email.toLowerCase() === email);
                        if (!user) {
                            console.warn(`Usuário não encontrado para o email: ${email}`);
                            return Promise.resolve();
                        }
                        
                        const { userEmail, ...rest } = row;
                        
                        let sectionData: Record<string, any> = {};
                        
                        // Adaptado para o formato genérico, onde cada coluna (exceto userEmail) é um campo
                        sectionData = rest;

                        const payload = {
                            userName: user.name,
                            [opportunityType.id]: sectionData,
                        };
                        
                        return upsertOpportunityData(user.id, payload);
                    });

                    await Promise.all(promises);
                    toast({
                        title: "Importação Concluída!",
                        description: `Os dados da seção "${opportunityType.name}" foram atualizados.`,
                    });
                } catch (error) {
                     toast({
                        title: "Erro na Importação",
                        description: (error as Error).message,
                        variant: "destructive",
                    });
                } finally {
                    setIsImporting(false);
                }
            },
            error: (error) => {
                toast({
                    title: "Erro ao Ler o Arquivo",
                    description: error.message,
                    variant: "destructive",
                });
                setIsImporting(false);
            },
        });
        
        if (event.target) {
            event.target.value = '';
        }
    };
    
    const handleEditClick = (user: Collaborator) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="space-y-6">
                <MissionGroupsManager 
                    opportunityTypeId={opportunityType.id}
                    onSelectGroup={setSelectedGroupId}
                    selectedGroupId={selectedGroupId}
                />
                
                {selectedGroupId && (
                    <>
                    <Separator/>
                     <ObjectivesManager 
                        opportunityTypeId={opportunityType.id}
                        groupId={selectedGroupId}
                    />
                    </>
                )}
                
                <Separator/>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Importar Dados dos Colaboradores</CardTitle>
                            <CardDescription>
                                Faça o upload de um arquivo CSV para carregar os dados desta oportunidade para múltiplos usuários.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv"
                                onChange={(e) => handleFileImport(e)}
                            />
                            <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting || loading} className="w-full">
                                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                                {isImporting ? 'Importando...' : `Importar CSV para ${opportunityType.name}`}
                            </Button>
                        </CardContent>
                         <CardFooter>
                            <a href={`/templates/modelo_mapa_oportunidades_generico.csv`} download={`modelo_${opportunityType.name}.csv`} className="w-full">
                                <Button variant="secondary" className="w-full">
                                    <FileDown className="mr-2 h-4 w-4"/>
                                    Baixar Modelo CSV Genérico
                                </Button>
                            </a>
                        </CardFooter>
                    </Card>
                    <div className="p-4 rounded-lg bg-muted/50 border text-sm text-muted-foreground space-y-2">
                        <p className="font-semibold text-foreground flex items-center gap-2"><FileText className="h-4 w-4"/>Instruções do CSV</p>
                        <ol className="list-decimal list-inside space-y-1 pl-2">
                            <li>A primeira coluna **deve** ser `userEmail`.</li>
                            <li>As colunas seguintes devem corresponder exatamente aos **nomes dos objetivos** definidos nos grupos.</li>
                            <li>Por exemplo, se você definiu um objetivo "NPS", seu CSV deve ter uma coluna "NPS".</li>
                        </ol>
                    </div>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Visão Coletiva: {opportunityType.name}</CardTitle>
                        <CardDescription>Visualize e edite os dados individuais de cada colaborador para esta oportunidade.</CardDescription>
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
                    section={opportunityType.id as any}
                    sectionTitle={opportunityType.name}
                    opportunityData={opportunityData.find(d => d.id === editingUser.id)}
                />
            )}
        </>
    )
}
