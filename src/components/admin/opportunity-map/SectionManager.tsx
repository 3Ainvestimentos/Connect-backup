
"use client";

import React, { useState, useMemo, useRef } from 'react';
import { useOpportunityMap, OpportunityMapData, MissionData } from '@/contexts/OpportunityMapContext';
import { useCollaborators, Collaborator } from '@/contexts/CollaboratorsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Edit, Upload, FileDown, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { EditDataModal } from './EditDataModal';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SectionManagerProps {
  section: 'missionsXp' | 'pap';
  title: string;
}

type CsvRow = { [key: string]: string };

export function SectionManager({ section, title }: SectionManagerProps) {
    const { opportunityData, upsertOpportunityData, loading: mapLoading } = useOpportunityMap();
    const { collaborators, loading: collabLoading } = useCollaborators();
    const [searchTerm, setSearchTerm] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [editingUser, setEditingUser] = useState<Collaborator | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loading = mapLoading || collabLoading;

    const commercialUsers = useMemo(() => {
        const testUsers = ['desenvolvedor@3ariva.com.br', 'matheus@3ainvestimentos.com.br'];
        return collaborators
          .filter(c => c.axis === 'Comercial' || testUsers.includes(c.email))
          .sort((a,b) => a.name.localeCompare(b.name));
    }, [collaborators]);

    const usersWithData = useMemo(() => {
        const dataMap = new Map(opportunityData.map(d => [d.id, d]));
        
        let users = commercialUsers.map(user => {
            const data = dataMap.get(user.id);
            return {
                ...user,
                sectionData: data ? data[section] : {},
                userName: data?.userName || user.name
            };
        });

        if (searchTerm) {
            users = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        return users;
    }, [commercialUsers, opportunityData, section, searchTerm]);

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

                        if (section === 'missionsXp') {
                            sectionData = {};
                            for (const key in rest) {
                                if (key.endsWith(' Valor')) {
                                    const missionName = key.replace(' Valor', '');
                                    const value = rest[key];
                                    const status = rest[`${missionName} Status`]?.toLowerCase() || 'elegivel';
                                    
                                    if (missionName && value) {
                                        sectionData[missionName] = {
                                            value: value,
                                            status: ['elegivel', 'premiado'].includes(status) ? status : 'elegivel'
                                        };
                                    }
                                }
                            }
                        } else { // PAP
                             sectionData = rest;
                        }

                        const payload = {
                            userName: user.name,
                            [section]: sectionData,
                        };
                        
                        return upsertOpportunityData(user.id, payload);
                    });

                    await Promise.all(promises);
                    toast({
                        title: "Importação Concluída!",
                        description: `Os dados da seção "${title}" foram atualizados.`,
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
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Importar Dados em Lote</CardTitle>
                        <CardDescription>
                            Faça o upload de um arquivo CSV para carregar os dados desta seção para múltiplos usuários.
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
                            {isImporting ? 'Importando...' : `Importar CSV para ${title}`}
                        </Button>
                    </CardContent>
                     <CardFooter>
                        <a href={`/templates/modelo_mapa_oportunidades_${section}.csv`} download={`modelo_${section}.csv`} className="w-full">
                            <Button variant="secondary" className="w-full">
                                <FileDown className="mr-2 h-4 w-4"/>
                                Baixar Modelo CSV
                            </Button>
                        </a>
                    </CardFooter>
                </Card>
                <div className="p-4 rounded-lg bg-muted/50 border text-sm text-muted-foreground space-y-2">
                    <p className="font-semibold text-foreground flex items-center gap-2"><FileText className="h-4 w-4"/>Instruções do CSV</p>
                    {section === 'missionsXp' ? (
                        <ol className="list-decimal list-inside space-y-1 pl-2">
                            <li>A primeira coluna **deve** ser `userEmail`.</li>
                            <li>Para cada missão, crie duas colunas: `[Nome da Missão] Valor` e `[Nome da Missão] Status`.</li>
                            <li>Exemplo: `Missao 1 Valor`, `Missao 1 Status`, `Missao 2 Valor`, `Missao 2 Status`, etc.</li>
                            <li>Os valores para a coluna de Status devem ser `elegivel` ou `premiado`. Se deixado em branco, será `elegivel`.</li>
                        </ol>
                    ) : (
                         <ol className="list-decimal list-inside space-y-1 pl-2">
                            <li>A primeira coluna **deve** ser `userEmail`.</li>
                            <li>As colunas seguintes são flexíveis. Cada nome de coluna se tornará uma "chave" e o valor da célula será o "valor".</li>
                        </ol>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Visão Coletiva: {title}</CardTitle>
                    <CardDescription>Visualize e edite os dados individuais de cada colaborador para esta seção.</CardDescription>
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
                                                        Object.entries(user.sectionData).map(([key, data]) => {
                                                            const isMission = typeof data === 'object' && data !== null;
                                                            const value = isMission ? (data as MissionData).value : data;
                                                            const status = isMission ? (data as MissionData).status : null;

                                                            return (
                                                                <div key={key} className="bg-muted px-2 py-1 rounded-md text-xs">
                                                                    <span className="font-semibold">{key}:</span> {value}
                                                                    {status && <span className={`ml-1 font-bold ${status === 'premiado' ? 'text-green-600' : 'text-blue-600'}`}>({status})</span>}
                                                                </div>
                                                            );
                                                        })
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

            {editingUser && (
                <EditDataModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    user={editingUser}
                    section={section}
                    sectionTitle={title}
                    opportunityData={opportunityData.find(d => d.id === editingUser.id)}
                />
            )}
        </>
    )
}
