import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowDraftReadinessPanel } from '../editor/WorkflowDraftReadinessPanel';

jest.mock('lucide-react', () => {
  const Icon = () => <svg />;
  return new Proxy(
    {},
    {
      get: () => Icon,
    },
  );
});

describe('WorkflowDraftReadinessPanel', () => {
  it('separates blocking issues and enables publish when allowed', async () => {
    const user = userEvent.setup();
    const onPublish = jest.fn();

    render(
      <WorkflowDraftReadinessPanel
        issues={[
          {
            code: 'WARN_1',
            category: 'general',
            severity: 'warning',
            message: 'Aviso de exemplo.',
          },
        ]}
        canPublish={true}
        isPublishing={false}
        hasUnsavedChanges={false}
        onPublish={onPublish}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Publicar versao/i }));

    expect(onPublish).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Aviso de exemplo.')).toBeTruthy();
  });

  it('disables publish when blocking issues exist', () => {
    render(
      <WorkflowDraftReadinessPanel
        issues={[
          {
            code: 'BLOCK_1',
            category: 'steps',
            severity: 'blocking',
            message: 'Falta etapa final.',
          },
        ]}
        canPublish={false}
        isPublishing={false}
        hasUnsavedChanges={false}
        onPublish={jest.fn()}
      />,
    );

    expect((screen.getByRole('button', { name: /Publicar versao/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Falta etapa final.')).toBeTruthy();
  });

  it('disables publish when there are unsaved local changes', () => {
    render(
      <WorkflowDraftReadinessPanel
        issues={[]}
        canPublish={true}
        isPublishing={false}
        hasUnsavedChanges={true}
        onPublish={jest.fn()}
      />,
    );

    expect((screen.getByRole('button', { name: /Publicar versao/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Salve o rascunho atual antes de publicar esta versao.')).toBeTruthy();
  });

  it('keeps the panel informative when the publish CTA is hidden', () => {
    render(
      <WorkflowDraftReadinessPanel
        issues={[
          {
            code: 'WARN_1',
            category: 'general',
            severity: 'warning',
            message: 'Aviso de exemplo.',
          },
        ]}
        canPublish={true}
        isPublishing={false}
        hasUnsavedChanges={false}
        onPublish={jest.fn()}
        showPublishAction={false}
      />,
    );

    expect(screen.queryByRole('button', { name: /Publicar versao/i })).toBeNull();
    expect(screen.getByText('Aviso de exemplo.')).toBeTruthy();
  });
});
