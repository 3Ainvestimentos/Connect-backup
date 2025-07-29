
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HardDrive, AlertCircle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

declare global {
    interface Window {
        gapi: any;
    }
}

interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
  iconLink: string;
  mimeType: string;
}

const ROOT_FOLDER_ID = '1e2iiKdm2hPrGZqHYD1x9Gdk2I8iBDHxo';

export default function GoogleDriveFiles() {
  const { user, accessToken } = useAuth();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listFiles = useCallback(async () => {
    if (!user || !accessToken) {
      if (!user) setError("Usuário não autenticado.");
      else if (!accessToken) setError("Token de acesso não encontrado. Por favor, atualize a página.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      window.gapi.client.setToken({ access_token: accessToken });
      
      const response = await window.gapi.client.drive.files.list({
          // This query recursively finds all files that have the root folder as an ancestor.
          q: `'${ROOT_FOLDER_ID}' in parents and trashed = false`,
          pageSize: 100,
          fields: "nextPageToken, files(id, name, modifiedTime, webViewLink, iconLink, mimeType)",
          orderBy: 'modifiedTime desc'
      });

      // Filter out folders to show only files.
      const documentsOnly = response.result.files?.filter(
        (file: DriveFile) => file.mimeType !== 'application/vnd.google-apps.folder'
      ) || [];

      setFiles(documentsOnly);

    } catch (err: any) {
      console.error("Erro ao buscar arquivos do Drive:", err);
      let errorMessage = "Não foi possível carregar os arquivos do Drive.";
      if (err.result?.error?.message) {
        errorMessage = `Erro da API: ${err.result.error.message}. Tente atualizar a página para renovar a permissão.`;
      } else if(err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, accessToken]);

  useEffect(() => {
    if (typeof window.gapi === 'undefined' || typeof window.gapi.load === 'undefined') {
        setError("A biblioteca de cliente do Google não pôde ser carregada.");
        setIsLoading(false);
        return;
    }
    
    const initializeGapiClient = () => {
        window.gapi.client.init({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
        }).then(() => {
            if (user && accessToken) {
                listFiles();
            } else if (!user) {
              setIsLoading(false);
            }
        }).catch((e: any) => {
            setError("Falha ao inicializar o cliente GAPI.");
            setIsLoading(false);
        });
    }

    if (window.gapi.client) {
        initializeGapiClient();
    } else {
        window.gapi.load('client', initializeGapiClient);
    }
  }, [user, accessToken, listFiles]);
  
  if (isLoading && files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-foreground text-xl">Google Drive</CardTitle>
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
      return (
         <Card>
            <CardHeader>
                <CardTitle className="font-headline text-foreground text-xl">Google Drive</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center text-destructive p-4">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Erro ao carregar arquivos</p>
                <p className="text-xs">{error}</p>
                <Button variant="link" size="sm" onClick={() => listFiles()} className="text-xs mt-2 text-destructive">Tentar novamente</Button>
            </CardContent>
        </Card>
      );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline text-foreground text-xl">Arquivos Recentes no Drive</CardTitle>
         <CardDescription>
            Documentos da pasta compartilhada, ordenados pelos mais recentes.
          </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow min-h-0">
        <div className={cn("h-full relative transition-opacity", isLoading ? "opacity-40" : "opacity-100")}>
            {files.length > 0 ? (
            <ul className="space-y-3">
                {files.map((file) => (
                    <li key={file.id} className="flex items-center gap-3 text-sm">
                        <img src={file.iconLink} alt="file icon" className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-grow truncate">
                        <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex items-center gap-1">
                            {file.name}
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                        <p className="text-xs text-muted-foreground">
                            Modificado {formatDistanceToNow(new Date(file.modifiedTime), { addSuffix: true, locale: ptBR })}
                        </p>
                        </div>
                    </li>
                ))}
            </ul>
            ) : (
            <p className="text-center text-muted-foreground text-sm py-4">Nenhum arquivo encontrado.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
