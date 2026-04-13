import { NextResponse } from 'next/server';
import { authenticateWorkflowConfigAdmin } from '@/lib/workflows/admin-config/auth';
import { getAdminHistory } from '@/lib/workflows/admin-config/history-service';
import {
  ADMIN_HISTORY_ORIGINS,
  ADMIN_HISTORY_STATUS_CATEGORIES,
  type AdminHistoryFilters,
  type AdminHistoryListSuccess,
} from '@/lib/workflows/admin-config/history-types';
import { handleWorkflowConfigRouteError } from '@/lib/workflows/admin-config/route-helpers';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';

function parseOptionalString(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function parseDateOnly(value: string | null, fieldName: string): string | undefined {
  if (!value) {
    return undefined;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_DRAFT_PAYLOAD,
      `${fieldName} deve usar o formato YYYY-MM-DD.`,
      422,
    );
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_DRAFT_PAYLOAD,
      `${fieldName} deve usar o formato YYYY-MM-DD.`,
      422,
    );
  }

  return value;
}

function parseLimit(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 200) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_DRAFT_PAYLOAD,
      'limit deve ser um inteiro entre 1 e 200.',
      422,
    );
  }

  return parsed;
}

function parseFilters(url: URL): AdminHistoryFilters {
  const origin = parseOptionalString(url.searchParams.get('origin'));
  const statusCategory = parseOptionalString(url.searchParams.get('statusCategory'));
  const filters: AdminHistoryFilters = {
    origin: origin && ADMIN_HISTORY_ORIGINS.includes(origin as (typeof ADMIN_HISTORY_ORIGINS)[number])
      ? (origin as AdminHistoryFilters['origin'])
      : undefined,
    areaId: parseOptionalString(url.searchParams.get('areaId')),
    workflowTypeId: parseOptionalString(url.searchParams.get('workflowTypeId')),
    statusCategory:
      statusCategory &&
      ADMIN_HISTORY_STATUS_CATEGORIES.includes(
        statusCategory as (typeof ADMIN_HISTORY_STATUS_CATEGORIES)[number],
      )
        ? (statusCategory as AdminHistoryFilters['statusCategory'])
        : undefined,
    ownerUserId: parseOptionalString(url.searchParams.get('ownerUserId')),
    periodFrom: parseDateOnly(url.searchParams.get('periodFrom'), 'periodFrom'),
    periodTo: parseDateOnly(url.searchParams.get('periodTo'), 'periodTo'),
    query: parseOptionalString(url.searchParams.get('query')),
    limit: parseLimit(url.searchParams.get('limit')),
  };

  if (origin && !filters.origin) {
    throw new RuntimeError(RuntimeErrorCode.INVALID_DRAFT_PAYLOAD, 'origin invalido.', 422);
  }

  if (statusCategory && !filters.statusCategory) {
    throw new RuntimeError(RuntimeErrorCode.INVALID_DRAFT_PAYLOAD, 'statusCategory invalido.', 422);
  }

  if (filters.periodFrom && filters.periodTo && filters.periodFrom > filters.periodTo) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_DRAFT_PAYLOAD,
      'periodFrom nao pode ser maior que periodTo.',
      422,
    );
  }

  return filters;
}

export async function GET(request: Request) {
  try {
    await authenticateWorkflowConfigAdmin(request);
    const data = await getAdminHistory(parseFilters(new URL(request.url)));

    const response: AdminHistoryListSuccess = {
      ok: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleWorkflowConfigRouteError('GET /api/admin/request-config/history', error);
  }
}
