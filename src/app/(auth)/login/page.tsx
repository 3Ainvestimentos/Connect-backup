
"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-black">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute z-0 w-auto min-w-full min-h-full max-w-none opacity-40"
      >
        <source 
          src="https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Tela%20de%20login%2Fbanner-inicial-3a-invest.mp4?alt=media&token=10744d7f-79e4-44f0-aba3-395bfd2cbbb6" 
          type="video/mp4" 
        />
        Your browser does not support the video tag.
      </video>
      
      {/* Login Card */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center p-8 bg-card shadow-lg rounded-xl border border-border">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Imagens%20institucionais%20(logos%20e%20etc)%2Flogo_oficial_branca.png?alt=media&token=329d139b-cca1-4aed-95c7-a699fa32f0bb"
          alt="3A RIVA Investimentos Logo"
          width={250}
          height={60}
          priority
          className="mb-8"
        />

        <Button
          onClick={signInWithGoogle}
          disabled={loading}
          size="lg"
          variant="outline"
          className="w-full max-w-xs font-semibold font-body text-foreground/80 hover:bg-muted"
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 398.5 0 256S110.3 0 244 0c73 0 135.5 24.3 184.5 63.6L373.8 120c-35.1-33.3-83.3-53.8-129.8-53.8-106 0-191.5 85.5-191.5 191.2s85.5 191.2 191.5 191.2c71.2 0 123-30.8 159.3-64.8 28.2-26.6 42.6-67.7 47.4-113.1H244V261.8h244z"></path>
            </svg>
          )}
          Entrar com Google
        </Button>
      </div>

       {/* Footer Text */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-xs text-white/60 w-full px-4 z-10">
        <p>Sujeito aos Termos de uso 3A RIVA e à Política de Privacidade da 3A RIVA.</p>
        <p>O modelo Bob 1.0 pode cometer erros. Por isso, é bom checar as respostas. Todos os direitos reservados.</p>
      </div>
    </main>
  );
}
