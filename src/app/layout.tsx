import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ApplicationsProvider } from '@/contexts/ApplicationsContext';
import { DocumentsProvider } from '@/contexts/DocumentsContext';
import { NewsProvider } from '@/contexts/NewsContext';
import { EventsProvider } from '@/contexts/EventsContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { CollaboratorsProvider } from '@/contexts/CollaboratorsContext';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import { LabsProvider } from '@/contexts/LabsContext';

export const metadata: Metadata = {
  title: '3A RIVA Hub',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@300&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased")}>
        <ThemeProvider>
          <ReactQueryProvider>
            <AuthProvider>
              <ApplicationsProvider>
                <DocumentsProvider>
                  <NewsProvider>
                    <EventsProvider>
                      <CollaboratorsProvider>
                        <MessagesProvider>
                          <LabsProvider>
                            {children}
                          </LabsProvider>
                          <Toaster />
                        </MessagesProvider>
                      </CollaboratorsProvider>
                    </EventsProvider>
                  </NewsProvider>
                </DocumentsProvider>
              </ApplicationsProvider>
            </AuthProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
