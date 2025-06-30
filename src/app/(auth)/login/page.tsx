"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

// Placeholder for Google icon SVG
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  
  const handleSignIn = async () => {
    await signInWithGoogle();
  }

  return (
    // Use a single root element for positioning context
    <div className="relative min-h-screen w-full">
      {/* Background layers */}
      <div className="absolute inset-0 -z-20">
        <video
          src="https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/banner-inicial-3a-invest.mp4?alt=media&token=6934039d-1180-4b84-aa41-de70b9388be5"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-black/40" />

      {/* Centered Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6">
        {/* Main login card */}
        <main className="w-full max-w-sm space-y-8 rounded-xl bg-white p-8 shadow-lg sm:p-10">
          <div className="flex items-center justify-center">
            <Image 
              src="https://i.ibb.co/C52yDwLk/logo-oficial-preta.png" 
              alt="Logo 3A RIVA Hub" 
              width={187} 
              height={42} 
              priority 
            />
          </div>
          <Button
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-200 rounded-full shadow-sm text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-body"
            onClick={handleSignIn}
            disabled={loading}
          >
            <GoogleIcon />
            <span className="ml-2">Entrar com Google</span>
          </Button>
        </main>
        
        {/* Absolutely positioned footer at the bottom */}
        <footer className="absolute bottom-6 px-6 text-center">
          <p className="text-xs text-white/80 font-body">
            Sujeito aos Termos de uso 3A RIVA e à Política de Privacidade da 3A RIVA.
            <br />
            O modelo Bob 1.0 pode cometer erros. Por isso, é bom checar as respostas. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}
