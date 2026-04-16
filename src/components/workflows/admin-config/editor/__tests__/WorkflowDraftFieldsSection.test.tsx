import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { WorkflowDraftFieldsSection } from '../WorkflowDraftFieldsSection';
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
    steps: [],
  };
}

function renderSection(readOnly = false) {
  function Harness() {
    const form = useForm<WorkflowDraftFormValues>({
      defaultValues: buildDefaultValues(),
    });

    return (
      <FormProvider {...form}>
        <WorkflowDraftFieldsSection readOnly={readOnly} />
      </FormProvider>
    );
  }

  return render(<Harness />);
}

describe('WorkflowDraftFieldsSection', () => {
  it('adds a field from the footer CTA', async () => {
    const user = userEvent.setup();

    renderSection();

    await user.click(screen.getByRole('button', { name: /Adicionar campo/i }));

    expect(screen.getByText('Campo 1')).toBeTruthy();
  });

  it('keeps the footer CTA disabled in read-only mode', () => {
    renderSection(true);

    expect(screen.getByRole('button', { name: /Adicionar campo/i })).toBeDisabled();
  });
});
