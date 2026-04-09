"use client";

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  activateWorkflowVersion,
  createWorkflowDraft,
  publishWorkflowVersion,
} from '@/lib/workflows/admin-config/api-client';
import type { WorkflowConfigCatalogData, WorkflowConfigVersionUiStatus } from '@/lib/workflows/admin-config/types';
import { CheckCircle2, Loader2, PenSquare, PlusCircle, Rocket, Sparkles } from 'lucide-react';
import { CreateWorkflowAreaDialog } from './CreateWorkflowAreaDialog';
import { CreateWorkflowTypeDialog } from './CreateWorkflowTypeDialog';

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

export function WorkflowConfigDefinitionsTab({
  catalog,
  onRefresh,
  onOpenEditor,
}: {
  catalog: WorkflowConfigCatalogData;
  onRefresh: () => void;
  onOpenEditor: (workflowTypeId: string, version: number) => void;
}) {
  const { user } = useAuth();
  const [createAreaOpen, setCreateAreaOpen] = useState(false);
  const [createTypeOpen, setCreateTypeOpen] = useState(false);
  const [openingDraftFor, setOpeningDraftFor] = useState<string | null>(null);
  const [transitioningVersion, setTransitioningVersion] = useState<string | null>(null);

  async function handleCreateDraft(workflowTypeId: string) {
    if (!user) {
      return;
    }

    setOpeningDraftFor(workflowTypeId);

    try {
      const result = await createWorkflowDraft(user, workflowTypeId);
      onRefresh();
      onOpenEditor(result.workflowTypeId, result.version);
    } catch (error) {
      toast({
        title: 'Falha ao abrir draft',
        description: error instanceof Error ? error.message : 'Erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setOpeningDraftFor(null);
    }
  }

  async function handlePublishVersion(workflowTypeId: string, version: number) {
    if (!user) {
      return;
    }

    const key = `${workflowTypeId}:${version}:publish`;
    setTransitioningVersion(key);

    try {
      await publishWorkflowVersion(user, workflowTypeId, version);
      toast({
        title: 'Versao publicada',
        description: `A versao v${version} agora esta publicada e ativa.`,
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Falha ao publicar',
        description: error instanceof Error ? error.message : 'Erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setTransitioningVersion(null);
    }
  }

  async function handleActivateVersion(workflowTypeId: string, version: number) {
    if (!user) {
      return;
    }

    const key = `${workflowTypeId}:${version}:activate`;
    setTransitioningVersion(key);

    try {
      await activateWorkflowVersion(user, workflowTypeId, version);
      toast({
        title: 'Versao ativada',
        description: `A versao v${version} voltou a ser a publicada ativa.`,
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Falha ao ativar versao',
        description: error instanceof Error ? error.message : 'Erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setTransitioningVersion(null);
    }
  }

  return (
    <>
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
            caption="Historico de versoes exposto na superficie administrativa."
          />
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Definicoes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Crie areas, abra novos workflow types e continue drafts existentes sem alterar o runtime publicado.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setCreateAreaOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova area
              </Button>
              <Button onClick={() => setCreateTypeOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Novo tipo
              </Button>
            </div>
          </CardHeader>
        </Card>

        {catalog.areas.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Nenhuma area foi encontrada. Use "Nova area" para iniciar o catalogo.
            </CardContent>
          </Card>
        ) : (
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
                  area.types.map((workflowType) => {
                    const draftVersion = workflowType.versions.find((version) => version.state === 'draft') ?? null;

                    return (
                      <Card key={workflowType.workflowTypeId}>
                        <CardHeader className="space-y-3">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">{workflowType.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {workflowType.description || 'Sem descricao cadastrada.'}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 md:items-end">
                              <Badge variant={workflowType.hasPublishedVersion ? 'default' : 'outline'}>
                                {workflowType.publishedVersionLabel}
                              </Badge>
                              {draftVersion ? (
                                <Button
                                  size="sm"
                                  onClick={() => onOpenEditor(workflowType.workflowTypeId, draftVersion.version)}
                                >
                                  <PenSquare className="mr-2 h-4 w-4" />
                                  Editar rascunho
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCreateDraft(workflowType.workflowTypeId)}
                                  disabled={openingDraftFor === workflowType.workflowTypeId}
                                >
                                  {openingDraftFor === workflowType.workflowTypeId ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Nova versao draft
                                </Button>
                              )}
                            </div>
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
                                      {version.lastTransitionAt ? `, ultima transicao em ${version.lastTransitionAt}` : ''}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {version.state === 'draft' ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onOpenEditor(workflowType.workflowTypeId, version.version)}
                                      >
                                        <PenSquare className="mr-2 h-4 w-4" />
                                        Editar
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onOpenEditor(workflowType.workflowTypeId, version.version)}
                                      >
                                        <PenSquare className="mr-2 h-4 w-4" />
                                        Ver versao
                                      </Button>
                                    )}
                                    {version.canPublish ? (
                                      <Button
                                        size="sm"
                                        onClick={() => handlePublishVersion(workflowType.workflowTypeId, version.version)}
                                        disabled={
                                          transitioningVersion === `${workflowType.workflowTypeId}:${version.version}:publish`
                                        }
                                      >
                                        {transitioningVersion === `${workflowType.workflowTypeId}:${version.version}:publish` ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <Rocket className="mr-2 h-4 w-4" />
                                        )}
                                        Publicar
                                      </Button>
                                    ) : null}
                                    {version.canActivate ? (
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleActivateVersion(workflowType.workflowTypeId, version.version)}
                                        disabled={
                                          transitioningVersion === `${workflowType.workflowTypeId}:${version.version}:activate`
                                        }
                                      >
                                        {transitioningVersion === `${workflowType.workflowTypeId}:${version.version}:activate` ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                        )}
                                        Ativar
                                      </Button>
                                    ) : null}
                                    <p className="text-xs text-muted-foreground">state={version.state}</p>
                                  </div>
                                </div>
                                {version.hasBlockingIssues && version.state === 'draft' ? (
                                  <p className="text-xs text-amber-700">
                                    Este rascunho possui bloqueios e nao pode ser publicado ainda.
                                  </p>
                                ) : null}
                                {index < workflowType.versions.length - 1 ? <Separator /> : null}
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </AccordionContent>
            </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <CreateWorkflowAreaDialog
        open={createAreaOpen}
        onOpenChange={setCreateAreaOpen}
        onCreated={onRefresh}
      />

      <CreateWorkflowTypeDialog
        open={createTypeOpen}
        onOpenChange={setCreateTypeOpen}
        onOpenEditor={onOpenEditor}
      />
    </>
  );
}
