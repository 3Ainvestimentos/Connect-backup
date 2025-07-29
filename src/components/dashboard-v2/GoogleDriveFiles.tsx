
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HardDrive, AlertCircle, ExternalLink, Folder, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

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

interface FolderInfo {
    id: string;
    name: string;
}

const ROOT_FOLDER_ID = '1OcUJkbDdYiNS4olLoYloF_fmiVQUy1LJ';

export default function GoogleDriveFiles() {
  const { user, accessToken } = useAuth();
  const [items, setItems] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<FolderInfo>({ id: ROOT_FOLDER_ID, name: 'Google Drive' });
  const [folderHistory, setFolderHistory] = useState<FolderInfo[]>([{ id: ROOT_FOLDER_ID, name: 'Google Drive' }]);

  const listFiles = useCallback(async (folderId: string) => {
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
          q: `'${folderId}' in parents and trashed = false`,
          pageSize: 100,
          fields: "nextPageToken, files(id, name, modifiedTime, webViewLink, iconLink, mimeType)",
          orderBy: 'folder,modifiedTime desc' // Sort by folders first, then by date
      });

      setItems(response.result.files || []);

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
                listFiles(currentFolder.id);
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
  }, [user, accessToken, listFiles, currentFolder.id]);

  const handleFolderClick = (folder: DriveFile) => {
    const newFolder = { id: folder.id, name: folder.name };
    setCurrentFolder(newFolder);
    setFolderHistory(prev => [...prev, newFolder]);
    listFiles(folder.id);
  };
  
  const handleBreadcrumbClick = (folderId: string, index: number) => {
      setCurrentFolder({ id: folderId, name: folderHistory[index].name });
      setFolderHistory(prev => prev.slice(0, index + 1));
      listFiles(folderId);
  }

  const renderBreadcrumbs = () => (
      <div className="flex items-center text-sm text-muted-foreground flex-wrap">
          {folderHistory.map((folder, index) => (
              <React.Fragment key={folder.id}>
                  <Button 
                      variant="link" 
                      onClick={() => handleBreadcrumbClick(folder.id, index)} 
                      className={cn(
                          "p-1 h-auto",
                          index === folderHistory.length - 1 ? "font-semibold text-foreground" : ""
                      )}
                  >
                      {folder.name}
                  </Button>
                  {index < folderHistory.length - 1 && <ChevronRight className="h-4 w-4" />}
              </React.Fragment>
          ))}
      </div>
  );
  
  if (isLoading && items.length === 0) {
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
                <Button variant="link" size="sm" onClick={() => listFiles(currentFolder.id)} className="text-xs mt-2 text-destructive">Tentar novamente</Button>
            </CardContent>
        </Card>
      );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline text-foreground text-xl">Google Drive</CardTitle>
        <CardDescription>
            Navegue pelas pastas ou abra os arquivos diretamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow min-h-0 flex flex-col gap-2">
         {renderBreadcrumbs()}
         <div className="flex-grow min-h-0">
            <ScrollArea className={cn("h-full relative transition-opacity pr-3", isLoading ? "opacity-40" : "opacity-100")}>
                {items.length > 0 ? (
                <ul className="space-y-3">
                    {items.map((item) => {
                        const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
                        return (
                            <li key={item.id} className="flex items-center gap-3 text-sm">
                                <img src={item.iconLink} alt="file icon" className="w-5 h-5 flex-shrink-0" />
                                <div className="flex-grow truncate">
                                    {isFolder ? (
                                        <button onClick={() => handleFolderClick(item)} className="font-semibold hover:underline text-left flex items-center gap-1">
                                            {item.name}
                                        </button>
                                    ) : (
                                        <a href={item.webViewLink} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex items-center gap-1">
                                            {item.name}
                                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                        </a>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Modificado {formatDistanceToNow(new Date(item.modifiedTime), { addSuffix: true, locale: ptBR })}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
                ) : (
                <p className="text-center text-muted-foreground text-sm py-4">Nenhum item encontrado nesta pasta.</p>
                )}
            </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
