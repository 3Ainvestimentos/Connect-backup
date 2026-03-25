/**
 * @fileOverview Bootstrap payload builder for the 3 Facilities pilot workflows.
 *
 * This module is intentionally a pure builder. It only materializes payloads for:
 * - workflowTypes_v2/{workflowTypeId}
 * - workflowTypes_v2/{workflowTypeId}/versions/1
 *
 * Writing those payloads is handled by a dedicated manual seed script.
 */

import { Timestamp } from 'firebase-admin/firestore';
import { generateStepId } from './step-id';
import type { StepKind, VersionFieldDef } from '../runtime/types';

export const FACILITIES_FASE1_OWNER_EMAIL = 'stefania.otoni@3ainvestimentos.com.br';
export const FACILITIES_FASE1_OWNER_USER_ID = '3gEXjlKgxJFl0q6udVMu';
export const FACILITIES_FASE1_DEFAULT_SLA_DAYS = 5;
export const FACILITIES_FASE1_AREA_ID = 'u3entfMNB17iklBOdq5H';

const IMPACTO_OPTIONS = ['Baixo', 'Médio', 'Alto', 'Urgente (Crítico)'];
const CENTRO_CUSTO_OPTIONS = [
  '3ARI-Belo Horizonte',
  '3ARI-Campinas',
  '3ARI-Pouso Alegre',
  '3ARI-Itajubá',
  '3ARI-Jundiaí',
  '3ARI-São José dos Campos',
  '3ARI-Contagem',
  '3ARI-Varginha',
  '3ARI-Limeira',
  '3ARI-São Paulo',
  '3ARI-Rio de Janeiro',
  '3ARI-Floripa',
];

const CANONICAL_STEPS: Array<{ stepName: string; statusKey: string; kind: StepKind }> = [
  { stepName: 'Solicitação Aberta', statusKey: 'solicitacao_aberta', kind: 'start' },
  { stepName: 'Em andamento', statusKey: 'em_andamento', kind: 'work' },
  { stepName: 'Finalizado', statusKey: 'finalizado', kind: 'final' },
];

const FIELDS_MANUTENCAO: VersionFieldDef[] = [
  {
    id: 'nome_sobrenome',
    label: 'Nome e Sobrenome',
    type: 'text',
    required: true,
    order: 1,
    placeholder: 'Insira nome e sobrenome',
  },
  {
    id: 'setor_area',
    label: 'Setor/Área',
    type: 'text',
    required: true,
    order: 2,
    placeholder: 'Insira seu Setor/Área',
  },
  {
    id: 'impacto',
    label: 'Nível de criticidade',
    type: 'select',
    required: true,
    order: 3,
    placeholder: 'Insira o nível de criticidade',
    options: IMPACTO_OPTIONS,
  },
  {
    id: 'descricao_detalhada',
    label: 'Descrição detalhada',
    type: 'textarea',
    required: true,
    order: 4,
    placeholder: 'Descreva a solicitação com máximo de detalhes possível',
  },
  {
    id: 'centro_custo',
    label: 'Qual o centro de custo?',
    type: 'select',
    required: true,
    order: 5,
    placeholder: 'Insira o centro de custo',
    options: CENTRO_CUSTO_OPTIONS,
  },
  {
    id: 'email',
    label: 'E-mail - Corporativo',
    type: 'text',
    required: true,
    order: 6,
    placeholder: 'Insira seu e-mail corporativo',
  },
];

const FIELDS_SUPRIMENTOS: VersionFieldDef[] = [
  {
    id: 'nome_sobrenome',
    label: 'Nome e Sobrenome',
    type: 'text',
    required: true,
    order: 1,
    placeholder: 'Insira nome e sobrenome',
  },
  {
    id: 'email',
    label: 'E-mail - Corporativo',
    type: 'text',
    required: true,
    order: 2,
    placeholder: 'Insira seu e-mail corporativo',
  },
  {
    id: 'setor_area',
    label: 'Setor/Área',
    type: 'text',
    required: true,
    order: 3,
    placeholder: 'Insira seu Setor/Área',
  },
  {
    id: 'impacto',
    label: 'Nível de criticidade',
    type: 'select',
    required: true,
    order: 4,
    placeholder: 'Insira o nível de criticidade',
    options: IMPACTO_OPTIONS,
  },
  {
    id: 'anexo_planilha',
    label: 'Anexo da planilha de suprimentos',
    type: 'file',
    required: true,
    order: 5,
    placeholder: 'Anexo da planilha de suprimentos',
  },
  {
    id: 'observacoes',
    label: 'Observações Adicionais',
    type: 'textarea',
    required: false,
    order: 6,
    placeholder: 'Informações complementares sobre a solicitação',
  },
  {
    id: 'centro_custo',
    label: 'Qual seu centro de custo?',
    type: 'select',
    required: false,
    order: 7,
    placeholder: 'Insira o centro de custo',
    options: CENTRO_CUSTO_OPTIONS,
  },
];

