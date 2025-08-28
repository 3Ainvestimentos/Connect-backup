
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/firestore-service';
import { Loader2, UploadCloud, FileCheck } from 'lucide-react';

const STORAGE_PATH_TEST = "Teste";

export function ManageTest() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setFile(event.target.files[0]);
            setUploadedUrl(null);
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
        toast({
            title: "Iniciando Upload",
            description: `Enviando o arquivo "${file.name}"...`,
        });

        try {
            const downloadUrl = await uploadFile(file, STORAGE_PATH_TEST);
            setUploadedUrl(downloadUrl);
            toast({
                title: "Upload Concluído com Sucesso!",
                description: `URL: ${downloadUrl}`,
                variant: "success",
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
            toast({
                title: "Falha no Upload",
                description: `Ocorreu um erro: ${errorMessage}`,
                variant: "destructive",
            });
            console.error("Upload failed:", error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
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
                    <Input id="test-file-input" type="file" onChange={handleFileChange} />
                </div>
                <Button onClick={handleUpload} disabled={isUploading}>
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
                                <p className="font-semibold text-green-800">Arquivo enviado com sucesso!</p>
                                <a 
                                    href={uploadedUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-green-700 break-all underline hover:text-green-900"
                                >
                                    {uploadedUrl}
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
