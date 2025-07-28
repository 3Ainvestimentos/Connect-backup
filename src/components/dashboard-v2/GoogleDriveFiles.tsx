
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Folder, File, ExternalLink, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';

declare global {
  interface Window {
    gapi: any;
  }
}

type GapiFile = gapi.client.drive.File;

// A mapping of MIME types to more friendly Lucide icons
const mimeTypeIcons: { [key: string]: React.ElementType } = {
  'application/vnd.google-apps.folder': Folder,
  'application/vnd.google-apps.document': File,
  'application/vnd.google-apps.spreadsheet': File,
  'application/vnd.google-apps.presentation': File,
  'application/pdf': File,
  'image/jpeg': File,
  'image/png': File,
  'video/mp4': File,
};

const getIconForMimeType = (mimeType?: string | null) => {
  if (!mimeType) return File;
  return mimeTypeIcons[mimeType] || File;
};

export default function GoogleDriveFiles() {
  const { user, getAccessToken } = useAuth();
  const [files, setFiles] = useState<GapiFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  // Initialize GAPI client for Google Drive
  const loadGapiClient = useCallback(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          setIsClientLoaded(true);
        } catch (err) {
          console.error("Error initializing GAPI Drive client:", err);
          toast({ title: 'Erro de API', description: 'Não foi possível carregar a API do Google Drive.', variant: 'destructive' });
        }
      });
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    loadGapiClient();
  }, [loadGapiClient]);

  // Fetch files from Google Drive
  const fetchFiles = useCallback(async () => {
    if (!isClientLoaded || !user) return;
    setLoading(true);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Token de acesso inválido.");

      window.gapi.client.setToken({ access_token: accessToken });

      const response = await window.gapi.client.drive.files.list({
        pageSize: 10,
        fields: 'nextPageToken, files(id, name, mimeType, webViewLink, modifiedTime, iconLink)',
        orderBy: 'modifiedTime desc',
      });
      
      setFiles(response.result.files || []);
    } catch (error) {
      console.error('Error fetching Drive files:', error);
      toast({ title: 'Erro ao buscar arquivos', description: 'Não foi possível carregar os arquivos do seu Google Drive.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [isClientLoaded, user, getAccessToken]);

  useEffect(() => {
    if (isClientLoaded && user) {
      fetchFiles();
    }
  }, [isClientLoaded, user, fetchFiles]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline text-foreground text-xl flex items-center gap-2">
            <HardDrive className="h-5 w-5" /> Acesso Rápido ao Drive
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-[250px]">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {files.length > 0 ? (
              files.map((file) => {
                const Icon = getIconForMimeType(file.mimeType);
                return (
                  <a
                    key={file.id}
                    href={file.webViewLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-muted"
                  >
                    <Image src={file.iconLink!} alt="file icon" width={24} height={24} />
                    <div className="flex-grow overflow-hidden">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      {file.modifiedTime && (
                         <p className="text-xs text-muted-foreground">
                            Modificado {formatDistanceToNow(new Date(file.modifiedTime), { addSuffix: true, locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </a>
                )
              })
            ) : (
              <p className="text-center text-muted-foreground">Nenhum arquivo recente encontrado.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
