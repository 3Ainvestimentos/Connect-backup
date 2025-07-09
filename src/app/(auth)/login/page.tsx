
"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden">
      {/* Background Video */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        poster="https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Imagens%20institucionais%20(logos%20e%20etc)%2Fbackground_poster.jpg?alt=media&token=86a5170d-c049-4343-a20c-c418e227a6d8"
      >
        <source 
          src="https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Videos%20Institucionais%2Fvideo_background.mp4?alt=media&token=3b313554-3e74-42b7-8461-71717357c91e" 
          type="video/mp4" 
        />
        Seu navegador não suporta o vídeo de fundo.
      </video>
      <div className="absolute inset-0 bg-black/50 z-10"></div>

      {/* Login Card */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center p-8 bg-black/40 backdrop-blur-sm rounded-xl border border-white/20">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Imagens%20institucionais%20(logos%20e%20etc)%2Flogo_oficial_branca.png?alt=media&token=329d139b-cca1-4aed-95c7-a699fa32f0bb"
          alt="3A RIVA Hub Logo"
          width={250}
          height={60}
          priority
          className="mb-8"
        />

        <p className="text-lg text-white font-light mb-6 font-body">
          Sua plataforma central de comunicação e recursos.
        </p>

        <Button
          onClick={signInWithGoogle}
          disabled={loading}
          size="lg"
          className="w-full max-w-xs bg-white text-black hover:bg-gray-200 font-bold font-body"
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
    </main>
  );
}