const FIELDS_COMPRAS: VersionFieldDef[] = [
  {
    id: 'centro_custo',
    label: 'Centro de custos',
    type: 'select',
    required: true,
    order: 1,
    placeholder: 'Informe o centro de custo responsável',
    options: CENTRO_CUSTO_OPTIONS,
  },
  {
    id: 'nome_sobrenome',
    label: 'Nome e Sobrenome',
    type: 'text',
    required: true,
    order: 2,
    placeholder: 'Insira nome e sobrenome',
  },
  {
    id: 'email',
    label: 'E-mail - Corporativo',
    type: 'text',
    required: true,
    order: 3,
    placeholder: 'Insira seu e-mail corporativo',
  },
  {
    id: 'item_compra',
    label: 'O que precisa ser comprado?',
    type: 'textarea',
    required: true,
    order: 4,
    placeholder: 'Descreva o item com detalhes (marca, modelo, especificações)',
  },
  {
    id: 'quantidade',
    label: 'Quantidade',
    type: 'text',
    required: true,
    order: 5,
    placeholder: 'Número de unidades',
  },
  {
    id: 'motivo',
    label: 'Motivo da compra',
    type: 'textarea',
    required: true,
    order: 6,
    placeholder: 'Justifique a necessidade desta compra',
  },
  {
    id: 'link_produto',
    label: 'Link do produto',
    type: 'text',
    required: true,
    order: 7,
    placeholder: 'Cole aqui o link de referência do produto',
  },
  {
    id: 'anexos',
    label: 'Anexos complementares',
    type: 'file',
    required: false,
    order: 8,
    placeholder: '',
  },
  {
    id: 'impacto',
    label: 'Nível de criticidade',
    type: 'select',
    required: true,
    order: 9,
    placeholder: 'Insira o nível de criticidade',
    options: IMPACTO_OPTIONS,
  },
];

const ALLOWED_SUPRIMENTOS = [
  'BCS2',
  'DLE',
  'DG',
  'FPA2',
  'FP2',
  'GSB',
  'LGN',
  'LPM',
  'LFD3',
  'MVS2',
  'PCM',
  'RNF2',
  'SDC2',
  'TFBS2',
  'FFS',
  'FLM',
  'GJO',
  'IBP',
  'MRG',
  'MPO',
  'RDM',
  'SCL',
  'SZH',
  'TAA',
  'VAL',
  'LBC2',
  'DFZ2',
  'SMO2',
  'HSM',
  'RLF',
  'JRC',
  'GOC',
  'LHG',
  'MRR2',
  'MEJ2',
];

const ALLOWED_COMPRAS = [
  'BCS2',
  'DLE',
  'DG',
  'FPA2',
  'FP2',
  'GSB',
  'LGN',
  'LBC2',
  'LPM',
  'LFD3',
  'MVS2',
  'PCM',
  'RNF2',
  'SDC2',
  'TFBS2',
  'FFS',
  'FLM',
  'GJO',
  'IBP',
  'MRG',
  'MPO',
  'RDM',
  'SCL',
  'SZH',
  'TAA',
  'VAL',
  'SMO2',
  'HSM',
  'DFZ2',
  'BFG2',
  'JPU',
  'DFA',
  'MEM2',
  'MVT',
  'LHG',
  'RLF',
  'JRC',
  'GOC',
  'PIS',
  'MEJ2',
];

interface StepPayload {
  stepId: string;
  stepName: string;
  statusKey: string;
  kind: StepKind;
}

