
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HardDrive, AlertCircle, ExternalLink, Folder, ChevronRight, File as FileIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { useCollaborators } from '@/contexts/CollaboratorsContext';

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

const extractFolderIdFromUrl = (url: string): string | null => {
    const regex = /folders\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
};


export default function GoogleDriveFiles() {
  const { user, accessToken } = useAuth();
  const { collaborators } = useCollaborators();
  const [items, setItems] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialFolders, setInitialFolders] = useState<FolderInfo[]>([]);

  const currentUserCollab = useMemo(() => {
    if (!user) return null;
    return collaborators.find(c => c.email === user.email);
  }, [user, collaborators]);

  const [currentFolder, setCurrentFolder] = useState<FolderInfo | null>(null);
  const [folderHistory, setFolderHistory] = useState<FolderInfo[]>([]);
  
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
          orderBy: 'folder,modifiedTime desc'
      });

      setItems(response.result.files || []);

    } catch (err: any) {
      console.error("Erro ao buscar arquivos do Drive:", err);
      let errorMessage = "Não foi possível carregar os arquivos do Drive.";
      if (err.result?.error?.message) {
        errorMessage = `Erro da API: ${err.result.error.message}. Tente atualizar a página.`;
      } else if(err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, accessToken]);


  const fetchFolderDetails = useCallback(async (folderId: string): Promise<FolderInfo> => {
    try {
      window.gapi.client.setToken({ access_token: accessToken });
      const response = await window.gapi.client.drive.files.get({
        fileId: folderId,
        fields: 'id, name',
      });
      return response.result;
    } catch (error) {
      console.error(`Failed to fetch details for folder ${folderId}`, error);
      return { id: folderId, name: `Pasta (${folderId.slice(0,5)}...)` }; // Fallback name
    }
  }, [accessToken]);


  useEffect(() => {
    if (typeof window.gapi === 'undefined' || typeof window.gapi.load === 'undefined') {
        setError("A biblioteca de cliente do Google não pôde ser carregada.");
        setIsLoading(false);
        return;
    }
    
    const initializeAndFetch = async () => {
      if (!user || !accessToken) {
        if (!user) setIsLoading(false);
        return;
      }
      
      setIsLoading(true);

      if (!window.gapi.client || !window.gapi.client.drive) {
          await new Promise<void>((resolve, reject) => {
              window.gapi.load('client', () => {
                  window.gapi.client.init({
                      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
                  }).then(() => resolve()).catch((e:any) => reject(e));
              });
          });
      }

      const driveLinks = currentUserCollab?.googleDriveLinks;

      if (driveLinks && driveLinks.length > 1) {
        // Multiple folders: fetch their names and show them as the initial view
        const folderIds = driveLinks.map(extractFolderIdFromUrl).filter((id): id is string => id !== null);
        const folderPromises = folderIds.map(id => fetchFolderDetails(id));
        const fetchedFolders = await Promise.all(folderPromises);
        setInitialFolders(fetchedFolders);
        setItems([]); // Clear file list
        setCurrentFolder(null); // No single current folder
        setFolderHistory([]);
      } else {
        // Single folder or default to 'root'
        const singleLink = driveLinks && driveLinks.length === 1 ? driveLinks[0] : null;
        const folderId = singleLink ? extractFolderIdFromUrl(singleLink) || 'root' : 'root';
        const rootFolder = { id: folderId, name: 'Início' };
        setInitialFolders([]);
        setCurrentFolder(rootFolder);
        setFolderHistory([rootFolder]);
        listFiles(folderId);
      }
      setIsLoading(false);
    }
    
    initializeAndFetch().catch(e => {
        setError("Falha ao inicializar o cliente GAPI.");
        setIsLoading(false);
    });

  }, [user, accessToken, currentUserCollab, listFiles, fetchFolderDetails]);


  const handleFolderClick = (folder: DriveFile | FolderInfo) => {
    const newFolder = { id: folder.id, name: folder.name };
    setCurrentFolder(newFolder);
    setFolderHistory(prev => [...prev, newFolder]);
    listFiles(folder.id);
  };
  
  const handleBreadcrumbClick = (folderId: string, index: number) => {
    if(index === -1) { // Clicked on initial multi-folder view
        setCurrentFolder(null);
        setFolderHistory([]);
        setItems([]);
        return;
    }
    setCurrentFolder({ id: folderId, name: folderHistory[index].name });
    setFolderHistory(prev => prev.slice(0, index + 1));
    listFiles(folderId);
  }

  const renderBreadcrumbs = () => {
    const history = folderHistory.length > 0 ? folderHistory : (currentFolder ? [currentFolder] : []);
    const rootName = initialFolders.length > 1 ? "Pastas" : "Início";
    
    return (
      <div className="flex items-center text-sm text-muted-foreground flex-wrap">
          <Button 
              variant="link" 
              onClick={() => handleBreadcrumbClick('', -1)}
              className={cn(
                  "p-1 h-auto text-muted-foreground hover:text-foreground",
                  history.length === 0 && "font-semibold text-foreground hover:text-foreground/80"
              )}
              disabled={initialFolders.length <= 1}
          >
              {rootName}
          </Button>

          {history.map((folder, index) => (
              <React.Fragment key={folder.id}>
                  <ChevronRight className="h-4 w-4" />
                  <Button 
                      variant="link" 
                      onClick={() => handleBreadcrumbClick(folder.id, index)} 
                      className={cn(
                          "p-1 h-auto text-muted-foreground hover:text-foreground",
                          index === history.length - 1 ? "font-semibold text-foreground hover:text-foreground/80" : ""
                      )}
                  >
                      {folder.name}
                  </Button>
              </React.Fragment>
          ))}
      </div>
    );
  }
  
  if (isLoading) {
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
                <Button variant="link" size="sm" onClick={() => listFiles(currentFolder?.id || 'root')} className="text-xs mt-2 text-destructive">Tentar novamente</Button>
            </CardContent>
        </Card>
      );
  }
  
  const renderContent = () => {
    const list = currentFolder ? items : initialFolders;

    if (list.length === 0) {
      return <p className="text-center text-muted-foreground text-sm py-4">Nenhum item encontrado.</p>
    }

    return (
       <ul className="space-y-3">
          {list.map((item: DriveFile | FolderInfo) => {
              const isDriveFile = 'mimeType' in item;
              const isFolder = isDriveFile ? item.mimeType === 'application/vnd.google-apps.folder' : true;

              return (
                  <li key={item.id} className="flex items-center gap-3 text-sm">
                      <img src={isDriveFile ? item.iconLink : "https://ssl.gstatic.com/docs/doclist/images/infinite_arrow_favicon_1.ico"} alt="file icon" className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-grow truncate">
                          {isFolder ? (
                              <button onClick={() => handleFolderClick(item as DriveFile)} className="font-semibold hover:underline text-left flex items-center gap-1">
                                  {item.name}
                              </button>
                          ) : (
                              <a href={(item as DriveFile).webViewLink} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex items-center gap-1">
                                  {item.name}
                                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              </a>
                          )}
                          {isDriveFile && <p className="text-xs text-muted-foreground">
                              Modificado {formatDistanceToNow(new Date((item as DriveFile).modifiedTime), { addSuffix: true, locale: ptBR })}
                          </p>}
                      </div>
                  </li>
              );
          })}
      </ul>
    );
  }


  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline text-foreground text-xl">Google Drive</CardTitle>
        <CardDescription>
            Navegue pelas suas pastas ou abra os arquivos diretamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow min-h-0 flex flex-col gap-2">
         {renderBreadcrumbs()}
         <div className="flex-grow min-h-0">
            <ScrollArea className={cn("h-full relative transition-opacity pr-3", isLoading ? "opacity-40" : "opacity-100")}>
                {renderContent()}
            </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
