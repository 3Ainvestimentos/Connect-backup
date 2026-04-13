/** @jest-environment node */

import { randomUUID } from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import {
  assertAllowedWorkflowUploadPath,
  assertAttachmentUrlMatchesStoragePath,
  assertUploadIdMatchesFileName,
  createSignedWorkflowUpload,
} from '@/lib/workflows/runtime/upload-storage';

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(),
}));

jest.mock('firebase-admin/storage', () => ({
  getStorage: jest.fn(),
}));

jest.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdminApp: jest.fn(),
}));

describe('upload-storage', () => {
  const originalEnv = process.env;
  const getSignedUrl = jest.fn();
  const file = { getSignedUrl };
  const bucket = {
    name: 'a-riva-hub.firebasestorage.app',
    file: jest.fn(() => file),
  };
  const storage = {
    bucket: jest.fn(() => bucket),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'a-riva-hub.firebasestorage.app',
    };

    jest.mocked(randomUUID)
      .mockReturnValueOnce('9b8d0d3a-1111-2222-3333-444444444444' as ReturnType<typeof randomUUID>)
      .mockReturnValueOnce(
        'download-token-1234-5678-9abc-def012345678' as ReturnType<typeof randomUUID>,
      );
    jest.mocked(getFirebaseAdminApp).mockReturnValue({ options: {} } as never);
    jest.mocked(getStorage).mockReturnValue(storage as never);
    getSignedUrl.mockResolvedValue(['https://storage.googleapis.com/upload-signed']);
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.useFakeTimers().setSystemTime(new Date('2026-03-30T14:00:00.000Z'));
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('gera signed upload com path, headers e fileUrl coerentes', async () => {
    const result = await createSignedWorkflowUpload({
      target: 'form_field',
      workflowTypeId: 'facilities_solicitacao_suprimentos',
      fieldId: 'anexo_planilha',
      actorUserId: 'LGN',
      fileName: 'Controle/..Suprimentos.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    expect(storage.bucket).toHaveBeenCalledWith('a-riva-hub.firebasestorage.app');
    expect(bucket.file).toHaveBeenCalledWith(
      'Workflows/workflows_v2/uploads/form_field/facilities_solicitacao_suprimentos/anexo_planilha/2026-03/upl_9b8d0d3a-1111-2222-3333-444444444444-Controle___Suprimentos.xlsx',
    );
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 'v4',
        action: 'write',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extensionHeaders: expect.objectContaining({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'x-goog-meta-firebaseStorageDownloadTokens': 'download-token-1234-5678-9abc-def012345678',
          'x-goog-meta-uploadid': 'upl_9b8d0d3a-1111-2222-3333-444444444444',
          'x-goog-meta-target': 'form_field',
          'x-goog-meta-workflowtypeid': 'facilities_solicitacao_suprimentos',
          'x-goog-meta-fieldid': 'anexo_planilha',
          'x-goog-meta-actoruserid': 'LGN',
        }),
      }),
    );
    expect(result).toEqual({
      uploadUrl: 'https://storage.googleapis.com/upload-signed',
      uploadMethod: 'PUT',
      uploadHeaders: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'x-goog-meta-firebaseStorageDownloadTokens': 'download-token-1234-5678-9abc-def012345678',
        'x-goog-meta-uploadid': 'upl_9b8d0d3a-1111-2222-3333-444444444444',
        'x-goog-meta-target': 'form_field',
        'x-goog-meta-workflowtypeid': 'facilities_solicitacao_suprimentos',
        'x-goog-meta-fieldid': 'anexo_planilha',
        'x-goog-meta-actoruserid': 'LGN',
      },
      fileUrl:
        'https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Workflows%2Fworkflows_v2%2Fuploads%2Fform_field%2Ffacilities_solicitacao_suprimentos%2Fanexo_planilha%2F2026-03%2Fupl_9b8d0d3a-1111-2222-3333-444444444444-Controle___Suprimentos.xlsx?alt=media&token=download-token-1234-5678-9abc-def012345678',
      storagePath:
        'Workflows/workflows_v2/uploads/form_field/facilities_solicitacao_suprimentos/anexo_planilha/2026-03/upl_9b8d0d3a-1111-2222-3333-444444444444-Controle___Suprimentos.xlsx',
      uploadId: 'upl_9b8d0d3a-1111-2222-3333-444444444444',
      expiresAt: '2026-03-30T14:10:00.000Z',
    });
    expect(result.storagePath).not.toContain('Facilities e Suprimentos');
  });

  it('gera signed upload de action_response no namespace neutro', async () => {
    const result = await createSignedWorkflowUpload({
      target: 'action_response',
      workflowTypeId: 'financeiro_reembolsos',
      requestId: 812,
      stepId: 'execucao',
      actorUserId: 'RESP1',
      fileName: 'Comprovante.pdf',
      contentType: 'application/pdf',
    });

    expect(bucket.file).toHaveBeenCalledWith(
      'Workflows/workflows_v2/uploads/action_response/financeiro_reembolsos/request_812/execucao/2026-03/upl_9b8d0d3a-1111-2222-3333-444444444444-Comprovante.pdf',
    );
    expect(result.storagePath).toBe(
      'Workflows/workflows_v2/uploads/action_response/financeiro_reembolsos/request_812/execucao/2026-03/upl_9b8d0d3a-1111-2222-3333-444444444444-Comprovante.pdf',
    );
    expect(result.storagePath).not.toContain('Facilities e Suprimentos');
  });

  it('aceita path no namespace neutro oficial e preserva compatibilidade com legado', () => {
    expect(
      assertAllowedWorkflowUploadPath(
        'Workflows/workflows_v2/uploads/action_response/financeiro_reembolsos/request_812/execucao/2026-03/upl_abc-Comprovante.pdf',
      ),
    ).toBe(
      'Workflows/workflows_v2/uploads/action_response/financeiro_reembolsos/request_812/execucao/2026-03/upl_abc-Comprovante.pdf',
    );
    expect(
      assertAllowedWorkflowUploadPath(
        'Workflows/Facilities e Suprimentos/workflows_v2/preopen/legacy/file.pdf',
      ),
    ).toBe('Workflows/Facilities e Suprimentos/workflows_v2/preopen/legacy/file.pdf');
  });

  it('rejeita path fora do namespace oficial de uploads', () => {
    expect(() => assertAllowedWorkflowUploadPath('Workflows/outro_namespace/file.pdf')).toThrow(
      expect.objectContaining({
        code: RuntimeErrorCode.ACTION_RESPONSE_INVALID,
        httpStatus: 400,
      }),
    );
  });

  it('valida consistencia entre fileUrl e storagePath oficial', () => {
    expect(() =>
      assertAttachmentUrlMatchesStoragePath(
        'https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Workflows%2Fworkflows_v2%2Fuploads%2Faction_response%2Ffinanceiro_reembolsos%2Frequest_812%2Fexecucao%2F2026-03%2Fupl_abc-Comprovante.pdf?alt=media&token=123',
        'Workflows/workflows_v2/uploads/action_response/financeiro_reembolsos/request_812/execucao/2026-03/upl_abc-Comprovante.pdf',
      ),
    ).not.toThrow();

    expect(() =>
      assertAttachmentUrlMatchesStoragePath(
        'https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Workflows%2Fworkflows_v2%2Fuploads%2Faction_response%2Ffinanceiro_reembolsos%2Frequest_812%2Fexecucao%2F2026-03%2Fupl_wrong-Comprovante.pdf?alt=media&token=123',
        'Workflows/workflows_v2/uploads/action_response/financeiro_reembolsos/request_812/execucao/2026-03/upl_abc-Comprovante.pdf',
      ),
    ).toThrow(
      expect.objectContaining({
        code: RuntimeErrorCode.ACTION_RESPONSE_INVALID,
        httpStatus: 400,
      }),
    );
  });

  it('valida consistencia entre uploadId e nome do arquivo armazenado', () => {
    expect(
      assertUploadIdMatchesFileName(
        'upl_abc',
        'Workflows/workflows_v2/uploads/action_response/financeiro_reembolsos/request_812/execucao/2026-03/upl_abc-Comprovante.pdf',
      ),
    ).toBe('upl_abc');

    expect(() =>
      assertUploadIdMatchesFileName(
        'upl_xyz',
        'Workflows/workflows_v2/uploads/action_response/financeiro_reembolsos/request_812/execucao/2026-03/upl_abc-Comprovante.pdf',
      ),
    ).toThrow(
      expect.objectContaining({
        code: RuntimeErrorCode.ACTION_RESPONSE_INVALID,
        httpStatus: 400,
      }),
    );
  });

  it('falha com STORAGE_NOT_CONFIGURED quando o bucket nao esta configurado', async () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    delete process.env.FIREBASE_STORAGE_BUCKET;

    await expect(
      createSignedWorkflowUpload({
        target: 'form_field',
        workflowTypeId: 'facilities_solicitacao_suprimentos',
        fieldId: 'anexo_planilha',
        actorUserId: 'LGN',
        fileName: 'Controle.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.STORAGE_NOT_CONFIGURED,
        httpStatus: 500,
      }),
    );
  });

  it('mapeia falha do signed URL para UPLOAD_SIGNATURE_FAILED', async () => {
    getSignedUrl.mockRejectedValue(new Error('signBlob denied'));

    await expect(
      createSignedWorkflowUpload({
        target: 'form_field',
        workflowTypeId: 'facilities_solicitacao_suprimentos',
        fieldId: 'anexo_planilha',
        actorUserId: 'LGN',
        fileName: 'Controle.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.UPLOAD_SIGNATURE_FAILED,
        httpStatus: 500,
      }),
    );
  });
});
