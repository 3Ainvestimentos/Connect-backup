/**
 * @fileOverview Runtime error codes and a typed error class for the v2 workflow engine.
 */

export const RuntimeErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  WORKFLOW_TYPE_INACTIVE: 'WORKFLOW_TYPE_INACTIVE',
  PUBLISHED_VERSION_NOT_FOUND: 'PUBLISHED_VERSION_NOT_FOUND',
  INVALID_PUBLISHED_VERSION: 'INVALID_PUBLISHED_VERSION',
  INVALID_FORM_DATA: 'INVALID_FORM_DATA',
  COUNTER_NOT_INITIALIZED: 'COUNTER_NOT_INITIALIZED',
  INVALID_REQUEST_COUNTER: 'INVALID_REQUEST_COUNTER',
  REQUEST_NOT_FOUND: 'REQUEST_NOT_FOUND',
  REQUEST_ALREADY_ARCHIVED: 'REQUEST_ALREADY_ARCHIVED',
  REQUEST_ALREADY_FINALIZED: 'REQUEST_ALREADY_FINALIZED',
  FINALIZATION_NOT_ALLOWED: 'FINALIZATION_NOT_ALLOWED',
  INVALID_RESPONSIBLE: 'INVALID_RESPONSIBLE',
  INVALID_STEP_TRANSITION: 'INVALID_STEP_TRANSITION',
} as const;

export type RuntimeErrorCodeValue = (typeof RuntimeErrorCode)[keyof typeof RuntimeErrorCode];

/**
 * A domain-specific error that carries a machine-readable `code` and an HTTP status.
 */
export class RuntimeError extends Error {
  public readonly code: RuntimeErrorCodeValue;
  public readonly httpStatus: number;

  constructor(code: RuntimeErrorCodeValue, message: string, httpStatus = 400) {
    super(message);
    this.name = 'RuntimeError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

/** Map common error codes to HTTP status codes. */
export function httpStatusForCode(code: RuntimeErrorCodeValue): number {
  switch (code) {
    case RuntimeErrorCode.UNAUTHORIZED:
      return 401;
    case RuntimeErrorCode.FORBIDDEN:
      return 403;
    case RuntimeErrorCode.REQUEST_NOT_FOUND:
    case RuntimeErrorCode.PUBLISHED_VERSION_NOT_FOUND:
      return 404;
    case RuntimeErrorCode.COUNTER_NOT_INITIALIZED:
    case RuntimeErrorCode.INVALID_REQUEST_COUNTER:
      return 500;
    default:
      return 400;
  }
}
