

import AppLayoutWrapper from '@/components/layout/AppLayout';
import { ApplicationsProvider } from '@/contexts/ApplicationsContext';
import { CollaboratorsProvider } from '@/components/providers/CollaboratorsProvider';
import { DocumentsProvider } from '@/contexts/DocumentsContext';
import { FabMessagesProvider } from '@/contexts/FabMessagesContext';
import { IdleFabMessagesProvider } from '@/contexts/IdleFabMessagesContext';
import { LabsProvider } from '@/contexts/LabsContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { NewsProvider } from '@/contexts/NewsContext';
import { PollsProvider } from '@/contexts/PollsContext';
import { QuickLinksProvider } from '@/contexts/QuickLinksContext';
import { RankingsProvider } from '@/contexts/RankingsContext';
import { RequestsProvider } from '@/contexts/RequestsContext';
import { WorkflowAreasProvider } from '@/contexts/WorkflowAreasContext';
import { WorkflowsProvider } from '@/contexts/WorkflowsContext';
import { ContactsProvider } from '@/contexts/ContactsContext';

function AppProviders({ children }: { children: React.ReactNode }) {
    return (
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
                                      <ContactsProvider>
                                        {children}
                                      </ContactsProvider>
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
    )
}


export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
        <RequestsProvider>
            <AppLayoutWrapper>{children}</AppLayoutWrapper>
        </RequestsProvider>
    </AppProviders>
  );
}
