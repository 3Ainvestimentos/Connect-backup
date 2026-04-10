import type { User } from 'firebase/auth';
import type { WorkflowPublishedMetadata } from '@/lib/workflows/catalog/types';
import type {
  RequesterCatalogArea,
  OpenRequesterWorkflowInput,
  OpenRequesterWorkflowResult,
} from './catalog-types';
import type { WorkflowGroupedReadData, WorkflowRequestDetailData } from '@/lib/workflows/read/types';

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiError = {
  ok: false;
  code?: string;
  message?: string;
};

type ApiEnvelope<T> = ApiSuccess<T> | ApiError;

export class RequesterApiError extends Error {
  code: string;
  httpStatus: number;

  constructor(code: string, message: string, httpStatus: number) {
    super(message);
    this.name = 'RequesterApiError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

async function authenticatedFetch<T>(
  user: User,
  input: string,
  init?: RequestInit,
): Promise<T> {
  const token = await user.getIdToken();
  const headers = new Headers(init?.headers);

  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(input, {
    ...init,
    headers,
    cache: 'no-store',
  });

  let payload: ApiEnvelope<T> | null = null;

  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch (error) {
    if (!response.ok) {
      throw new RequesterApiError(
        'UNKNOWN_ERROR',
        'Falha ao consumir API de solicitacoes.',
        response.status,
      );
    }

    throw error;
  }

  if (!response.ok || !payload || payload.ok !== true) {
    const errorPayload = (payload ?? {}) as ApiError;
    throw new RequesterApiError(
      errorPayload.code ?? 'UNKNOWN_ERROR',
      errorPayload.message ?? 'Falha ao consumir API de solicitacoes.',
      response.status,
    );
  }

  return payload.data;
}

export async function fetchRequesterCatalog(user: User): Promise<RequesterCatalogArea[]> {
  const data = await authenticatedFetch<unknown>(user, '/api/workflows/requester/catalog');
  return data as RequesterCatalogArea[];
}

export async function fetchPublishedWorkflow(
  user: User,
  workflowTypeId: string,
): Promise<WorkflowPublishedMetadata> {
  const data = await authenticatedFetch<unknown>(
    user,
    `/api/workflows/catalog/${encodeURIComponent(workflowTypeId)}`,
  );
  return data as WorkflowPublishedMetadata;
}

export async function openRequesterWorkflow(
  user: User,
  payload: OpenRequesterWorkflowInput,
): Promise<OpenRequesterWorkflowResult> {
  const data = await authenticatedFetch<unknown>(user, '/api/workflows/runtime/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data as OpenRequesterWorkflowResult;
}

export async function fetchMyRequests(user: User): Promise<WorkflowGroupedReadData> {
  const data = await authenticatedFetch<unknown>(user, '/api/workflows/read/mine');
  return data as WorkflowGroupedReadData;
}

export async function fetchRequestDetail(
  user: User,
  requestId: number,
): Promise<WorkflowRequestDetailData> {
  const data = await authenticatedFetch<unknown>(
    user,
    `/api/workflows/read/requests/${requestId}`,
  );
  return data as WorkflowRequestDetailData;
}
