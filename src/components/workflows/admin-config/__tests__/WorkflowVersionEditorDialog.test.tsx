import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowVersionEditorDialog } from '../WorkflowVersionEditorDialog';

type EditorMockProps = {
  onDirtyStateChange?: (state: { isDirty: boolean; isReadOnly: boolean }) => void;
  onShellStateChange?: (state: {
    submitDraft: () => void;
    publishVersion: () => void;
    isSaving: boolean;
    isPublishing: boolean;
    canPublish: boolean;
    isReadOnly: boolean;
    isHydrated: boolean;
  }) => void;
};

const mockSubmitDraft = jest.fn();
const mockPublishVersion = jest.fn();

jest.mock('../editor/WorkflowDraftEditorPage', () => ({
  WorkflowDraftEditorPage: jest.fn(({ onDirtyStateChange, onShellStateChange }: EditorMockProps) => {
    React.useEffect(() => {
      onDirtyStateChange?.({
        isDirty: true,
        isReadOnly: false,
      });
      onShellStateChange?.({
        submitDraft: mockSubmitDraft,
        publishVersion: mockPublishVersion,
        isSaving: false,
        isPublishing: false,
        canPublish: true,
        isReadOnly: false,
        isHydrated: true,
      });
    }, [onDirtyStateChange, onShellStateChange]);

    return <div>Editor body</div>;
  }),
}));

const editorMock = jest.requireMock('../editor/WorkflowDraftEditorPage') as {
  WorkflowDraftEditorPage: jest.Mock;
};

describe('WorkflowVersionEditorDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitDraft.mockReset();
    mockPublishVersion.mockReset();

    editorMock.WorkflowDraftEditorPage.mockImplementation(({ onDirtyStateChange, onShellStateChange }: EditorMockProps) => {
      React.useEffect(() => {
        onDirtyStateChange?.({
          isDirty: true,
          isReadOnly: false,
        });
        onShellStateChange?.({
          submitDraft: mockSubmitDraft,
          publishVersion: mockPublishVersion,
          isSaving: false,
          isPublishing: false,
          canPublish: true,
          isReadOnly: false,
          isHydrated: true,
        });
      }, [onDirtyStateChange, onShellStateChange]);

      return <div>Editor body</div>;
    });
  });

  it('does not close on escape when there are unsaved changes and confirmation is rejected', () => {
    const onClose = jest.fn();
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <WorkflowVersionEditorDialog
        workflowTypeId="facilities_manutencao"
        version={2}
        open
        onClose={onClose}
        onRefresh={jest.fn()}
      />,
    );

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(window.confirm).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders the close button and fixed footer actions in edit mode', async () => {
    const user = userEvent.setup();

    render(
      <WorkflowVersionEditorDialog
        workflowTypeId="facilities_manutencao"
        version={2}
        open
        onClose={jest.fn()}
        onRefresh={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Fechar editor' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Salvar rascunho/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Publicar versao/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Salvar rascunho/i }));
    expect(mockSubmitDraft).toHaveBeenCalledTimes(1);
    expect(mockPublishVersion).not.toHaveBeenCalled();
  });

  it('keeps the editable footer hidden until the shell is hydrated', () => {
    editorMock.WorkflowDraftEditorPage.mockImplementation(() => <div>Editor body</div>);

    render(
      <WorkflowVersionEditorDialog
        workflowTypeId="facilities_manutencao"
        version={2}
        open
        onClose={jest.fn()}
        onRefresh={jest.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /Salvar rascunho/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Publicar versao/i })).toBeNull();
  });

  it('fecha quando dirty e confirmacao e aceita', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <WorkflowVersionEditorDialog
        workflowTypeId="facilities_manutencao"
        version={2}
        open
        onClose={onClose}
        onRefresh={jest.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Fechar editor' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides the footer in read-only mode and closes without confirmation', async () => {
    editorMock.WorkflowDraftEditorPage.mockImplementation(({ onDirtyStateChange, onShellStateChange }: EditorMockProps) => {
      React.useEffect(() => {
        onDirtyStateChange?.({ isDirty: true, isReadOnly: true });
        onShellStateChange?.({
          submitDraft: mockSubmitDraft,
          publishVersion: mockPublishVersion,
          isSaving: false,
          isPublishing: false,
          canPublish: false,
          isReadOnly: true,
          isHydrated: true,
        });
      }, [onDirtyStateChange, onShellStateChange]);

      return <div>Editor body (read-only)</div>;
    });

    const user = userEvent.setup();
    const onClose = jest.fn();
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <WorkflowVersionEditorDialog
        workflowTypeId="facilities_manutencao"
        version={1}
        open
        onClose={onClose}
        onRefresh={jest.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /Salvar rascunho/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Publicar versao/i })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Fechar editor' }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
