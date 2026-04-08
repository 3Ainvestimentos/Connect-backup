import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { WorkflowConfigCatalogData, WorkflowConfigVersionUiStatus } from '@/lib/workflows/admin-config/types';

function badgeVariantForStatus(status: WorkflowConfigVersionUiStatus): 'default' | 'secondary' | 'outline' {
  if (status === 'Publicada') {
    return 'default';
  }

  if (status === 'Inativa') {
    return 'secondary';
  }

  return 'outline';
}

function SummaryCard({
  title,
  value,
  caption,
}: {
  title: string;
  value: number;
  caption: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );
}

export function WorkflowConfigDefinitionsTab({ catalog }: { catalog: WorkflowConfigCatalogData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Areas"
          value={catalog.summary.areaCount}
          caption="Agrupamentos lidos de workflowAreas."
        />
        <SummaryCard
          title="Workflow types"
          value={catalog.summary.workflowTypeCount}
          caption="Tipos organizados por area e owner."
        />
        <SummaryCard
          title="Versoes"
          value={catalog.summary.versionCount}
          caption="Historico de versoes exposto em modo somente leitura."
        />
      </div>

      <Accordion type="multiple" className="rounded-lg border px-4">
        {catalog.areas.map((area) => (
          <AccordionItem key={area.areaId} value={area.areaId}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-2 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{area.name}</span>
                  <Badge variant="outline">{area.icon}</Badge>
                  <Badge variant="secondary">{area.typeCount} tipos</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {area.publishedTypeCount} publicados, {area.draftOnlyTypeCount} em rascunho inicial.
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {area.types.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-sm text-muted-foreground">
                    Nenhum workflow type associado a esta area no momento.
                  </CardContent>
                </Card>
              ) : (
                area.types.map((workflowType) => (
                  <Card key={workflowType.workflowTypeId}>
                    <CardHeader className="space-y-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{workflowType.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {workflowType.description || 'Sem descricao cadastrada.'}
                          </p>
                        </div>
                        <Badge variant={workflowType.hasPublishedVersion ? 'default' : 'outline'}>
                          {workflowType.publishedVersionLabel}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>Owner: {workflowType.ownerEmail || 'Nao informado'}</span>
                        <span>ID owner: {workflowType.ownerUserId || 'Nao informado'}</span>
                        <span>workflowTypeId: {workflowType.workflowTypeId}</span>
                        <span>{workflowType.active ? 'Tipo ativo' : 'Tipo inativo'}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {workflowType.versions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhuma versao encontrada para este workflow type.
                        </p>
                      ) : (
                        workflowType.versions.map((version, index) => (
                          <div key={`${workflowType.workflowTypeId}-v${version.version}`} className="space-y-3">
                            <div className="flex flex-col gap-2 rounded-md border p-4 md:flex-row md:items-center md:justify-between">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium">v{version.version}</span>
                                  <Badge variant={badgeVariantForStatus(version.uiStatus)}>
                                    {version.uiStatus}
                                  </Badge>
                                  {version.isActivePublished ? (
                                    <Badge variant="default">Ativa</Badge>
                                  ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {version.stepCount} etapas, {version.fieldCount} campos
                                  {version.publishedAt ? `, publicada em ${version.publishedAt}` : ''}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                state={version.state}
                              </p>
                            </div>
                            {index < workflowType.versions.length - 1 ? <Separator /> : null}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
