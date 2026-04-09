import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { WorkflowVersionEditorDialog } from '../WorkflowVersionEditorDialog';

jest.mock('../editor/WorkflowDraftEditorPage', () => ({
  WorkflowDraftEditorPage: ({
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
}));

describe('WorkflowVersionEditorDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
