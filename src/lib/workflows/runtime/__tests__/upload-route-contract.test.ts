/** @jest-environment node */

export {};

jest.mock('@/lib/workflows/runtime/auth-helpers', () => ({
  authenticateRuntimeActor: jest.fn(),
}));

jest.mock('@/lib/workflows/runtime/use-cases/init-file-upload', () => ({
  initFileUpload: jest.fn(),
}));

const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { authenticateRuntimeActor } = require('@/lib/workflows/runtime/auth-helpers');
const { initFileUpload } = require('@/lib/workflows/runtime/use-cases/init-file-upload');
const { POST } = require('@/app/api/workflows/runtime/uploads/route');

function buildActor() {
  return {
    actorUserId: 'REQ1',
    actorName: 'Requester',
    actorEmail: 'requester@3ariva.com.br',
    collaboratorDocId: 'collab-1',
  };
}

function buildSignedPayload(overrides = {}) {
  return {
    uploadUrl: 'https://storage.googleapis.com/upload-signed',
    uploadMethod: 'PUT',
    uploadHeaders: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'x-goog-meta-firebaseStorageDownloadTokens': 'token-123',
    },
    fileUrl: 'https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/path?alt=media&token=token-123',
    storagePath:
      'Workflows/workflows_v2/uploads/form_field/facilities_solicitacao_suprimentos/anexo_planilha/2026-03/upl_123-Controle.xlsx',
    uploadId: 'upl_123',
    expiresAt: '2026-03-30T14:10:00.000Z',
    ...overrides,
  };
}

describe('workflow upload API contract', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    authenticateRuntimeActor.mockResolvedValue({
      decodedToken: { uid: 'firebase-uid-1' },
      actor: buildActor(),
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('retorna envelope canonico de sucesso e repassa actorUserId ao use case', async () => {
    initFileUpload.mockResolvedValue(buildSignedPayload());

    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/uploads', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: 'form_field',
          workflowTypeId: 'facilities_solicitacao_suprimentos',
          fieldId: 'anexo_planilha',
          fileName: 'Controle.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: expect.objectContaining({
        uploadMethod: 'PUT',
        uploadId: 'upl_123',
      }),
    });
    expect(initFileUpload).toHaveBeenCalledWith({
      target: 'form_field',
      actorUserId: 'REQ1',
      workflowTypeId: 'facilities_solicitacao_suprimentos',
      fieldId: 'anexo_planilha',
      fileName: 'Controle.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  });

  it('retorna 401 quando a autenticacao falha antes de assinar o upload', async () => {
    authenticateRuntimeActor.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );

    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/uploads', {
        method: 'POST',
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.UNAUTHORIZED,
      message: 'Token nao fornecido.',
    });
    expect(initFileUpload).not.toHaveBeenCalled();
  });

  it('retorna 400 quando o body JSON e invalido', async () => {
    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/uploads', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        body: '{"workflowTypeId"',
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.INVALID_UPLOAD_REQUEST,
      message: 'Body de upload invalido.',
    });
    expect(initFileUpload).not.toHaveBeenCalled();
  });

  it('retorna 403 quando o ator nao pode abrir o workflow', async () => {
    initFileUpload.mockRejectedValue(
      new RuntimeError(
        RuntimeErrorCode.FORBIDDEN,
        'Usuario nao possui permissao para abrir solicitacoes neste tipo de workflow.',
        403,
      ),
    );

    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/uploads', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: 'form_field',
          workflowTypeId: 'facilities_solicitacao_suprimentos',
          fieldId: 'anexo_planilha',
          fileName: 'Controle.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.FORBIDDEN,
      message: 'Usuario nao possui permissao para abrir solicitacoes neste tipo de workflow.',
    });
  });

  it('retorna 400 quando o fieldId nao suporta upload na versao publicada', async () => {
    initFileUpload.mockRejectedValue(
      new RuntimeError(
        RuntimeErrorCode.INVALID_UPLOAD_TARGET,
        'Campo de upload invalido para a versao publicada.',
        400,
      ),
    );

    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/uploads', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: 'form_field',
          workflowTypeId: 'facilities_solicitacao_suprimentos',
          fieldId: 'nome_sobrenome',
          fileName: 'Controle.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.INVALID_UPLOAD_TARGET,
      message: 'Campo de upload invalido para a versao publicada.',
    });
  });

  it('retorna envelope canonico de INTERNAL_ERROR para falhas inesperadas', async () => {
    initFileUpload.mockRejectedValue(new Error('storage timeout'));

    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/uploads', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: 'form_field',
          workflowTypeId: 'facilities_solicitacao_suprimentos',
          fieldId: 'anexo_planilha',
          fileName: 'Controle.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor.',
    });
  });

  it('aceita action_response e repassa requestId ao use case', async () => {
    initFileUpload.mockResolvedValue(buildSignedPayload());

    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/uploads', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: 'action_response',
          requestId: 812,
          fileName: 'Comprovante.pdf',
          contentType: 'application/pdf',
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(initFileUpload).toHaveBeenCalledWith({
      target: 'action_response',
      actorUserId: 'REQ1',
      requestId: 812,
      fileName: 'Comprovante.pdf',
      contentType: 'application/pdf',
    });
  });

  it('rejeita target de upload invalido', async () => {
    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/uploads', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: 'Controle.xlsx',
          contentType: 'application/pdf',
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.INVALID_UPLOAD_TARGET,
      message: 'Target de upload invalido.',
    });
    expect(initFileUpload).not.toHaveBeenCalled();
  });
});
