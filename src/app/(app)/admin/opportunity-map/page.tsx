"use client";

import React, { useState, useRef } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOpportunityMap } from '@/contexts/OpportunityMapContext';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileDown, AlertTriangle, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { useCollaborators } from '@/contexts/CollaboratorsContext';

type CsvRow = { [key: string]: string };

export default function OpportunityMapAdminPage() {
    const { upsertOpportunityData, loading: mapLoading } = useOpportunityMap();
    const { collaborators, loading: collabLoading } = useCollaborators();
    const [isImportingXP, setIsImportingXP] = useState(false);
    const [isImportingPAP, setIsImportingPAP] = useState(false);
    const xpFileInputRef = useRef<HTMLInputElement>(null);
    const papFileInputRef = useRef<HTMLInputElement>(null);
    
    const loading = mapLoading || collabLoading;

    const handleFileImport = async (
        event: React.ChangeEvent<HTMLInputElement>,
        section: 'missionsXp' | 'pap'
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const setIsImporting = section === 'missionsXp' ? setIsImportingXP : setIsImportingPAP;
        setIsImporting(true);

        Papa.parse<CsvRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const { data, meta } = results;

                if (!meta.fields?.includes('userEmail')) {
                    toast({
                        title: "Erro no Cabeçalho",
                        description: `O arquivo CSV deve conter uma coluna chamada "userEmail".`,
                        variant: "destructive",
                    });
                    setIsImporting(false);
                    return;
                }

                const promises = data.map(row => {
                    const email = row.userEmail?.trim().toLowerCase();
                    if (!email) return Promise.resolve();

                    const user = collaborators.find(c => c.email.toLowerCase() === email);
                    if (!user) {
                        console.warn(`Usuário não encontrado para o email: ${email}`);
                        return Promise.resolve();
                    }
                    
                    const { userEmail, ...sectionData } = row;

                    const payload = {
                        userName: user.name,
                        [section]: sectionData,
                    };
                    
                    return upsertOpportunityData(user.id, payload);
                });

                try {
                    await Promise.all(promises);
                    toast({
                        title: "Importação Concluída!",
                        description: `Os dados da seção ${section === 'missionsXp' ? 'Missões XP' : 'PAP'} foram atualizados para ${data.length} usuários.`,
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

    return (
        <SuperAdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader
                    title="Admin: Mapa de Oportunidades"
                    description="Faça o upload de arquivos CSV para carregar os dados de resultado mensal dos colaboradores."
                />
                
                <div className="p-4 rounded-lg bg-muted/50 border text-sm text-muted-foreground space-y-2">
                    <p className="font-semibold text-foreground flex items-center gap-2"><FileText className="h-4 w-4"/>Instruções Gerais</p>
                    <ol className="list-decimal list-inside space-y-1 pl-2">
                        <li>Prepare uma planilha para cada seção (Missões XP, PAP).</li>
                        <li>A primeira coluna **deve** se chamar `userEmail`. As colunas seguintes serão as chaves e os valores da seção.</li>
                        <li>Exporte sua planilha como um arquivo CSV.</li>
                        <li>Use os botões abaixo para importar o arquivo na seção correspondente.</li>
                    </ol>
                </div>


                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Missões XP</CardTitle>
                            <CardDescription>
                                Importe o arquivo CSV com os dados da seção "Missões XP".
                                A primeira coluna deve ser 'userEmail'.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <input
                                type="file"
                                ref={xpFileInputRef}
                                className="hidden"
                                accept=".csv"
                                onChange={(e) => handleFileImport(e, 'missionsXp')}
                            />
                            <Button onClick={() => xpFileInputRef.current?.click()} disabled={isImportingXP || loading} className="w-full">
                                {isImportingXP ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                                {isImportingXP ? 'Importando...' : 'Importar CSV de Missões XP'}
                            </Button>
                        </CardContent>
                         <CardFooter>
                            <a href="/templates/modelo_mapa_oportunidades.csv" download="modelo_missoes_xp.csv" className="w-full">
                                <Button variant="secondary" className="w-full">
                                    <FileDown className="mr-2 h-4 w-4"/>
                                    Baixar Modelo CSV
                                </Button>
                            </a>
                        </CardFooter>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>PAP (Plano de Ação Pessoal)</CardTitle>
                            <CardDescription>
                                Importe o arquivo CSV com os dados da seção "PAP". A primeira coluna deve ser 'userEmail'.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <input
                                type="file"
                                ref={papFileInputRef}
                                className="hidden"
                                accept=".csv"
                                onChange={(e) => handleFileImport(e, 'pap')}
                            />
                            <Button onClick={() => papFileInputRef.current?.click()} disabled={isImportingPAP || loading} className="w-full">
                                {isImportingPAP ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                                {isImportingPAP ? 'Importando...' : 'Importar CSV de PAP'}
                            </Button>
                        </CardContent>
                         <CardFooter>
                             <a href="/templates/modelo_mapa_oportunidades.csv" download="modelo_pap.csv" className="w-full">
                                <Button variant="secondary" className="w-full">
                                    <FileDown className="mr-2 h-4 w-4"/>
                                    Baixar Modelo CSV
                                </Button>
                            </a>
                        </CardFooter>
                    </Card>
                </div>
                 <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                    <p className="text-sm text-yellow-700 flex items-center justify-center gap-2">
                        <AlertTriangle className="h-4 w-4"/>
                        A importação de um novo arquivo para uma seção irá **sobrescrever completamente** os dados anteriores daquela seção para os usuários listados no arquivo.
                    </p>
                </div>
            </div>
        </SuperAdminGuard>
    );
}
