import type { WorkflowRequest, WorkflowHistoryLog } from '@/contexts/WorkflowsContext';
import type { WorkflowDefinition, WorkflowStatusDefinition, FormFieldDefinition, SlaRule } from '@/contexts/ApplicationsContext';
import type { WorkflowArea } from '@/contexts/WorkflowAreasContext';

export const mockHistory: WorkflowHistoryLog[] = [
  {
    timestamp: '2026-04-01T10:00:00.000Z',
    status: 'pending',
    userId: 'user001',
    userName: 'Joao Silva',
  },
  {
    timestamp: '2026-04-02T14:30:00.000Z',
    status: 'in_progress',
    userId: 'user002',
    userName: 'Maria Santos',
    notes: 'Solicitacao em analise',
  },
];

export const mockLegacyRequest: WorkflowRequest = {
  id: 'legacy-req-001',
  requestId: '0001',
  type: 'vacation_request',
  status: 'in_progress',
  ownerEmail: 'owner@3ainvestimentos.com.br',
  submittedBy: {
    userId: 'user001',
    userName: 'Joao Silva',
    userEmail: 'joao@3ainvestimentos.com.br',
  },
  submittedAt: '2026-04-01T10:00:00.000Z',
  lastUpdatedAt: '2026-04-02T14:30:00.000Z',
  formData: {
    start_date: '2026-05-01',
    end_date: '2026-05-10',
    reason: 'Ferias anuais',
    attachment: 'https://storage.example.com/file.pdf',
  },
  history: mockHistory,
  viewedBy: ['user002'],
  assignee: {
    id: 'user002',
    name: 'Maria Santos',
  },
};

export const mockWorkflowDefinition: WorkflowDefinition = {
  id: 'def-vacation',
  name: 'vacation_request',
  description: 'Solicitacao de ferias',
  icon: 'calendar',
  areaId: 'area-hr',
  ownerEmail: 'hr@3ainvestimentos.com.br',
  defaultSlaDays: 5,
  slaRules: [
    { field: 'urgency', value: 'high', days: 2 } as SlaRule,
  ],
  fields: [
    { id: 'start_date', label: 'Data de Inicio', type: 'date', required: true } as FormFieldDefinition,
    { id: 'end_date', label: 'Data de Fim', type: 'date', required: true } as FormFieldDefinition,
    { id: 'reason', label: 'Motivo', type: 'textarea', required: false } as FormFieldDefinition,
    { id: 'attachment', label: 'Anexo', type: 'file', required: false } as FormFieldDefinition,
  ],
  routingRules: [],
  statuses: [
    { id: 'pending', label: 'Pendente' } as WorkflowStatusDefinition,
    { id: 'in_progress', label: 'Em Andamento' } as WorkflowStatusDefinition,
    { id: 'approved', label: 'Aprovado' } as WorkflowStatusDefinition,
    { id: 'rejected', label: 'Reprovado' } as WorkflowStatusDefinition,
  ],
};

export const mockWorkflowArea: WorkflowArea = {
  id: 'area-hr',
  name: 'Recursos Humanos',
  icon: 'users',
  storageFolderPath: 'hr-docs',
};

export const mockLegacyRequestNoFormData: WorkflowRequest = {
  id: 'legacy-req-002',
  requestId: '0002',
  type: 'unknown_type',
  status: 'pending',
  ownerEmail: 'owner@3ainvestimentos.com.br',
  submittedBy: {
    userId: 'user003',
    userName: 'Pedro Costa',
    userEmail: 'pedro@3ainvestimentos.com.br',
  },
  submittedAt: '2026-04-03T08:00:00.000Z',
  lastUpdatedAt: '2026-04-03T08:00:00.000Z',
  formData: {},
  history: [],
  viewedBy: [],
};
