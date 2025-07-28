
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
  gis: any | null;
  isGapiReady: boolean;
}

const GAPI_SCRIPT_ID = 'gapi-script';
const GIS_SCRIPT_ID = 'gis-script';
const DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
];
const CLIENT_ID = process.env.NEXT_PUBLIC_FIREBASE_CLIENT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.readonly";


export const useGapiClient = (): GapiClientState => {
  const [gapi, setGapi] = useState<any | null>(null);
  const [gis, setGis] = useState<any | null>(null);
  const [isGapiReady, setIsGapiReady] = useState(false);

  useEffect(() => {
    const loadScripts = () => {
      // Load GAPI script
      if (!document.getElementById(GAPI_SCRIPT_ID)) {
        const scriptGapi = document.createElement('script');
        scriptGapi.id = GAPI_SCRIPT_ID;
        scriptGapi.src = 'https://apis.google.com/js/api.js';
        scriptGapi.async = true;
        scriptGapi.defer = true;
        scriptGapi.onload = () => gapiLoaded();
        document.body.appendChild(scriptGapi);
      } else {
        gapiLoaded();
      }
      
      // Load GIS script
      if (!document.getElementById(GIS_SCRIPT_ID)) {
          const scriptGis = document.createElement('script');
          scriptGis.id = GIS_SCRIPT_ID;
          scriptGis.src = 'https://accounts.google.com/gsi/client';
          scriptGis.async = true;
          scriptGis.defer = true;
          scriptGis.onload = () => gisLoaded();
          document.body.appendChild(scriptGis);
      } else {
          gisLoaded();
      }
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
        } catch (e) {
            console.error("Error initializing GAPI client", e);
            toast({ title: "Erro de API", description: "Não foi possível inicializar o cliente GAPI.", variant: "destructive" });
        }
    };

    const gisLoaded = () => {
        try {
            const gisClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: () => {}, // Callback is handled by the promise in AuthContext
            });
            setGis(gisClient);
        } catch (e) {
             console.error("Error initializing GIS client", e);
             toast({ title: "Erro de API", description: "Não foi possível inicializar o cliente GIS.", variant: "destructive" });
        }
    };

    loadScripts();

  }, []);
  
  useEffect(() => {
      if (gapi && gis) {
          setIsGapiReady(true);
      }
  }, [gapi, gis]);

  return { gapi, gis, isGapiReady };
};
