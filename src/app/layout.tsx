import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ApplicationsProvider } from '@/contexts/ApplicationsContext';
import { DocumentsProvider } from '@/contexts/DocumentsContext';
import { NewsProvider } from '@/contexts/NewsContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { CollaboratorsProvider } from '@/contexts/CollaboratorsContext';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import { LabsProvider } from '@/contexts/LabsContext';
import { WorkflowsProvider } from '@/contexts/WorkflowsContext';
import { WorkflowAreasProvider } from '@/contexts/WorkflowAreasContext';
import { QuickLinksProvider } from '@/contexts/QuickLinksContext';
import { SystemSettingsProvider } from '@/contexts/SystemSettingsContext';
import { Roboto, Archivo } from 'next/font/google';
import { PollsProvider } from '@/contexts/PollsContext';
import { RankingsProvider } from '@/contexts/RankingsContext';
import { KanbanProvider } from '@/contexts/KanbanContext';


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
            <CollaboratorsProvider>
                <SystemSettingsProvider>
                  <AuthProvider>
                    <WorkflowAreasProvider>
                      <ApplicationsProvider>
                        <DocumentsProvider>
                          <NewsProvider>
                              <MessagesProvider>
                                <LabsProvider>
                                  <WorkflowsProvider>
                                    <QuickLinksProvider>
                                      <PollsProvider>
                                        <RankingsProvider>
                                          <KanbanProvider>
                                            {children}
                                          </KanbanProvider>
                                        </RankingsProvider>
                                      </PollsProvider>
                                    </QuickLinksProvider>
                                  </WorkflowsProvider>
                                </LabsProvider>
                                <Toaster />
                              </MessagesProvider>
                          </NewsProvider>
                        </DocumentsProvider>
                      </ApplicationsProvider>
                    </WorkflowAreasProvider>
                  </AuthProvider>
                </SystemSettingsProvider>
            </CollaboratorsProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
