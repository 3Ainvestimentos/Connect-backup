import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OpenWorkflowCard } from '../OpenWorkflowCard';
import type { PilotWorkflowCatalog } from '@/lib/workflows/pilot/types';

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

const catalog: PilotWorkflowCatalog = {
  workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
  workflowName: 'Manutencao / Solicitacoes Gerais',
  description: 'Formulario dinamico do piloto.',
  icon: 'Building2',
  areaId: 'facilities',
  version: 1,
  publishedAt: new Date('2026-03-27T10:20:00.000Z'),
  defaultSlaDays: 3,
  initialStepId: 'step-1',
  initialStepName: 'Solicitacao Aberta',
  fields: [
    {
      id: 'nome_sobrenome',
      label: 'Nome completo',
      type: 'text',
      required: true,
      order: 1,
      placeholder: 'Digite seu nome',
    },
    {
      id: 'detalhes',
      label: 'Detalhes',
      type: 'textarea',
      required: true,
      order: 2,
    },
    {
      id: 'impacto',
      label: 'Impacto',
      type: 'select',
      required: true,
      order: 3,
      options: ['Baixo', 'Medio', 'Alto'],
    },
  ],
  steps: [
    {
      stepId: 'step-1',
      stepName: 'Solicitacao Aberta',
      statusKey: 'open',
      kind: 'start',
      order: 1,
    },
    {
      stepId: 'step-2',
      stepName: 'Em andamento',
      statusKey: 'in_progress',
      kind: 'work',
      order: 2,
    },
  ],
};

describe('OpenWorkflowCard', () => {
  it('renders fields from the published catalog and submits the workflow payload', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue({ requestId: 1001 });
    const uploadFile = jest.fn();

    render(
      <OpenWorkflowCard
        catalog={catalog}
        isLoading={false}
        isSubmitting={false}
        requesterName="Lucas"
        uploadFile={uploadFile}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('Nome completo *'), 'Lucas Nogueira');
    await user.type(screen.getByLabelText('Detalhes *'), 'Ar-condicionado sem funcionar.');

    await user.click(screen.getByRole('button', { name: 'Alto' }));
    await user.click(screen.getByRole('button', { name: 'Enviar solicitacao' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
        requesterName: 'Lucas',
        formData: {
          nome_sobrenome: 'Lucas Nogueira',
          detalhes: 'Ar-condicionado sem funcionar.',
          impacto: 'Alto',
        },
      });
    });

    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('uploads file fields before calling the runtime mutation', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue({ requestId: 1002 });
    const uploadFile = jest.fn().mockResolvedValue({
      fileUrl: 'https://storage.example.com/planilha.xlsx',
    });
    const fileCatalog: PilotWorkflowCatalog = {
      ...catalog,
      workflowTypeId: 'facilities_solicitacao_suprimentos',
      workflowName: 'Solicitacao de suprimentos',
      fields: [
        {
          id: 'descricao',
          label: 'Descricao',
          type: 'textarea',
          required: true,
          order: 1,
        },
        {
          id: 'anexo_planilha',
          label: 'Planilha',
          type: 'file',
          required: true,
          order: 2,
        },
      ],
    };
    const file = new File(['conteudo'], 'planilha.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    render(
      <OpenWorkflowCard
        catalog={fileCatalog}
        isLoading={false}
        isSubmitting={false}
        requesterName="Lucas"
        uploadFile={uploadFile}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('Descricao *'), 'Reposicao de insumos');
    await user.upload(screen.getByLabelText('Planilha *'), file);
    await user.click(screen.getByRole('button', { name: 'Enviar solicitacao' }));

    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalledWith({
        workflowTypeId: 'facilities_solicitacao_suprimentos',
        fieldId: 'anexo_planilha',
        file,
      });
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        workflowTypeId: 'facilities_solicitacao_suprimentos',
        requesterName: 'Lucas',
        formData: {
          descricao: 'Reposicao de insumos',
          anexo_planilha: 'https://storage.example.com/planilha.xlsx',
        },
      });
    });
  });

  it('resets the form when the active workflow changes', async () => {
    const user = userEvent.setup();
    const uploadFile = jest.fn().mockResolvedValue({
      fileUrl: 'https://storage.example.com/planilha.xlsx',
    });
    const fileCatalog: PilotWorkflowCatalog = {
      ...catalog,
      workflowTypeId: 'facilities_solicitacao_suprimentos',
      workflowName: 'Solicitacao de suprimentos',
      fields: [
        {
          id: 'anexo_planilha',
          label: 'Planilha',
          type: 'file',
          required: true,
          order: 1,
        },
      ],
    };
    const { rerender } = render(
      <OpenWorkflowCard
        catalog={fileCatalog}
        isLoading={false}
        isSubmitting={false}
        requesterName="Lucas"
        uploadFile={uploadFile}
        onSubmit={jest.fn().mockResolvedValue({ requestId: 1002 })}
      />,
    );
    const file = new File(['conteudo'], 'planilha.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await user.upload(screen.getByLabelText('Planilha *'), file);
    expect(screen.getByText('Arquivo selecionado: planilha.xlsx')).not.toBeNull();

    rerender(
      <OpenWorkflowCard
        catalog={catalog}
        isLoading={false}
        isSubmitting={false}
        requesterName="Lucas"
        uploadFile={uploadFile}
        onSubmit={jest.fn().mockResolvedValue({ requestId: 1003 })}
      />,
    );

    expect(screen.queryByText('Arquivo selecionado: planilha.xlsx')).toBeNull();
    expect((screen.getByLabelText('Nome completo *') as HTMLInputElement).value).toBe('');
  });
});
