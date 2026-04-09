import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@/contexts/AuthContext';
import type { WorkflowConfigCatalogData } from '@/lib/workflows/admin-config/types';
import { WorkflowConfigDefinitionsTab } from '../WorkflowConfigDefinitionsTab';

const pushMock = jest.fn();
const publishWorkflowVersion = jest.fn();
const activateWorkflowVersion = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

jest.mock('@/lib/workflows/admin-config/api-client', () => ({
  createWorkflowDraft: jest.fn(),
  publishWorkflowVersion: (...args: unknown[]) => publishWorkflowVersion(...args),
  activateWorkflowVersion: (...args: unknown[]) => activateWorkflowVersion(...args),
}));

jest.mock('../CreateWorkflowAreaDialog', () => ({
  CreateWorkflowAreaDialog: () => null,
}));

jest.mock('../CreateWorkflowTypeDialog', () => ({
  CreateWorkflowTypeDialog: () => null,
}));

jest.mock('lucide-react', () => {
  const Icon = () => <svg />;
  return new Proxy(
    {},
    {
      get: () => Icon,
    },
  );
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function buildCatalog(): WorkflowConfigCatalogData {
  return {
    areas: [
      {
        areaId: 'facilities',
        name: 'Facilities',
        icon: 'building-2',
        typeCount: 1,
        publishedTypeCount: 1,
        draftOnlyTypeCount: 0,
        types: [
          {
            workflowTypeId: 'facilities_manutencao',
            name: 'Manutencao',
            description: 'Chamados prediais.',
            areaId: 'facilities',
            ownerEmail: 'owner@3ariva.com.br',
            ownerUserId: 'SMO2',
            active: true,
            latestPublishedVersion: 2,
            versionCount: 3,
            publishedVersionLabel: 'v2 publicada',
            hasPublishedVersion: true,
            draftVersion: 3,
            versions: [
              {
                version: 1,
                state: 'published',
                uiStatus: 'Inativa',
                derivedStatus: 'Inativa',
                isActivePublished: false,
                canPublish: false,
                canActivate: true,
                hasBlockingIssues: false,
                stepCount: 1,
                fieldCount: 1,
                publishedAt: '2026-04-01T10:00:00.000Z',
                lastTransitionAt: '2026-04-01T10:00:00.000Z',
              },
              {
                version: 3,
                state: 'draft',
                uiStatus: 'Rascunho',
                derivedStatus: 'Rascunho',
                isActivePublished: false,
                canPublish: true,
                canActivate: false,
                hasBlockingIssues: false,
                stepCount: 2,
                fieldCount: 2,
                publishedAt: null,
                lastTransitionAt: null,
              },
            ],
          },
        ],
      },
    ],
    summary: {
      areaCount: 1,
      workflowTypeCount: 1,
      versionCount: 2,
    },
  };
}

describe('WorkflowConfigDefinitionsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 'firebase-uid-1' },
    } as ReturnType<typeof useAuth>);
    publishWorkflowVersion.mockResolvedValue({});
    activateWorkflowVersion.mockResolvedValue({});
  });

  it('renders publish and activate CTAs for eligible versions', async () => {
    const user = userEvent.setup();
    const onRefresh = jest.fn();

    render(<WorkflowConfigDefinitionsTab catalog={buildCatalog()} onRefresh={onRefresh} />);

    await user.click(screen.getByRole('button', { name: /Facilities/i }));
    await user.click(screen.getByRole('button', { name: /^Publicar$/i }));
    await user.click(screen.getByRole('button', { name: /^Ativar$/i }));

    expect(publishWorkflowVersion).toHaveBeenCalledTimes(1);
    expect(activateWorkflowVersion).toHaveBeenCalledTimes(1);
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });
});
