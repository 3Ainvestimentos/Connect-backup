import { derivePilotRequestPresentation } from '../presentation';
import type { PilotRequestSummary } from '../types';

const baseRequest: PilotRequestSummary = {
  docId: 'doc-1',
  requestId: 101,
  workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
  workflowVersion: 1,
  workflowName: 'Solicitacoes Gerais',
  areaId: 'facilities',
  ownerEmail: 'owner@example.com',
  ownerUserId: 'owner-1',
  requesterUserId: 'requester-1',
  requesterName: 'Solicitante',
  responsibleUserId: null,
  responsibleName: null,
  currentStepId: 'step-1',
  currentStepName: 'Solicitacao Aberta',
  currentStatusKey: 'open',
  statusCategory: 'open',
  hasResponsible: false,
  hasPendingActions: false,
  pendingActionRecipientIds: [],
  pendingActionTypes: [],
  operationalParticipantIds: [],
  slaDays: 3,
  expectedCompletionAt: null,
  lastUpdatedAt: new Date('2026-03-27T10:20:00.000Z'),
  finalizedAt: null,
  closedAt: null,
  archivedAt: null,
  submittedAt: new Date('2026-03-27T10:20:00.000Z'),
  submittedMonthKey: '2026-03',
  closedMonthKey: null,
  isArchived: false,
};

describe('derivePilotRequestPresentation', () => {
  it('marks open items without responsible as awaiting assignment for the owner', () => {
    expect(derivePilotRequestPresentation(baseRequest, 'owner-1')).toMatchObject({
      situationKey: 'awaiting_assignment',
      label: 'Aguardando atribuicao',
      canAssign: true,
      canFinalize: false,
    });
  });

  it('allows finalize for responsible users when item is in progress', () => {
    expect(
      derivePilotRequestPresentation(
        {
          ...baseRequest,
          responsibleUserId: 'resp-1',
          responsibleName: 'Responsavel',
          hasResponsible: true,
          statusCategory: 'in_progress',
        },
        'resp-1',
      ),
    ).toMatchObject({
      situationKey: 'in_progress',
      label: 'Em andamento',
      canFinalize: true,
      canArchive: false,
    });
  });

  it('allows archive for finalized items owned by the actor', () => {
    expect(
      derivePilotRequestPresentation(
        {
          ...baseRequest,
          statusCategory: 'finalized',
        },
        'owner-1',
      ),
    ).toMatchObject({
      situationKey: 'finalized',
      label: 'Concluido',
      canArchive: true,
      canFinalize: false,
    });
  });

  it('allows finalize for owners when item is waiting action', () => {
    expect(
      derivePilotRequestPresentation(
        {
          ...baseRequest,
          responsibleUserId: 'resp-1',
          responsibleName: 'Responsavel',
          hasResponsible: true,
          statusCategory: 'waiting_action',
        },
        'owner-1',
      ),
    ).toMatchObject({
      situationKey: 'waiting_action',
      label: 'Aguardando acao',
      canFinalize: true,
      canArchive: false,
    });
  });

  it('allows finalize for responsible users when item is waiting action', () => {
    expect(
      derivePilotRequestPresentation(
        {
          ...baseRequest,
          responsibleUserId: 'resp-1',
          responsibleName: 'Responsavel',
          hasResponsible: true,
          statusCategory: 'waiting_action',
        },
        'resp-1',
      ),
    ).toMatchObject({
      situationKey: 'waiting_action',
      label: 'Aguardando acao',
      canFinalize: true,
      canArchive: false,
    });
  });

  it('keeps finalize disabled for unrelated actors when item is waiting action', () => {
    expect(
      derivePilotRequestPresentation(
        {
          ...baseRequest,
          responsibleUserId: 'resp-1',
          responsibleName: 'Responsavel',
          hasResponsible: true,
          statusCategory: 'waiting_action',
        },
        'other-user',
      ),
    ).toMatchObject({
      situationKey: 'waiting_action',
      label: 'Aguardando acao',
      canFinalize: false,
      canArchive: false,
    });
  });
});
