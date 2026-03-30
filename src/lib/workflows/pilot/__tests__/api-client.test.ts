import {
  PilotApiError,
  authenticatedWorkflowFetch,
  getPilotCatalog,
  putFileToSignedUrl,
  requestPilotUpload,
  uploadPilotFile,
} from '../api-client';
import { PilotFileTransferError } from '../types';

describe('workflow pilot api client', () => {
  const user = {
    getIdToken: jest.fn().mockResolvedValue('token-123'),
  } as any;

  afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as { fetch?: typeof fetch }).fetch;
  });

  it('returns normalized catalog data from the canonical envelope', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: {
          workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
          workflowName: 'Solicitacoes Gerais',
          description: 'Descricao',
          icon: 'Building2',
          areaId: 'facilities',
          version: 2,
          publishedAt: { seconds: 1_774_606_800, nanoseconds: 0 },
          defaultSlaDays: 3,
          initialStepId: 'step-1',
          initialStepName: 'Solicitacao Aberta',
          fields: [],
          steps: [],
        },
      }),
    } as Response) as typeof fetch;

    await expect(
      getPilotCatalog(user, 'facilities_manutencao_solicitacoes_gerais'),
    ).resolves.toMatchObject({
      workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
      version: 2,
      publishedAt: new Date('2026-03-27T10:20:00.000Z'),
    });
  });

  it('preserves backend code and http status in typed errors', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        ok: false,
        code: 'FORBIDDEN',
        message: 'Acesso negado.',
      }),
    } as Response) as typeof fetch;

    await expect(authenticatedWorkflowFetch(user, '/api/test')).rejects.toEqual(
      expect.objectContaining<PilotApiError>({
        name: 'PilotApiError',
        code: 'FORBIDDEN',
        httpStatus: 403,
        message: 'Acesso negado.',
      }),
    );
  });

  it('normalizes the signed upload init payload from the canonical envelope', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: {
          uploadUrl: 'https://storage.googleapis.com/upload-signed',
          uploadMethod: 'PUT',
          uploadHeaders: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'x-goog-meta-firebaseStorageDownloadTokens': 'token-123',
          },
          fileUrl: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/file?alt=media&token=token-123',
          storagePath:
            'Workflows/Facilities e Suprimentos/workflows_v2/preopen/facilities_solicitacao_suprimentos/anexo_planilha/2026-03/upl_123-Controle.xlsx',
          uploadId: 'upl_123',
          expiresAt: '2026-03-30T14:10:00.000Z',
        },
      }),
    } as Response) as typeof fetch;

    await expect(
      requestPilotUpload(user, {
        workflowTypeId: 'facilities_solicitacao_suprimentos',
        fieldId: 'anexo_planilha',
        fileName: 'Controle.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    ).resolves.toEqual({
      uploadUrl: 'https://storage.googleapis.com/upload-signed',
      uploadMethod: 'PUT',
      uploadHeaders: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'x-goog-meta-firebaseStorageDownloadTokens': 'token-123',
      },
      fileUrl: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/file?alt=media&token=token-123',
      storagePath:
        'Workflows/Facilities e Suprimentos/workflows_v2/preopen/facilities_solicitacao_suprimentos/anexo_planilha/2026-03/upl_123-Controle.xlsx',
      uploadId: 'upl_123',
      expiresAt: '2026-03-30T14:10:00.000Z',
    });
  });

  it('uploads the blob to the signed URL before returning fileUrl', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          data: {
            uploadUrl: 'https://storage.googleapis.com/upload-signed',
            uploadMethod: 'PUT',
            uploadHeaders: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'x-goog-meta-firebaseStorageDownloadTokens': 'token-123',
            },
            fileUrl:
              'https://firebasestorage.googleapis.com/v0/b/bucket/o/file?alt=media&token=token-123',
            storagePath:
              'Workflows/Facilities e Suprimentos/workflows_v2/preopen/facilities_solicitacao_suprimentos/anexo_planilha/2026-03/upl_123-Controle.xlsx',
            uploadId: 'upl_123',
            expiresAt: '2026-03-30T14:10:00.000Z',
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response) as typeof fetch;

    const file = new File(['conteudo'], 'Controle.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await expect(
      uploadPilotFile(user, {
        workflowTypeId: 'facilities_solicitacao_suprimentos',
        fieldId: 'anexo_planilha',
        file,
      }),
    ).resolves.toEqual({
      fileUrl: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/file?alt=media&token=token-123',
    });

    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      '/api/workflows/runtime/uploads',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      'https://storage.googleapis.com/upload-signed',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'x-goog-meta-firebaseStorageDownloadTokens': 'token-123',
        },
        body: file,
      }),
    );
  });

  it('preserves signature failures as PilotApiError', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        ok: false,
        code: 'FORBIDDEN',
        message: 'Acesso negado.',
      }),
    } as Response) as typeof fetch;

    const file = new File(['conteudo'], 'Controle.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await expect(
      uploadPilotFile(user, {
        workflowTypeId: 'facilities_solicitacao_suprimentos',
        fieldId: 'anexo_planilha',
        file,
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'PilotApiError',
        code: 'FORBIDDEN',
        httpStatus: 403,
      }),
    );
  });

  it('raises a typed transfer error when the PUT to the signed URL fails', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
    } as Response) as typeof fetch;

    await expect(
      putFileToSignedUrl(
        'https://storage.googleapis.com/upload-signed',
        { 'Content-Type': 'application/octet-stream' },
        new Blob(['conteudo']),
      ),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'PilotFileTransferError',
        code: 'UPLOAD_TRANSFER_FAILED',
        httpStatus: 502,
      }),
    );
  });
});