interface WorkflowSeed {
  workflowTypeId: string;
  name: string;
  description: string;
  icon: string;
  allowedUserIds: string[];
  fields: VersionFieldDef[];
}

const WORKFLOW_SEEDS: WorkflowSeed[] = [
  {
    workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
    name: 'Manutenção / Solicitações Gerais',
    description:
      'Solicitação para serviços administrativos gerais, incluindo manutenções, reparos e demandas internas.\n\nPara compras/solicitações de equipamentos de Tecnologia (TI), navegue até o menu “TI” e faça a solicitação.',
    icon: 'Settings',
    allowedUserIds: ['all'],
    fields: FIELDS_MANUTENCAO,
  },
  {
    workflowTypeId: 'facilities_solicitacao_suprimentos',
    name: 'Solicitação de Suprimentos',
    description:
      'Solicitação de materiais de escritório e suprimentos administrativos. \n\nUtilize a planilha padrão para listar os itens necessários [clique aqui](https://drive.google.com/uc?export=download&id=1LWt8orhux7IS4d4UNkjZocE9PzSECJJu)\n',
    icon: 'Package',
    allowedUserIds: ALLOWED_SUPRIMENTOS,
    fields: FIELDS_SUPRIMENTOS,
  },
  {
    workflowTypeId: 'facilities_solicitacao_compras',
    name: 'Solicitação de Compras',
    description:
      'Solicitação para aquisição de materiais e equipamentos, incluindo compras gerais. \n\nPara compras de equipamentos de Tecnologia (TI), navegue até o menu “TI” e faça a solicitação.',
    icon: 'ShoppingCart',
    allowedUserIds: ALLOWED_COMPRAS,
    fields: FIELDS_COMPRAS,
  },
];

function buildSteps(): StepPayload[] {
  return CANONICAL_STEPS.map((step) => ({
    stepId: generateStepId(),
    stepName: step.stepName,
    statusKey: step.statusKey,
    kind: step.kind,
  }));
}

function buildTypePayload(params: {
  workflowTypeId: string;
  name: string;
  description: string;
  icon: string;
  allowedUserIds: string[];
}): Record<string, unknown> {
  const now = Timestamp.now();

  return {
    workflowTypeId: params.workflowTypeId,
    name: params.name,
    description: params.description,
    icon: params.icon,
    areaId: FACILITIES_FASE1_AREA_ID,
    ownerEmail: FACILITIES_FASE1_OWNER_EMAIL,
    ownerUserId: FACILITIES_FASE1_OWNER_USER_ID,
    allowedUserIds: params.allowedUserIds,
    active: true,
    latestPublishedVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
}

function buildVersionPayload(params: {
  workflowTypeId: string;
  fields: VersionFieldDef[];
  steps: StepPayload[];
}): Record<string, unknown> {
  const initialStep = params.steps.find((step) => step.kind === 'start');

  if (!initialStep) {
    throw new Error(`Workflow "${params.workflowTypeId}" nao possui etapa inicial canonica.`);
  }

  const stepsById: Record<string, StepPayload> = {};
  const stepOrder: string[] = [];

  for (const step of params.steps) {
    stepsById[step.stepId] = step;
    stepOrder.push(step.stepId);
  }

  return {
    workflowTypeId: params.workflowTypeId,
    version: 1,
    state: 'published',
    ownerEmailAtPublish: FACILITIES_FASE1_OWNER_EMAIL,
    defaultSlaDays: FACILITIES_FASE1_DEFAULT_SLA_DAYS,
    fields: params.fields,
    initialStepId: initialStep.stepId,
    stepOrder,
    stepsById,
    publishedAt: Timestamp.now(),
  };
}

export function buildSeedPayloads(): Array<{
  workflowTypeId: string;
  typePayload: Record<string, unknown>;
  versionPayload: Record<string, unknown>;
}> {
  return WORKFLOW_SEEDS.map((seed) => {
    const steps = buildSteps();

    return {
      workflowTypeId: seed.workflowTypeId,
      typePayload: buildTypePayload(seed),
      versionPayload: buildVersionPayload({
        workflowTypeId: seed.workflowTypeId,
        fields: seed.fields,
        steps,
      }),
    };
  });
}
