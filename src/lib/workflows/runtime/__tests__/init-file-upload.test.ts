/** @jest-environment node */

export {};

jest.mock('@/lib/workflows/runtime/use-cases/resolve-published-version', () => ({
  resolvePublishedVersion: jest.fn(),
}));

jest.mock('@/lib/workflows/runtime/upload-storage', () => ({
  createSignedWorkflowUpload: jest.fn(),
}));

const { resolvePublishedVersion } = require('@/lib/workflows/runtime/use-cases/resolve-published-version');
const { createSignedWorkflowUpload } = require('@/lib/workflows/runtime/upload-storage');
const { RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { initFileUpload } = require('@/lib/workflows/runtime/use-cases/init-file-upload');

function buildWorkflowType(overrides = {}) {
  return {
    workflowTypeId: 'facilities_solicitacao_suprimentos',
    name: 'Solicitacao de Suprimentos',
    description: 'Descricao',
    icon: 'ClipboardList',
    areaId: 'facilities',
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
    workflowTypeId: 'facilities_solicitacao_suprimentos',
    version: 1,
    state: 'published',
    ownerEmailAtPublish: 'owner@3ariva.com.br',
    defaultSlaDays: 5,
    publishedAt: { seconds: 1, nanoseconds: 0 },
    initialStepId: 'stp_open',
    fields: [
      {
        id: 'nome_sobrenome',
        label: 'Nome e Sobrenome',
        type: 'text',
        required: true,
        order: 1,
      },
      {
        id: 'anexo_planilha',
        label: 'Anexo',
        type: 'file',
        required: true,
        order: 2,
      },
    ],
    stepOrder: ['stp_open', 'stp_final'],
    stepsById: {
      stp_open: {
        stepId: 'stp_open',
        stepName: 'Solicitação Aberta',
        statusKey: 'solicitacao_aberta',
        kind: 'start',
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

describe('initFileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('valida workflow/campo file e delega a assinatura ao storage helper', async () => {
    resolvePublishedVersion.mockResolvedValue({
      workflowType: buildWorkflowType(),
      version: buildVersion(),
    });
    createSignedWorkflowUpload.mockResolvedValue({
      uploadUrl: 'https://storage.googleapis.com/upload-signed',
      uploadMethod: 'PUT',
      uploadHeaders: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      fileUrl: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/file',
      storagePath: 'Workflows/Facilities e Suprimentos/workflows_v2/preopen/facilities_solicitacao_suprimentos/anexo_planilha/2026-03/upl-file.xlsx',
      uploadId: 'upl_123',
      expiresAt: '2026-03-30T14:10:00.000Z',
    });

    await expect(
      initFileUpload({
        actorUserId: 'REQ1',
        workflowTypeId: 'facilities_solicitacao_suprimentos',
        fieldId: 'anexo_planilha',
        fileName: 'Controle.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        uploadMethod: 'PUT',
        uploadId: 'upl_123',
      }),
    );

    expect(resolvePublishedVersion).toHaveBeenCalledWith('facilities_solicitacao_suprimentos');
    expect(createSignedWorkflowUpload).toHaveBeenCalledWith({
      actorUserId: 'REQ1',
      workflowTypeId: 'facilities_solicitacao_suprimentos',
      fieldId: 'anexo_planilha',
      fileName: 'Controle.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  });

  it('rejeita fieldId inexistente na versao publicada', async () => {
    resolvePublishedVersion.mockResolvedValue({
      workflowType: buildWorkflowType(),
      version: buildVersion(),
    });

    await expect(
      initFileUpload({
        actorUserId: 'REQ1',
        workflowTypeId: 'facilities_solicitacao_suprimentos',
        fieldId: 'campo_inexistente',
        fileName: 'Controle.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.INVALID_UPLOAD_TARGET,
        httpStatus: 400,
      }),
    );

    expect(createSignedWorkflowUpload).not.toHaveBeenCalled();
  });

  it('rejeita campo publicado que nao e do tipo file', async () => {
    resolvePublishedVersion.mockResolvedValue({
      workflowType: buildWorkflowType(),
      version: buildVersion({
        fields: [
          {
            id: 'anexo_planilha',
            label: 'Anexo',
            type: 'text',
            required: true,
            order: 2,
          },
        ],
      }),
    });

    await expect(
      initFileUpload({
        actorUserId: 'REQ1',
        workflowTypeId: 'facilities_solicitacao_suprimentos',
        fieldId: 'anexo_planilha',
        fileName: 'Controle.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.INVALID_UPLOAD_TARGET,
        httpStatus: 400,
      }),
    );
  });

  it('rejeita metadata obrigatoria ausente antes de resolver o workflow', async () => {
    await expect(
      initFileUpload({
        actorUserId: 'REQ1',
        workflowTypeId: 'facilities_solicitacao_suprimentos',
        fieldId: 'anexo_planilha',
        fileName: '',
        contentType: '',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.INVALID_UPLOAD_REQUEST,
        httpStatus: 400,
      }),
    );

    expect(resolvePublishedVersion).not.toHaveBeenCalled();
    expect(createSignedWorkflowUpload).not.toHaveBeenCalled();
  });

  it('propaga FORBIDDEN quando o ator nao pode abrir o workflow', async () => {
    resolvePublishedVersion.mockResolvedValue({
      workflowType: buildWorkflowType({ allowedUserIds: ['SMO2'] }),
      version: buildVersion(),
    });

    await expect(
      initFileUpload({
        actorUserId: 'REQ1',
        workflowTypeId: 'facilities_solicitacao_suprimentos',
        fieldId: 'anexo_planilha',
        fileName: 'Controle.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.FORBIDDEN,
        httpStatus: 403,
      }),
    );

    expect(createSignedWorkflowUpload).not.toHaveBeenCalled();
  });
});
