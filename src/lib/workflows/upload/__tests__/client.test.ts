import {
  putFileToSignedUrl,
  requestWorkflowFileUpload,
  uploadWorkflowFile,
} from '../client';

describe('workflow upload client', () => {
  const user = {
    getIdToken: jest.fn().mockResolvedValue('token-123'),
  } as any;

  afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as { fetch?: typeof fetch }).fetch;
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
      requestWorkflowFileUpload(user, {
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
      uploadWorkflowFile(user, {
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

  it('preserves request failures as WorkflowUploadRequestError', async () => {
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
      uploadWorkflowFile(user, {
        workflowTypeId: 'facilities_solicitacao_suprimentos',
        fieldId: 'anexo_planilha',
        file,
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'WorkflowUploadRequestError',
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
        name: 'WorkflowFileTransferError',
        code: 'UPLOAD_TRANSFER_FAILED',
        httpStatus: 502,
      }),
    );
  });
});
