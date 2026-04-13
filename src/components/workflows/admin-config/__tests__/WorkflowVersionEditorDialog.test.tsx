import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { WorkflowVersionEditorDialog } from '../WorkflowVersionEditorDialog';

jest.mock('../editor/WorkflowDraftEditorPage', () => ({
  WorkflowDraftEditorPage: jest.fn(
    ({
      onDirtyStateChange,
    }: {
      onDirtyStateChange?: (state: { isDirty: boolean; isReadOnly: boolean }) => void;
    }) => {
      React.useEffect(() => {
        onDirtyStateChange?.({
          isDirty: true,
          isReadOnly: false,
        });
      }, [onDirtyStateChange]);

      return <div>Editor body</div>;
    },
  ),
}));

const editorMock = jest.requireMock('../editor/WorkflowDraftEditorPage') as {
  WorkflowDraftEditorPage: jest.Mock;
};

describe('WorkflowVersionEditorDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reaplica implementacao default (dirty + edit) apos o clearAllMocks
    // para nao quebrar os testes que dependem do comportamento base.
    editorMock.WorkflowDraftEditorPage.mockImplementation(
      ({
        onDirtyStateChange,
      }: {
        onDirtyStateChange?: (state: { isDirty: boolean; isReadOnly: boolean }) => void;
      }) => {
        React.useEffect(() => {
          onDirtyStateChange?.({
            isDirty: true,
            isReadOnly: false,
          });
        }, [onDirtyStateChange]);

        return <div>Editor body</div>;
      },
    );
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

  it('fecha quando dirty e confirmacao e aceita', () => {
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

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(window.confirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fecha sem confirmacao quando modo read-only', () => {
    // Sobrescreve o mock do editor para emitir isReadOnly: true.
    editorMock.WorkflowDraftEditorPage.mockImplementation(
      ({
        onDirtyStateChange,
      }: {
        onDirtyStateChange?: (state: { isDirty: boolean; isReadOnly: boolean }) => void;
      }) => {
        React.useEffect(() => {
          onDirtyStateChange?.({ isDirty: true, isReadOnly: true });
        }, [onDirtyStateChange]);
        return <div>Editor body (read-only)</div>;
      },
    );

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

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
