
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
import { WorkflowsProvider } from '@/contexts/WorkflowsContext';
import { WorkflowAreasProvider } from '@/contexts/WorkflowAreasContext';

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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@300&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased")}>
        <ThemeProvider>
          <ReactQueryProvider>
            <CollaboratorsProvider>
              <AuthProvider>
                <WorkflowAreasProvider>
                  <ApplicationsProvider>
                    <DocumentsProvider>
                      <NewsProvider>
                        <EventsProvider>
                          <MessagesProvider>
                            <LabsProvider>
                              <WorkflowsProvider>
                                {children}
                              </WorkflowsProvider>
                            </LabsProvider>
                            <Toaster />
                          </MessagesProvider>
                        </EventsProvider>
                      </NewsProvider>
                    </DocumentsProvider>
                  </ApplicationsProvider>
                </WorkflowAreasProvider>
              </AuthProvider>
            </CollaboratorsProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
