/**
 * @fileOverview GET /api/workflows/requester/catalog
 *
 * Returns the requester catalog grouped by area,
 * filtered by active workflows with published versions
 * and accessible to the authenticated user.
 */

import { NextResponse } from 'next/server';
import { authenticateRequesterV2Actor } from '@/lib/workflows/runtime/permission-auth';
import { buildRequesterCatalog } from '@/lib/workflows/requester/build-catalog';
import { RuntimeError } from '@/lib/workflows/runtime/errors';
import type { RequesterCatalogArea } from '@/lib/workflows/requester/catalog-types';

export async function GET(request: Request) {
  try {
    const { actor } = await authenticateRequesterV2Actor(request);

    const data = await buildRequesterCatalog(actor.actorUserId);

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.httpStatus },
      );
    }

    console.error('[GET /api/workflows/requester/catalog] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
