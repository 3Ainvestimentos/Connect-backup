
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, FileCheck } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseApp } from '@/lib/firebase';

const STORAGE_PATH_TEST = "Teste";

export function ManageTest() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const { toast } = useToast();

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
        const { id: toastId, update } = toast({
            title: "Diagnóstico de Upload",
            description: "1. Iniciando...",
            duration: 999999, // Persist until updated
        });

        try {
            update({ id: toastId, description: "2. Obtendo instância do Storage..." });
            const storage = getStorage(getFirebaseApp());

            const standardizedFileName = `${Date.now()}-${encodeURIComponent(file.name.replace(/\s+/g, '_'))}`;
            const filePath = `${STORAGE_PATH_TEST}/${standardizedFileName}`;
            
            update({ id: toastId, description: `3. Criando referência para: ${filePath}` });
            const storageRef = ref(storage, filePath);

            update({ id: toastId, description: "4. Enviando bytes do arquivo (uploadBytes)..." });
            const snapshot = await uploadBytes(storageRef, file);
            
            update({ id: toastId, description: "5. Upload concluído. Obtendo URL de download..." });
            const downloadUrl = await getDownloadURL(snapshot.ref);

            setUploadedUrl(downloadUrl);
            update({
                id: toastId,
                title: "Upload Concluído com Sucesso!",
                description: `URL: ${downloadUrl}`,
                variant: "success",
                duration: 10000,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
            console.error("Upload failed:", error);
            update({
                id: toastId,
                title: "Falha no Upload",
                description: `Ocorreu um erro na etapa final do diagnóstico: ${errorMessage}`,
                variant: "destructive",
                duration: 15000,
            });
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
    );
}
