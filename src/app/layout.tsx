
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import { SystemSettingsProvider } from '@/contexts/SystemSettingsContext';
import { Roboto, Archivo } from 'next/font/google';


const fontRoboto = Roboto({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-roboto',
});

const fontArchivo = Archivo({
  subsets: ['latin'],
  weight: ['300'],
  variable: '--font-archivo',
});


export const metadata: Metadata = {
  title: '3A RIVA Connect',
  description: 'Plataforma 3A RIVA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Tela%20de%20login%2FIntranet%20sem%20A.svg?alt=media&token=64ffd9b2-f82e-41bb-b43f-9f66f6db1ebd" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={cn("font-sans antialiased", fontRoboto.variable, fontArchivo.variable)}>
        <ThemeProvider>
          <ReactQueryProvider>
            <SystemSettingsProvider>
                <AuthProvider>
                    {children}
                    <Toaster />
                </AuthProvider>
            </SystemSettingsProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
