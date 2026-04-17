import { buildManagementRequestDetailFixture } from './request-detail-test-data';
import { buildRequestOperationalViewModel } from '../request-detail-view-model';

describe('buildRequestOperationalViewModel', () => {
  it('prioritizes respondAction when the actor must answer the current action', () => {
    const result = buildRequestOperationalViewModel(
      buildManagementRequestDetailFixture({
        permissions: {
          canAdvance: true,
          canFinalize: true,
          canRequestAction: true,
          canRespondAction: true,
        },
        action: {
          canRespond: true,
          state: 'pending',
        },
      }),
    );

    expect(result.tone).toBe('respond-action');
    expect(result.highlightLabel).toBe('Voce precisa agir agora');
    expect(result.statusNote).toContain('continuidade oficial');
    expect(result.showActionZoneAsPrimary).toBe(true);
    expect(result.primaryAction).toBeNull();
  });

  it('keeps completed action batches secondary when advance is available', () => {
    const result = buildRequestOperationalViewModel(
      buildManagementRequestDetailFixture({
        permissions: {
          canAdvance: true,
        },
        action: {
          state: 'completed',
          completedAt: new Date('2026-04-02T12:00:00Z'),
        },
      }),
    );

    expect(result.tone).toBe('ready-to-advance');
    expect(result.showActionZoneAsPrimary).toBe(false);
    expect(result.statusNote).toContain('action atual ja foi concluida');
    expect(result.primaryAction).toEqual({
      kind: 'advance',
      label: 'Avancar etapa',
      busyLabel: 'Avancando...',
    });
  });

  it('returns finalize as the body-first CTA when only canFinalize is true', () => {
    const result = buildRequestOperationalViewModel(
      buildManagementRequestDetailFixture({
        permissions: {
          canFinalize: true,
        },
      }),
    );

    expect(result.tone).toBe('ready-to-finalize');
    expect(result.statusNote).toContain('A finalizacao encerra o fluxo operacional');
    expect(result.primaryAction).toEqual({
      kind: 'finalize',
      label: 'Finalizar chamado',
      busyLabel: 'Finalizando...',
    });
  });

  it('keeps the action zone visible for requestAction scenarios', () => {
    const result = buildRequestOperationalViewModel(
      buildManagementRequestDetailFixture({
        permissions: {
          canRequestAction: true,
        },
        action: {
          canRequest: true,
        },
      }),
    );

    expect(result.tone).toBe('request-action');
    expect(result.statusNote).toContain('Solicite a action');
    expect(result.showActionZoneAsPrimary).toBe(true);
    expect(result.shouldRenderActionZone).toBe(true);
  });

  it('returns finalized read-only copy when only archive remains available', () => {
    const result = buildRequestOperationalViewModel(
      buildManagementRequestDetailFixture({
        summary: {
          statusCategory: 'finalized',
          finalizedAt: new Date('2026-04-12T10:00:00Z'),
        },
        permissions: {
          canArchive: true,
        },
        action: {
          available: false,
        },
      }),
    );

    expect(result.tone).toBe('read-only');
    expect(result.title).toBe('Chamado concluido');
    expect(result.highlightLabel).toBe('Conclusao registrada');
    expect(result.statusNote).toContain('arquivamento');
    expect(result.primaryAction).toBeNull();
  });

  it('returns finalized read-only copy even when archiving is not allowed', () => {
    const result = buildRequestOperationalViewModel(
      buildManagementRequestDetailFixture({
        summary: {
          statusCategory: 'finalized',
          finalizedAt: new Date('2026-04-12T10:00:00Z'),
        },
        permissions: {
          canArchive: false,
        },
        action: {
          available: false,
        },
      }),
    );

    expect(result.tone).toBe('read-only');
    expect(result.title).toBe('Chamado concluido');
    expect(result.description).toContain('apenas para consulta');
    expect(result.statusNote).toContain('Nenhuma nova acao operacional');
    expect(result.primaryAction).toBeNull();
    expect(result.showActionZoneAsPrimary).toBe(false);
  });

  it('returns archived read-only copy without operational CTA', () => {
    const result = buildRequestOperationalViewModel(
      buildManagementRequestDetailFixture({
        summary: {
          statusCategory: 'archived',
          isArchived: true,
          archivedAt: new Date('2026-04-13T10:00:00Z'),
        },
        permissions: {
          canArchive: false,
        },
        action: {
          available: false,
        },
      }),
    );

    expect(result.tone).toBe('read-only');
    expect(result.title).toBe('Chamado arquivado');
    expect(result.description).toContain('apenas para consulta');
    expect(result.statusNote).toContain('Nenhum CTA operacional');
    expect(result.shouldRenderActionZone).toBe(false);
  });
});
