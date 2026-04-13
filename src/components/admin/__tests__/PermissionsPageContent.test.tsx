import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PermissionsPageContent from '@/components/admin/PermissionsPageContent';

// Mock do SuperAdminGuard para deixar passar
jest.mock('@/components/auth/SuperAdminGuard', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock do context
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockUseCollaborators = jest.fn();
const baseCollaborator = {
    id: 'c1',
    id3a: '001',
    name: 'Ana Silva',
    email: 'ana@3a.com',
    axis: 'ops',
    area: 'Tecnologia',
    position: 'Analista',
    segment: '-',
    leader: '-',
    city: 'SP',
    permissions: {
        canManageWorkflows: false,
        canManageWorkflowsV2: false,
        canManageRequests: false,
        canManageRequestsV2: false,
        canOpenRequestsV2: false,
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
};

jest.mock('@/contexts/CollaboratorsContext', () => ({
    useCollaborators: () => mockUseCollaborators(),
}));

jest.mock('@/hooks/use-toast', () => ({
    toast: jest.fn(),
}));

describe('PermissionsPageContent — Fase 9.3', () => {
    beforeEach(() => {
        mockUpdate.mockClear();
        mockUseCollaborators.mockReturnValue({
            collaborators: [baseCollaborator],
            loading: false,
            updateCollaboratorPermissions: mockUpdate,
        });
    });

    it('renderiza o cabeçalho de grupo V2 (Rollout)', () => {
        render(<PermissionsPageContent />);
        expect(screen.getByLabelText(/Grupo V2 \(Rollout\)/i)).toBeInTheDocument();
    });

    it('exibe as três colunas v2 com labels finais', () => {
        render(<PermissionsPageContent />);
        expect(screen.getByText('Solicitações V2')).toBeInTheDocument();
        expect(screen.getByText('Gestão Chamados V2')).toBeInTheDocument();
        expect(screen.getByText('Config Chamados V2')).toBeInTheDocument();
    });

    it('marca as permissões legadas com o sufixo (Legado)', () => {
        render(<PermissionsPageContent />);
        expect(screen.getByText('Workflows (Legado)')).toBeInTheDocument();
        expect(screen.getByText('Solicitações (Legado)')).toBeInTheDocument();
    });

    it('Switch canOpenRequestsV2 inicia desligado e persiste true ao clicar', async () => {
        render(<PermissionsPageContent />);
        const toggle = screen.getByRole('switch', {
            name: /Ativar\/desativar permissão Solicitações V2 para Ana Silva/i,
        });
        expect(toggle).not.toBeChecked();

        fireEvent.click(toggle);

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                'c1',
                expect.objectContaining({ canOpenRequestsV2: true })
            );
        });
        // garante preservação dos demais flags
        expect(mockUpdate).toHaveBeenCalledWith(
            'c1',
            expect.objectContaining({
                canManageWorkflows: false,
                canManageRequests: false,
                canManageRequestsV2: false,
                canManageWorkflowsV2: false,
            })
        );
    });

    it('permite desligar canManageRequestsV2 (kill-switch)', async () => {
        const withFlag = {
            ...baseCollaborator,
            permissions: {
                ...baseCollaborator.permissions,
                canManageRequestsV2: true,
            },
        };
        mockUseCollaborators.mockReturnValue({
            collaborators: [withFlag],
            loading: false,
            updateCollaboratorPermissions: mockUpdate,
        });
        render(<PermissionsPageContent />);
        const toggle = screen.getByRole('switch', {
            name: /Ativar\/desativar permissão Gestão Chamados V2 para Ana Silva/i,
        });
        expect(toggle).toBeChecked();
        fireEvent.click(toggle);
        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                'c1',
                expect.objectContaining({ canManageRequestsV2: false })
            );
        });
    });
});
