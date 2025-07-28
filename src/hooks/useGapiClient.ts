
"use client";

import { useState, useEffect } from 'react';
import { toast } from './use-toast';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface GapiClientState {
  gapi: any | null;
  isGapiReady: boolean;
}

const GAPI_SCRIPT_ID = 'gapi-script';
const DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
];
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const useGapiClient = (): GapiClientState => {
  const [gapi, setGapi] = useState<any | null>(null);
  const [isGapiReady, setIsGapiReady] = useState(false);

  useEffect(() => {
    const loadGapiScript = () => {
      if (document.getElementById(GAPI_SCRIPT_ID)) {
        if(window.gapi?.client) {
            setGapi(window.gapi);
            setIsGapiReady(true);
        }
        return;
      }
      
      const scriptGapi = document.createElement('script');
      scriptGapi.id = GAPI_SCRIPT_ID;
      scriptGapi.src = 'https://apis.google.com/js/api.js';
      scriptGapi.async = true;
      scriptGapi.defer = true;
      scriptGapi.onload = () => gapiLoaded();
      document.body.appendChild(scriptGapi);
    };
    
    const gapiLoaded = () => {
        window.gapi.load('client', initializeGapiClient);
    };

    const initializeGapiClient = async () => {
        try {
            await window.gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: DISCOVERY_DOCS,
            });
            setGapi(window.gapi);
            setIsGapiReady(true);
        } catch (e) {
            console.error("Error initializing GAPI client", e);
            toast({ title: "Erro de API", description: "Não foi possível inicializar o cliente GAPI.", variant: "destructive" });
        }
    };
    
    loadGapiScript();

  }, []);

  return { gapi, isGapiReady };
};
