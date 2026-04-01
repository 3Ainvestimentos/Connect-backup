'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MANAGEMENT_DEFAULT_TAB,
  MANAGEMENT_SHELL_TABS,
  WORKFLOW_MANAGEMENT_DESCRIPTION,
  WORKFLOW_MANAGEMENT_TITLE,
  WORKFLOW_MANAGEMENT_TRANSITION_DESCRIPTION,
  WORKFLOW_MANAGEMENT_TRANSITION_TITLE,
} from '@/lib/workflows/management/constants';
import type { ManagementShellTabId } from '@/lib/workflows/management/types';
import { ManagementShellPlaceholder } from './ManagementShellPlaceholder';

export function WorkflowManagementPage() {
  const [activeTab, setActiveTab] = React.useState<ManagementShellTabId>(MANAGEMENT_DEFAULT_TAB);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader
        title={WORKFLOW_MANAGEMENT_TITLE}
        description={WORKFLOW_MANAGEMENT_DESCRIPTION}
      />

      <Card className="border-border/70 bg-muted/30">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Fase 2A.1</Badge>
            <Badge variant="outline">Convivio com legados ativo</Badge>
          </div>
          <div className="space-y-1">
            <CardTitle className="font-headline text-lg">
              {WORKFLOW_MANAGEMENT_TRANSITION_TITLE}
            </CardTitle>
            <CardDescription className="max-w-3xl font-body text-sm">
              {WORKFLOW_MANAGEMENT_TRANSITION_DESCRIPTION}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-muted-foreground">
          /requests, /me/tasks, /applications e /pilot/facilities permanecem disponiveis
          durante a transicao desta superficie oficial.
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ManagementShellTabId)}
        className="space-y-4"
      >
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-lg bg-muted/60 p-1">
          {MANAGEMENT_SHELL_TABS.map((tab) => (
            <TabsTrigger key={tab.tab} value={tab.tab} className="px-4 py-2">
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {MANAGEMENT_SHELL_TABS.map((tab) => (
          <TabsContent key={tab.tab} value={tab.tab}>
            <ManagementShellPlaceholder content={tab} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
