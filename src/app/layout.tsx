import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { HighlightsProvider } from '@/contexts/HighlightsContext';
import { ApplicationsProvider } from '@/contexts/ApplicationsContext';
import { DocumentsProvider } from '@/contexts/DocumentsContext';
import { NewsProvider } from '@/contexts/NewsContext';
import { EventsProvider } from '@/contexts/EventsContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { CollaboratorsProvider } from '@/contexts/CollaboratorsContext';

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
          <AuthProvider>
            <HighlightsProvider>
              <ApplicationsProvider>
                <DocumentsProvider>
                  <NewsProvider>
                    <EventsProvider>
                      <MessagesProvider>
                        <CollaboratorsProvider>
                          {children}
                          <Toaster />
                        </CollaboratorsProvider>
                      </MessagesProvider>
                    </EventsProvider>
                  </NewsProvider>
                </DocumentsProvider>
              </ApplicationsProvider>
            </HighlightsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
