"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  if (loading && !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
         <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
      </div>
    );
  }

  const handleSignIn = async () => {
    await signInWithGoogle();
    // The redirection is handled inside signInWithGoogle now.
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Pane - Decorative Video */}
      <div className="hidden md:block md:w-1/2 lg:w-2/5 relative">
        <video
          src="https://videos.pexels.com/video-files/853874/853874-hd_1920_1080_30fps.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div> {/* Optional overlay for text contrast */}
      </div>

      {/* Right Pane - Login Form */}
      <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col items-center px-6 pt-6 pb-4 sm:px-12 sm:pt-12">
        <div className="flex-grow flex items-center justify-center w-full">
            <div className="max-w-sm w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl border shadow-md">
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
            </div>
        </div>
        <footer className="flex-shrink-0 mt-8 text-center max-w-xl pb-2">
          <p className="text-xs text-muted-foreground font-body">
            Sujeito aos Termos de uso 3A RIVA e à Política de Privacidade da 3A RIVA.
            <br />
            O modelo Bob 1.0 pode cometer erros. Por isso, é bom checar as respostas. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}
