"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Construction } from 'lucide-react';
import Image from 'next/image';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.651-3.356-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.14,44,30.026,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);


export default function LoginPage() {
  const { signInWithGoogle, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSystemSettings();

  const loading = authLoading || settingsLoading;
  const maintenanceMode = settings.maintenanceMode;

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-black">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        src="https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Tela%20de%20login%2Fbanner-inicial-3a-invest.mp4?alt=media&token=3a0b4f47-fe59-4aa7-b7db-4390dc59d8da"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 z-10" />

      {/* Login Card */}
      <div className="relative z-20 flex w-full max-w-sm flex-col items-center justify-center rounded-lg bg-card p-8 shadow-2xl">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Imagens%20institucionais%20(logos%20e%20etc)%2Flogo%20oficial%20preta.png?alt=media&token=ce88dc80-01cd-4295-b443-951e6c0210aa"
          alt="3A RIVA Investimentos Logo"
          width={250}
          height={60}
          priority
          className="mb-8"
        />
        {maintenanceMode && (
          <div className="mb-4 w-full p-4 rounded-md border border-amber-500/50 bg-amber-500/10 text-amber-700 text-center">
             <Construction className="mx-auto h-6 w-6 text-amber-600 mb-2"/>
             <p className="font-semibold text-sm">Plataforma em Manutenção</p>
             <p className="text-xs">{settings.maintenanceMessage}</p>
          </div>
        )}

        <Button
          onClick={signInWithGoogle}
          disabled={loading || maintenanceMode}
          size="lg"
          variant="outline"
          className="w-full max-w-xs font-semibold font-body text-foreground/80 rounded-full hover:bg-card hover:text-foreground/80"
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-5 w-5" />
          )}
          Entrar com Google
        </Button>
      </div>

      {/* Footer Text */}
      <footer className="absolute bottom-4 left-0 right-0 z-20 text-center text-xs text-white/60 p-4">
        <p>Sujeito aos Termos de uso 3A RIVA e à Política de Privacidade da 3A RIVA.</p>
        <p>O modelo Bob 1.0 pode cometer erros. Por isso, é bom checar as respostas. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
