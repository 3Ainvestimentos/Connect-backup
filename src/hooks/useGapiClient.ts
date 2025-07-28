
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const GAPI_SCRIPT_URL = 'https://apis.google.com/js/api.js';
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive.readonly';


export const useGapiClient = () => {
  const { user } = useAuth();
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [isGisLoaded, setIsGisLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);

  useEffect(() => {
    const loadScript = (src: string, onLoad: () => void, onError: () => void) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            onLoad();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = onLoad;
        script.onerror = onError;
        document.body.appendChild(script);
        return script;
    };
    
    loadScript(GAPI_SCRIPT_URL, () => setIsGapiLoaded(true), () => setError('Falha ao carregar GAPI script.'));
    loadScript(GIS_SCRIPT_URL, () => setIsGisLoaded(true), () => setError('Falha ao carregar GIS script.'));
  }, []);

  useEffect(() => {
    if (isGapiLoaded && isGisLoaded && user) {
        try {
            window.gapi.load('client', async () => {
                await window.gapi.client.init({
                    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                    discoveryDocs: [
                      "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
                      "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
                    ],
                });
            });

            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                scope: SCOPES,
                callback: '', // Callback is handled by the promise resolve
            });
            setTokenClient(client);
        } catch (e: any) {
            setError(e.message || "Erro ao inicializar o cliente do Google.");
        }
    }
  }, [isGapiLoaded, isGisLoaded, user]);
  
  const getToken = useCallback((): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (error) return reject(new Error(error));
      if (!tokenClient) return reject(new Error('Cliente de token do Google não inicializado.'));

      tokenClient.callback = (resp: any) => {
        if (resp.error !== undefined) {
          return reject(resp);
        }
        return resolve(resp);
      };

      // Use an empty prompt to attempt a silent token refresh.
      // If the user hasn't granted scopes, this will trigger the consent flow.
      tokenClient.requestAccessToken({ prompt: '' });
    });
  }, [tokenClient, error]);

  const isClientReady = isGapiLoaded && isGisLoaded && !!tokenClient;

  return { isClientReady, error, getToken };
};
