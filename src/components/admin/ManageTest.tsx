

"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, FileCheck, ListOrdered } from 'lucide-react';
import { uploadFile } from '@/lib/firestore-service';

const STORAGE_PATH_TEST = "Teste";

export function ManageTest() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const { toast } = useToast();

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setFile(event.target.files[0]);
            setUploadedUrl(null);
            setLogs([]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast({
                title: "Nenhum arquivo selecionado",
                description: "Por favor, selecione um arquivo para enviar.",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);
        setUploadedUrl(null);
        setLogs([]);
        addLog("1. Iniciando upload no componente...");

        try {
            addLog("2. Chamando a função uploadFile...");
            // Pass the addLog function inside the options object
            const downloadUrl = await uploadFile(file, STORAGE_PATH_TEST, undefined, { addLog });
            
            addLog("10. SUCESSO! URL recebida no componente.");
            setUploadedUrl(downloadUrl);
            
            toast({
                title: "Upload Concluído com Sucesso!",
                variant: "success",
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
            addLog(`ERRO: ${errorMessage}`);
            console.error("Upload failed:", error);
            toast({
                title: "Falha no Upload",
                description: `Ocorreu um erro: ${errorMessage}`,
                variant: "destructive",
            });
        } finally {
            addLog("11. Processo finalizado no componente.");
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Teste de Upload de Arquivo</CardTitle>
                    <CardDescription>
                        Use esta seção para testar o upload de arquivos para a pasta "/Teste" no Firebase Storage.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="test-file-input">Selecionar Arquivo</Label>
                        <Input id="test-file-input" type="file" onChange={handleFileChange} disabled={isUploading} />
                    </div>
                    <Button onClick={handleUpload} disabled={isUploading || !file}>
                        {isUploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <UploadCloud className="mr-2 h-4 w-4" />
                        )}
                        {isUploading ? 'Enviando...' : 'Enviar para o Storage'}
                    </Button>

                    {uploadedUrl && (
                        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-md">
                            <div className="flex items-start gap-3">
                                <FileCheck className="h-5 w-5 text-green-600 mt-1" />
                                <div>
                                    <p className="font-semibold text-green-800 dark:text-green-300">Arquivo enviado com sucesso!</p>
                                    <a 
                                        href={uploadedUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-green-700 dark:text-green-400 break-all underline hover:text-green-900 dark:hover:text-green-200"
                                    >
                                        {uploadedUrl}
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {logs.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ListOrdered /> Log de Diagnóstico</CardTitle>
                        <CardDescription>Acompanhamento detalhado do processo de upload.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-muted rounded-md font-mono text-xs space-y-1 h-64 overflow-y-auto">
                            {logs.map((log, index) => (
                                <p key={index}>{log}</p>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
