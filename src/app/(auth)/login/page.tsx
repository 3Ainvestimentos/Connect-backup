
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
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        src="https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Tela%20de%20login%2Fbanner-inicial-3a-invest.mp4?alt=media&token=10744d7f-79e4-44f0-aba3-395bfd2cbbb6"
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
            <Image src="https://i.ibb.co/7jQqMv7/google-logo.png" alt="Google logo" width={20} height={20} className="mr-2" />
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
