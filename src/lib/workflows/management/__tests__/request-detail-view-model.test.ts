import { buildManagementRequestDetailFixture } from './request-detail-test-data';
import {
  buildRequestDetailShellViewModel,
  buildRequestOperationalViewModel,
} from '../request-detail-view-model';

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
    expect(result.title).toBe('Sua resposta está pendente');
    expect(result.contextLine).toContain('liberar a continuidade oficial');
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
    expect(result.contextLine).toContain('já foi concluída');
    expect(result.informationalState).toEqual({
      label: 'Action da etapa',
      value: 'Concluída',
    });
    expect(result.primaryAction).toEqual({
      kind: 'advance',
      label: 'Avançar etapa',
      busyLabel: 'Avançando...',
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
    expect(result.contextLine).toContain('pode ser encerrado oficialmente');
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
    expect(result.title).toBe('Solicitação de action disponível');
    expect(result.shouldRenderOperationalSummary).toBe(true);
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
    expect(result.title).toBe('Chamado concluído');
    expect(result.contextLine).toContain('ações administrativas autorizadas');
    expect(result.informationalState).toEqual({
      label: 'Próximo passo',
      value: 'Arquive apenas quando precisar retirar o chamado da fila ativa.',
    });
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
    expect(result.title).toBe('Chamado concluído');
    expect(result.contextLine).toContain('apenas para consulta');
    expect(result.informationalState).toEqual({
      label: 'Status',
      value: 'Consulta apenas',
    });
    expect(result.primaryAction).toBeNull();
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
    expect(result.contextLine).toContain('apenas para consulta');
    expect(result.informationalState).toEqual({
      label: 'Status',
      value: 'Arquivado',
    });
    expect(result.shouldRenderOperationalSummary).toBe(true);
  });

  it('derives friendly request recipients for the shell view model', () => {
    const result = buildRequestDetailShellViewModel(
      buildManagementRequestDetailFixture({
        permissions: {
          canRequestAction: true,
        },
        action: {
          canRequest: true,
          recipients: [
            {
              actionRequestId: 'act_req_1',
              recipientUserId: 'RESP1',
              status: 'pending',
              respondedAt: null,
              respondedByUserId: null,
              respondedByName: null,
            },
            {
              actionRequestId: 'act_req_2',
              recipientUserId: 'RESP2',
              status: 'pending',
              respondedAt: null,
              respondedByUserId: null,
              respondedByName: null,
            },
          ],
        },
      }),
      [
        { id3a: 'RESP1', name: 'Responsável 1' },
        { id3a: 'RESP2', name: 'Responsável 2' },
      ],
    );

    expect(result.operational.requestTargetRecipients).toEqual(['Responsável 1', 'Responsável 2']);
    expect(result.currentAction.priority).toBe('action');
  });
});
