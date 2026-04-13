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
  stepStrategy: 'preserve_legacy',
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

  it('colapsa o caminho canonico para 3 etapas fixas', () => {
    const normalized = normalizeStatuses(
      {
        ...baseEntry,
        workflowTypeId: 'workflow_canonico',
        stepStrategy: 'canonical_3_steps',
      },
      [
        { id: 'solicitacao_aberta', label: 'Solicitacao aberta' },
        { id: 'em_triagem', label: 'Em triagem' },
        { id: 'em_execucao', label: 'Em execucao' },
        { id: 'finalizado', label: 'Finalizado' },
      ],
    );

    const steps = normalized.stepOrder.map((stepId) => normalized.stepsById[stepId]);

    expect(steps).toHaveLength(3);
    expect(steps.map((step) => step.statusKey)).toEqual([
      'solicitacao_aberta',
      'em_andamento',
      'finalizado',
    ]);
    expect(steps.map((step) => step.kind)).toEqual(['start', 'work', 'final']);
    expect(normalized.sanitizations).toContain(
      'status.strategy applied: canonical_3_steps (4 -> 3)',
    );
  });

  it('bloqueia caminho canonico quando ha action no legado', () => {
    expect(() =>
      normalizeStatuses(
        {
          ...baseEntry,
          workflowTypeId: 'workflow_canonico_com_action',
          stepStrategy: 'canonical_3_steps',
        },
        [
          { id: 'solicitacao_aberta', label: 'Solicitacao aberta' },
          {
            id: 'em_analise',
            label: 'Em analise',
            action: { type: 'acknowledgement', label: 'Responder' },
          },
          { id: 'finalizado', label: 'Finalizado' },
        ],
      ),
    ).toThrow('nao pode preservar status.action');
  });

  it('bloqueia caminho canonico quando ha statusIdOverrides', () => {
    expect(() =>
      normalizeStatuses(
        {
          ...baseEntry,
          workflowTypeId: 'workflow_canonico_com_override',
          stepStrategy: 'canonical_3_steps',
          statusIdOverrides: {
            em_analise: ['em_analise_1', 'em_analise_2'],
          },
        },
        [
          { id: 'solicitacao_aberta', label: 'Solicitacao aberta' },
          { id: 'em_analise', label: 'Em analise' },
          { id: 'finalizado', label: 'Finalizado' },
        ],
      ),
    ).toThrow('nao pode declarar statusIdOverrides');
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
