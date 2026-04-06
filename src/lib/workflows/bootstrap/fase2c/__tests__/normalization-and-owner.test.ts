/** @jest-environment node */

import { normalizeFields } from '@/lib/workflows/bootstrap/fase2c/shared/field-normalization';
import { resolveOwner } from '@/lib/workflows/bootstrap/fase2c/shared/owner-resolution';
import { normalizeStatuses } from '@/lib/workflows/bootstrap/fase2c/shared/status-normalization';
import type { Fase2cManifestEntry } from '@/lib/workflows/bootstrap/fase2c/shared/types';

const baseEntry: Fase2cManifestEntry = {
  legacyWorkflowId: 'legacy-1',
  workflowTypeId: 'workflow_teste',
  lotId: 'lote_01_governanca_financeiro',
  lotStatus: 'enabled',
};

describe('fase2c normalization and owner resolution', () => {
  it('falha quando field.id duplicado nao possui override explicito', () => {
    expect(() =>
      normalizeFields(baseEntry, [
        {
          id: 'email',
          label: 'E-mail',
          type: 'text',
          required: true,
          options: [],
        },
        {
          id: 'email',
          label: 'Outro E-mail',
          type: 'text',
          required: true,
          options: [],
        },
      ]),
    ).toThrow('Duplicidade de field.id sem cobertura de override');
  });

  it('falha quando status.id duplicado nao possui override explicito', () => {
    expect(() =>
      normalizeStatuses(baseEntry, [
        { id: 'em_analise', label: 'Em analise' },
        { id: 'em_analise', label: 'Em analise 2' },
      ]),
    ).toThrow('Duplicidade de status.id sem cobertura de override');
  });

  it('exige owner univoco quando nao ha ownerUserIdOverride', () => {
    expect(() =>
      resolveOwner(
        baseEntry,
        'owner@3ariva.com.br',
        [
          { email: 'owner@3ainvestimentos.com.br', id3a: 'OWN1' },
          { email: 'owner@3ariva.com.br', id3a: 'OWN2' },
        ],
      ),
    ).toThrow('esperava 1 colaborador');
  });

  it('aceita ownerUserIdOverride quando a resolucao por email nao e suficiente', () => {
    const resolved = resolveOwner(
      {
        ...baseEntry,
        ownerUserIdOverride: 'OVR1',
      },
      'owner@3ariva.com.br',
      [],
    );

    expect(resolved).toEqual({
      ownerEmailLegacy: 'owner@3ariva.com.br',
      ownerEmailResolved: 'owner@3ainvestimentos.com.br',
      ownerUserId: 'OVR1',
      resolutionMode: 'owner_user_id_override',
    });
  });
});

