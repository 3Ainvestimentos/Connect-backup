"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, File, ExternalLink, HardDrive, Folder } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { useGapiClient } from '@/hooks/useGapiClient';

type GapiFile = gapi.client.drive.File;

export default function GoogleDriveFiles() {
  const { user, getAccessToken } = useAuth();
  const { gapi, gis, isGapiReady } = useGapiClient();
  const [files, setFiles] = useState<GapiFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch files from Google Drive
  const fetchFiles = useCallback(async () => {
    if (!isGapiReady || !user || !gapi || !gis) return;
    setLoading(true);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Token de acesso inválido.");
      gis.client.setToken({ access_token: accessToken });

      const response = await gapi.client.drive.files.list({
        pageSize: 10,
        fields: 'nextPageToken, files(id, name, mimeType, webViewLink, modifiedTime, iconLink)',
        orderBy: 'modifiedTime desc',
      });
      
      setFiles(response.result.files || []);
    } catch (error: any) {
      console.error('Error fetching Drive files:', error);
      toast({ title: 'Erro ao buscar arquivos', description: error.message || 'Não foi possível carregar os arquivos do seu Google Drive.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [isGapiReady, user, getAccessToken, gapi, gis]);

  useEffect(() => {
    if (isGapiReady && user) {
      fetchFiles();
    }
  }, [isGapiReady, user, fetchFiles]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline text-foreground text-xl flex items-center gap-2">
            <HardDrive className="h-5 w-5" /> Google Drive
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
              files.map((file) => (
                  <a
                    key={file.id}
                    href={file.webViewLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-muted"
                  >
                    {file.iconLink && <Image src={file.iconLink} alt="file icon" width={24} height={24} />}
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
              )
            ) : (
              <p className="text-center text-muted-foreground">Nenhum arquivo recente encontrado.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
