
"use client";

import React, { useState, useMemo, useRef } from 'react';
import { useOpportunityMap } from '@/contexts/OpportunityMapContext';
import { useCollaborators, Collaborator } from '@/contexts/CollaboratorsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Edit, Upload, FileDown, Loader2, CheckCircle2, CircleDashed } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOpportunityMapMissions } from '@/contexts/OpportunityMapMissionsContext';

type CsvRow = { [key: string]: string };

export function MissionsXpManager() {
    const { opportunityData, upsertOpportunityData, loading: mapLoading } = useOpportunityMap();
    const { collaborators, loading: collabLoading } = useCollaborators();
    const { missions: missionDefinitions } = useOpportunityMapMissions();

    const [searchTerm, setSearchTerm] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loading = mapLoading || collabLoading;

    const usersWithData = useMemo(() => {
        const dataMap = new Map(opportunityData.map(d => [d.id, d]));
        let users = collaborators.map(user => ({
            ...user,
            sectionData: dataMap.get(user.id)?.missionsXp || {},
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
                        
                        const missionsXp: Record<string, { eligible: boolean, achieved: boolean }> = {};
                        
                        missionDefinitions.forEach(missionDef => {
                            const eligibleKey = `${missionDef.title} - Elegivel`;
                            const achievedKey = `${missionDef.title} - Conquistada`;
                            
                            missionsXp[missionDef.title] = {
                                eligible: row[eligibleKey]?.toLowerCase() === 'sim',
                                achieved: row[achievedKey]?.toLowerCase() === 'sim'
                            };
                        });
                        
                        const payload = { userName: user.name, missionsXp };
                        return upsertOpportunityData(user.id, payload);
                    });

                    await Promise.all(promises);
                    toast({ title: "Importação Concluída!", description: "Os dados de Missões XP foram atualizados." });
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

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Importar Status das Missões XP</CardTitle>
                    <CardDescription>
                        Faça o upload de um arquivo CSV para definir a elegibilidade e o status de conquista das missões para cada usuário.
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
                        {isImporting ? 'Importando...' : `Importar CSV de Status`}
                    </Button>
                </CardContent>
                <CardFooter>
                    <a href="/templates/modelo_mapa_oportunidades_missionsXp.csv" download="modelo_status_missoes_xp.csv" className="w-full">
                        <Button variant="secondary" className="w-full">
                            <FileDown className="mr-2 h-4 w-4"/>
                            Baixar Modelo CSV de Status
                        </Button>
                    </a>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Visão Coletiva: Missões XP</CardTitle>
                    <CardDescription>Visualize o status das missões para cada colaborador.</CardDescription>
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
                                        <TableHead>Missões Conquistadas</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usersWithData.map(user => {
                                        const achievedMissions = missionDefinitions
                                            .filter(def => user.sectionData?.[def.title]?.achieved)
                                            .map(def => def.title);

                                        return (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-2 max-w-md">
                                                        {achievedMissions.length > 0 ? achievedMissions.map(title => (
                                                            <div key={title} className="flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                {title}
                                                            </div>
                                                        )) : (
                                                            <span className="text-xs text-muted-foreground italic">Nenhuma missão conquistada</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
