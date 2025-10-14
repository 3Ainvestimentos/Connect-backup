
"use client";

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import { SystemSettingsProvider } from '@/contexts/SystemSettingsContext';
import { CollaboratorsProvider } from './CollaboratorsProvider';
import { WorkflowAreasProvider } from '@/contexts/WorkflowAreasContext';
import { ApplicationsProvider } from '@/contexts/ApplicationsContext';
import { DocumentsProvider } from '@/contexts/DocumentsContext';
import { NewsProvider } from '@/contexts/NewsContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { LabsProvider } from '@/contexts/LabsContext';
import { WorkflowsProvider } from '@/contexts/WorkflowsContext';
import { QuickLinksProvider } from '@/contexts/QuickLinksContext';
import { PollsProvider } from '@/contexts/PollsContext';
import { RankingsProvider } from '@/contexts/RankingsContext';
import { FabMessagesProvider } from '@/contexts/FabMessagesContext';
import { IdleFabMessagesProvider } from '@/contexts/IdleFabMessagesContext';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
        <ReactQueryProvider>
        <SystemSettingsProvider>
            <AuthProvider>
                <CollaboratorsProvider>
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
                                            <FabMessagesProvider>
                                            <IdleFabMessagesProvider>
                                                {children}
                                            </IdleFabMessagesProvider>
                                            </FabMessagesProvider>
                                        </RankingsProvider>
                                        </PollsProvider>
                                    </QuickLinksProvider>
                                    </WorkflowsProvider>
                                </LabsProvider>
                                </MessagesProvider>
                            </NewsProvider>
                        </DocumentsProvider>
                        </ApplicationsProvider>
                    </WorkflowAreasProvider>
                </CollaboratorsProvider>
            </AuthProvider>
        </SystemSettingsProvider>
        </ReactQueryProvider>
    </ThemeProvider>
  );
}
