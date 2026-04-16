import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { WorkflowDraftStepsSection } from '../WorkflowDraftStepsSection';
import type { WorkflowDraftFormValues } from '../types';

jest.mock('lucide-react', () => {
  const Icon = () => <svg />;
  return new Proxy(
    {},
    {
      get: () => Icon,
    },
  );
});

jest.mock('@/components/ui/select', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
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
        role: 'option',
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

jest.mock('../WorkflowActionApproverPicker', () => ({
  WorkflowActionApproverPicker: () => <div>Approver picker</div>,
}));

const collaborators = [
  {
    collaboratorDocId: 'collab-apr1',
    userId: 'APR1',
    name: 'Ana Paula',
    email: 'ana.paula@3ariva.com.br',
    area: 'Facilities',
  },
];

function buildDefaultValues(): WorkflowDraftFormValues {
  return {
    general: {
      name: '',
      description: '',
      icon: 'FileText',
      areaId: '',
      areaName: '',
      ownerEmail: '',
      ownerUserId: '',
      defaultSlaDays: 0,
      activeOnPublish: true,
    },
    access: {
      mode: 'all',
      allowedUserIds: ['all'],
      preview: '',
    },
    fields: [],
    steps: [
      {
        stepId: 'review',
        stepName: 'Revisao',
        statusKey: 'em_revisao',
        kind: 'work',
        action: {
          type: 'approval',
          label: 'Aprovar',
          approvers: [],
          unresolvedApproverIds: [],
          commentRequired: false,
          attachmentRequired: false,
          commentPlaceholder: '',
          attachmentPlaceholder: '',
        },
      },
    ],
  };
}

function renderSection(readOnly = false) {
  function ActionTypeValue() {
    const type = useWatch<WorkflowDraftFormValues>({
      name: 'steps.0.action.type',
    }) as string | undefined;
    const label = useWatch<WorkflowDraftFormValues>({
      name: 'steps.0.action.label',
    }) as string | undefined;

    return (
      <>
        <div data-testid="action-type">{type}</div>
        <div data-testid="action-label">{label}</div>
      </>
    );
  }

  function Harness() {
    const form = useForm<WorkflowDraftFormValues>({
      defaultValues: buildDefaultValues(),
    });

    return (
      <FormProvider {...form}>
        <WorkflowDraftStepsSection collaborators={collaborators} readOnly={readOnly} />
        <ActionTypeValue />
      </FormProvider>
    );
  }

  return render(<Harness />);
}

describe('WorkflowDraftStepsSection', () => {
  it('shows PT-BR labels and preserves the internal action type value', async () => {
    const user = userEvent.setup();

    renderSection();

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'Aprovação' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Ciência' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Execução' })).toBeTruthy();

    await user.click(screen.getByRole('option', { name: 'Ciência' }));

    expect(screen.getByTestId('action-type')).toHaveTextContent('acknowledgement');
  });

  it('uses the friendly default label when creating an action from none', async () => {
    const user = userEvent.setup();

    function Harness() {
      const form = useForm<WorkflowDraftFormValues>({
        defaultValues: {
          ...buildDefaultValues(),
          steps: [
            {
              stepId: 'review',
              stepName: 'Revisao',
              statusKey: 'em_revisao',
              kind: 'work',
              action: undefined,
            },
          ],
        },
      });
      const label = useWatch<WorkflowDraftFormValues>({
        control: form.control,
        name: 'steps.0.action.label',
      });

      return (
        <FormProvider {...form}>
          <WorkflowDraftStepsSection collaborators={collaborators} />
          <div data-testid="action-label">{String(label ?? '')}</div>
        </FormProvider>
      );
    }

    render(<Harness />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Aprovação' }));

    expect(screen.getByTestId('action-label')).toHaveTextContent('Ação');
  });

  it('keeps the footer CTA disabled in read-only mode', () => {
    renderSection(true);

    expect(screen.getByRole('button', { name: /Adicionar etapa/i })).toBeDisabled();
  });
});
