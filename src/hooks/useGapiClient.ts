
"use client";

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const GAPI_SCRIPT_URL = 'https://apis.google.com/js/api.js';
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

export const useGapiClient = () => {
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [isGisLoaded, setIsGisLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadGapiScript = () => {
      const script = document.createElement('script');
      script.src = GAPI_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsGapiLoaded(true);
      script.onerror = () => setError(new Error('Falha ao carregar o script da API do Google.'));
      document.body.appendChild(script);
    };

    const loadGisScript = () => {
      const script = document.createElement('script');
      script.src = GIS_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsGisLoaded(true);
      script.onerror = () => setError(new Error('Falha ao carregar o script do Google Identity Services.'));
      document.body.appendChild(script);
    };

    if (typeof window !== 'undefined') {
      if (!window.gapi) {
        loadGapiScript();
      } else {
        setIsGapiLoaded(true);
      }
      if (!window.google) {
        loadGisScript();
      } else {
        setIsGisLoaded(true);
      }
    }
  }, []);

  const isClientReady = isGapiLoaded && isGisLoaded;

  return { isClientReady, error };
};
