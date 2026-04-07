export type WorkflowUploadInitInput =
  | {
      target: 'form_field';
      workflowTypeId: string;
      fieldId: string;
      fileName: string;
      contentType: string;
    }
  | {
      target: 'action_response';
      requestId: number;
      fileName: string;
      contentType: string;
    };

export type WorkflowUploadInitResult = {
  uploadUrl: string;
  uploadMethod: 'PUT';
  uploadHeaders: Record<string, string>;
  fileUrl: string;
  storagePath: string;
  uploadId: string;
  expiresAt: string;
};

export type WorkflowUploadFileInput = {
  workflowTypeId: string;
  fieldId: string;
  file: File;
};

export type WorkflowActionResponseUploadFileInput = {
  requestId: number;
  file: File;
};

export type WorkflowUploadFileResult = {
  fileUrl: string;
  storagePath: string;
  uploadId?: string;
  fileName: string;
  contentType: string;
};

export class WorkflowUploadRequestError extends Error {
  code: string;
  httpStatus: number;

  constructor(code: string, message: string, httpStatus: number) {
    super(message);
    this.name = 'WorkflowUploadRequestError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export type WorkflowFileTransferErrorCode = 'UPLOAD_TRANSFER_FAILED';

export class WorkflowFileTransferError extends Error {
  code: WorkflowFileTransferErrorCode;
  httpStatus: number;

  constructor(
    code: WorkflowFileTransferErrorCode,
    httpStatus: number,
    message = 'Falha ao transferir arquivo para o Storage.',
  ) {
    super(message);
    this.name = 'WorkflowFileTransferError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}
