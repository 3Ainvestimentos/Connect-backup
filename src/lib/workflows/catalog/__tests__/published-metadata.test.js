/** @jest-environment node */

jest.mock('@/lib/workflows/runtime/use-cases/resolve-published-version', () => ({
  resolvePublishedVersion: jest.fn(),
}));

const { resolvePublishedVersion } = require('@/lib/workflows/runtime/use-cases/resolve-published-version');
const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { getPublishedWorkflowMetadata } = require('@/lib/workflows/catalog/published-metadata');

function buildWorkflowType(overrides = {}) {
  return {
    workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
    name: 'Manutenção / Solicitações Gerais',
    description: 'Solicitação para serviços administrativos gerais.',
    icon: 'Settings',
    areaId: 'u3entfMNB17iklBOdq5H',
    ownerEmail: 'owner@3ariva.com.br',
    ownerUserId: 'SMO2',
    allowedUserIds: ['all'],
    active: true,
    latestPublishedVersion: 1,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function buildVersion(overrides = {}) {
  return {
    workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
    version: 1,
    state: 'published',
    ownerEmailAtPublish: 'owner@3ariva.com.br',
    defaultSlaDays: 5,
    publishedAt: { seconds: 1, nanoseconds: 0 },
    initialStepId: 'stp_open',
    fields: [
      {
        id: 'centro_custo',
        label: 'Centro de custo',
        type: 'select',
        required: true,
        order: 5,
        placeholder: 'Escolha o centro de custo',
        options: ['3ARI-Belo Horizonte', '3ARI-São Paulo'],
      },
      {
        id: 'impacto',
        label: 'Nível de criticidade',
        type: 'select',
        required: true,
        order: 3,
        placeholder: 'Insira o nível de criticidade',
        options: ['Baixo', 'Médio', 'Alto', 'Urgente (Crítico)'],
      },
      {
        id: 'nome_sobrenome',
        label: 'Nome e Sobrenome',
        type: 'text',
        required: true,
        order: 1,
        placeholder: 'Insira nome e sobrenome',
      },
      {
        id: 'anexos',
        label: 'Anexos complementares',
        type: 'file',
        required: false,
        order: 8,
        placeholder: '',
      },
    ],
    stepOrder: ['stp_open', 'stp_work', 'stp_final'],
    stepsById: {
      stp_open: {
        stepId: 'stp_open',
        stepName: 'Solicitação Aberta',
        statusKey: 'solicitacao_aberta',
        kind: 'start',
      },
      stp_work: {
        stepId: 'stp_work',
        stepName: 'Em andamento',
        statusKey: 'em_andamento',
        kind: 'work',
      },
      stp_final: {
        stepId: 'stp_final',
        stepName: 'Finalizado',
        statusKey: 'finalizado',
        kind: 'final',
      },
    },
    ...overrides,
  };
}

describe('published workflow metadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('monta o DTO publico com fields ordenados e steps derivados do stepOrder', async () => {
    resolvePublishedVersion.mockResolvedValue({
      workflowType: buildWorkflowType(),
      version: buildVersion(),
    });

    const result = await getPublishedWorkflowMetadata({
      workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
      actorUserId: 'REQ1',
    });

    expect(result).toEqual({
      workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
      workflowName: 'Manutenção / Solicitações Gerais',
      description: 'Solicitação para serviços administrativos gerais.',
      icon: 'Settings',
      areaId: 'u3entfMNB17iklBOdq5H',
      version: 1,
      publishedAt: { seconds: 1, nanoseconds: 0 },
      defaultSlaDays: 5,
      initialStepId: 'stp_open',
      initialStepName: 'Solicitação Aberta',
      fields: [
        expect.objectContaining({ id: 'nome_sobrenome', order: 1 }),
        expect.objectContaining({ id: 'impacto', order: 3 }),
        expect.objectContaining({ id: 'centro_custo', order: 5 }),
        expect.objectContaining({ id: 'anexos', order: 8 }),
      ],
      steps: [
        {
          stepId: 'stp_open',
          stepName: 'Solicitação Aberta',
          statusKey: 'solicitacao_aberta',
          kind: 'start',
          order: 1,
        },
        {
          stepId: 'stp_work',
          stepName: 'Em andamento',
          statusKey: 'em_andamento',
          kind: 'work',
          order: 2,
        },
        {
          stepId: 'stp_final',
          stepName: 'Finalizado',
          statusKey: 'finalizado',
          kind: 'final',
          order: 3,
        },
      ],
    });
    expect(result.fields[1].options).toEqual(['Baixo', 'Médio', 'Alto', 'Urgente (Crítico)']);
    expect(result.fields[3]).not.toHaveProperty('placeholder');
  });

  it('falha quando o workflowType existe mas esta inativo', async () => {
    resolvePublishedVersion.mockResolvedValue({
      workflowType: buildWorkflowType({ active: false }),
      version: buildVersion(),
    });

    await expect(
      getPublishedWorkflowMetadata({
        workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
        actorUserId: 'REQ1',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.WORKFLOW_TYPE_INACTIVE,
        httpStatus: 400,
      }),
    );
  });

  it('falha quando o ator nao esta autorizado a abrir o workflow', async () => {
    resolvePublishedVersion.mockResolvedValue({
      workflowType: buildWorkflowType({ allowedUserIds: ['SMO2', 'DLE'] }),
      version: buildVersion(),
    });

    await expect(
      getPublishedWorkflowMetadata({
        workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
        actorUserId: 'REQ1',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.FORBIDDEN,
        httpStatus: 403,
      }),
    );
  });

  it('falha com INVALID_PUBLISHED_VERSION quando initialStepId nao existe em stepsById', async () => {
    resolvePublishedVersion.mockResolvedValue({
      workflowType: buildWorkflowType(),
      version: buildVersion({ initialStepId: 'missing-step' }),
    });

    await expect(
      getPublishedWorkflowMetadata({
        workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
        actorUserId: 'REQ1',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
        httpStatus: 500,
      }),
    );
  });

  it('propaga INVALID_PUBLISHED_VERSION com status 400 quando a versao resolvida nao esta publicada', async () => {
    resolvePublishedVersion.mockRejectedValue(
      new RuntimeError(
        RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
        'Versao 1 do tipo "facilities_manutencao_solicitacoes_gerais" nao esta publicada (state=draft).',
        400,
      ),
    );

    await expect(
      getPublishedWorkflowMetadata({
        workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
        actorUserId: 'REQ1',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
        httpStatus: 400,
      }),
    );
  });

  it('falha com INVALID_PUBLISHED_VERSION quando stepOrder referencia step ausente', async () => {
    resolvePublishedVersion.mockResolvedValue({
      workflowType: buildWorkflowType(),
      version: buildVersion({
        stepOrder: ['stp_open', 'missing-step', 'stp_final'],
      }),
    });

    await expect(
      getPublishedWorkflowMetadata({
        workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
        actorUserId: 'REQ1',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
        httpStatus: 500,
      }),
    );
  });
});
