import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestDetailsDialog } from '../RequestDetailsDialog';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import type { PilotRequestSummary } from '@/lib/workflows/pilot/types';

jest.mock('lucide-react', () => {
  const ReactModule = require('react');
  const Icon = ReactModule.forwardRef((props: Record<string, unknown>, ref: unknown) =>
    ReactModule.createElement('svg', { ...props, ref }),
  );

  Icon.displayName = 'LucideIcon';

  return {
    __esModule: true,
    Building2: Icon,
    Check: Icon,
    ChevronDown: Icon,
    ChevronUp: Icon,
    X: Icon,
  };
});

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
    configurable: true,
    value: () => false,
  });
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: () => undefined,
  });
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: () => undefined,
  });
});

jest.mock('@/components/ui/select', () => {
  const ReactModule = require('react');
  const SelectContext = ReactModule.createContext({
    value: '',
    onValueChange: (_value: string) => {},
  });

  function Select({
    value = '',
    onValueChange,
    children,
  }: {
    value?: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
  }) {
    return ReactModule.createElement(
      SelectContext.Provider,
      { value: { value, onValueChange } },
      children,
    );
  }

  function SelectTrigger(props: Record<string, unknown>) {
    return ReactModule.createElement('button', { type: 'button', role: 'combobox', ...props });
  }

  function SelectValue({ placeholder }: { placeholder?: string }) {
    const context = ReactModule.useContext(SelectContext);
    return ReactModule.createElement('span', null, context.value || placeholder || '');
  }

  function SelectContent({ children }: { children: React.ReactNode }) {
    return ReactModule.createElement('div', null, children);
  }

  function SelectItem({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) {
    const context = ReactModule.useContext(SelectContext);
    return ReactModule.createElement(
      'button',
      {
        type: 'button',
        onClick: () => context.onValueChange(value),
      },
      children,
    );
  }

  return {
    __esModule: true,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
  };
});

const collaborators: Collaborator[] = [
  {
    id: '1',
    id3a: 'owner-1',
    name: 'Owner',
    email: 'owner@example.com',
    axis: 'Ops',
    area: 'Facilities',
    position: 'Owner',
    segment: 'Ops',
    leader: 'Leader',
    city: 'Sao Paulo',
    permissions: {
      canManageWorkflows: false,
      canManageRequests: true,
      canManageContent: false,
      canManageTripsBirthdays: false,
      canViewTasks: false,
      canViewBI: false,
      canViewRankings: false,
      canViewCRM: false,
      canViewStrategicPanel: false,
      canViewOpportunityMap: false,
      canViewMeetAnalyses: false,
      canViewDirectoria: false,
      canViewBILeaders: false,
    },
  },
  {
    id: '2',
    id3a: 'resp-1',
    name: 'Maria Silva',
    email: 'maria@example.com',
    axis: 'Ops',
    area: 'Facilities',
    position: 'Analista',
    segment: 'Ops',
    leader: 'Leader',
    city: 'Sao Paulo',
    permissions: {
      canManageWorkflows: false,
      canManageRequests: false,
      canManageContent: false,
      canManageTripsBirthdays: false,
      canViewTasks: false,
      canViewBI: false,
      canViewRankings: false,
      canViewCRM: false,
      canViewStrategicPanel: false,
      canViewOpportunityMap: false,
      canViewMeetAnalyses: false,
      canViewDirectoria: false,
      canViewBILeaders: false,
    },
  },
];

const baseRequest: PilotRequestSummary = {
  docId: 'doc-1',
  requestId: 501,
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

describe('RequestDetailsDialog', () => {
  it('allows the owner to assign a responsible from the collaborator directory', async () => {
    const user = userEvent.setup();
    const onAssign = jest.fn().mockResolvedValue(undefined);

    render(
      <RequestDetailsDialog
        open
        request={baseRequest}
        actorUserId="owner-1"
        collaborators={collaborators}
        onOpenChange={jest.fn()}
        onAssign={onAssign}
        onFinalize={jest.fn().mockResolvedValue(undefined)}
        onArchive={jest.fn().mockResolvedValue(undefined)}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Maria Silva' }));
    await user.click(screen.getByRole('button', { name: 'Atribuir responsavel' }));

    await waitFor(() => {
      expect(onAssign).toHaveBeenCalledWith({
        requestId: 501,
        responsibleUserId: 'resp-1',
        responsibleName: 'Maria Silva',
      });
    });
  });

  it('shows finalize for in-progress items assigned to the responsible', async () => {
    const user = userEvent.setup();
    const onFinalize = jest.fn().mockResolvedValue(undefined);

    render(
      <RequestDetailsDialog
        open
        request={{
          ...baseRequest,
          statusCategory: 'in_progress',
          responsibleUserId: 'resp-1',
          responsibleName: 'Maria Silva',
          hasResponsible: true,
          currentStepName: 'Em andamento',
        }}
        actorUserId="resp-1"
        collaborators={collaborators}
        onOpenChange={jest.fn()}
        onAssign={jest.fn().mockResolvedValue(undefined)}
        onFinalize={onFinalize}
        onArchive={jest.fn().mockResolvedValue(undefined)}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Finalizar' }));

    await waitFor(() => {
      expect(onFinalize).toHaveBeenCalledWith({ requestId: 501 });
    });
  });

  it('shows archive for finalized items owned by the actor', async () => {
    const user = userEvent.setup();
    const onArchive = jest.fn().mockResolvedValue(undefined);

    render(
      <RequestDetailsDialog
        open
        request={{
          ...baseRequest,
          statusCategory: 'finalized',
          currentStepName: 'Finalizado',
        }}
        actorUserId="owner-1"
        collaborators={collaborators}
        onOpenChange={jest.fn()}
        onAssign={jest.fn().mockResolvedValue(undefined)}
        onFinalize={jest.fn().mockResolvedValue(undefined)}
        onArchive={onArchive}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Arquivar' }));

    await waitFor(() => {
      expect(onArchive).toHaveBeenCalledWith({ requestId: 501 });
    });
  });
});
