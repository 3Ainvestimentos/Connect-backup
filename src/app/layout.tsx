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
import { QuickLinksProvider } from '@/contexts/QuickLinksContext';
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={cn("font-sans antialiased", fontRoboto.variable, fontArchivo.variable)}>
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
                                <QuickLinksProvider>
                                  {children}
                                </QuickLinksProvider>
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
