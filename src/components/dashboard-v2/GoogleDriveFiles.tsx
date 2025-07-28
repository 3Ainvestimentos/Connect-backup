"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HardDrive, AlertCircle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../ui/button';

interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
  iconLink: string;
}

export default function GoogleDriveFiles() {
  const { user, getAccessToken } = useAuth();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listRecentFiles = useCallback(async () => {
    if (!user || !window.gapi) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
       if (!accessToken) {
        throw new Error("Não foi possível obter o token de acesso.");
      }
      
      window.gapi.client.setToken({ access_token: accessToken });
      
      const response = await window.gapi.client.drive.files.list({
          'pageSize': 5,
          'fields': "nextPageToken, files(id, name, modifiedTime, webViewLink, iconLink)",
          'orderBy': 'modifiedTime desc'
      });

      setFiles(response.result.files || []);

    } catch (err: any) {
      console.error("Erro ao buscar arquivos do Drive:", err);
      let errorMessage = "Não foi possível carregar os arquivos do Drive.";
      if (err.result?.error?.message) {
        errorMessage = err.result.error.message;
      } else if(err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, getAccessToken]);

  useEffect(() => {
    if (window.gapi) {
        window.gapi.load('client', () => {
            window.gapi.client.init({
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
            }).then(() => {
                if (user) {
                    listRecentFiles();
                }
            });
        });
    } else if (!user) {
      setIsLoading(false);
    }
  }, [user, listRecentFiles]);


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5" /> Google Drive</CardTitle>
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
                <CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5" /> Google Drive</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center text-destructive p-4">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Erro ao carregar arquivos</p>
                <p className="text-xs">{error}</p>
                <Button variant="link" size="sm" onClick={listRecentFiles} className="text-xs mt-2 text-destructive">Tentar novamente</Button>
            </CardContent>
        </Card>
      );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5" /> Google Drive</CardTitle>
      </CardHeader>
      <CardContent>
        {files.length > 0 ? (
          <ul className="space-y-3">
            {files.map((file) => (
              <li key={file.id} className="flex items-center gap-3 text-sm">
                <img src={file.iconLink} alt="file icon" className="w-5 h-5 flex-shrink-0" />
                <div className="flex-grow truncate">
                  <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex items-center gap-1">
                    {file.name} <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-muted-foreground">
                    Modificado {formatDistanceToNow(new Date(file.modifiedTime), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">Nenhum arquivo recente encontrado.</p>
        )}
      </CardContent>
    </Card>
  );
}
