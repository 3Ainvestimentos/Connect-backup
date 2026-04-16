/** @jest-environment node */

export {};

const {
  canonicalizeSteps,
  canonicalizeVersionSteps,
  deriveCanonicalSemantics,
  inspectVersionStepOrder,
} = require('../canonical-step-semantics');

describe('canonical-step-semantics', () => {
  it('derives canonical semantics for start, work and final positions', () => {
    expect(deriveCanonicalSemantics(0, 3)).toMatchObject({
      kind: 'start',
      statusKey: 'solicitacao_aberta',
      roleLabel: 'Inicial',
    });
    expect(deriveCanonicalSemantics(1, 3)).toMatchObject({
      kind: 'work',
      statusKey: 'em_andamento',
      roleLabel: 'Intermediaria',
    });
    expect(deriveCanonicalSemantics(2, 3)).toMatchObject({
      kind: 'final',
      statusKey: 'finalizado',
      roleLabel: 'Final',
    });
  });

  it('canonicalizes step arrays from 0 to 4+ positions', () => {
    expect(canonicalizeSteps([])).toEqual({
      steps: [],
      stepsById: {},
      stepOrder: [],
      initialStepId: '',
    });

    expect(
      canonicalizeSteps([{ stepId: 'only', stepName: 'Unica' }]),
    ).toMatchObject({
      stepOrder: ['only'],
      initialStepId: 'only',
      stepsById: {
        only: expect.objectContaining({ kind: 'start', statusKey: 'solicitacao_aberta' }),
      },
    });

    expect(
      canonicalizeSteps([
        { stepId: 'start', stepName: 'Inicio' },
        { stepId: 'final', stepName: 'Fim' },
      ]),
    ).toMatchObject({
      stepOrder: ['start', 'final'],
      stepsById: {
        start: expect.objectContaining({ kind: 'start', statusKey: 'solicitacao_aberta' }),
        final: expect.objectContaining({ kind: 'final', statusKey: 'finalizado' }),
      },
    });

    const canonicalThree = canonicalizeSteps([
      { stepId: 'start', stepName: 'Inicio' },
      { stepId: 'work', stepName: 'Execucao' },
      { stepId: 'final', stepName: 'Fim' },
    ]);
    expect(canonicalThree.stepsById.work).toMatchObject({
      kind: 'work',
      statusKey: 'em_andamento',
    });

    const canonicalFour = canonicalizeSteps([
      { stepId: 'start', stepName: 'Inicio' },
      { stepId: 'work_1', stepName: 'Triagem' },
      { stepId: 'work_2', stepName: 'Execucao' },
      { stepId: 'final', stepName: 'Fim' },
    ]);
    expect(canonicalFour.stepsById.work_1).toMatchObject({
      kind: 'work',
      statusKey: 'em_andamento',
    });
    expect(canonicalFour.stepsById.work_2).toMatchObject({
      kind: 'work',
      statusKey: 'em_andamento',
    });
  });

  it('inspects missing and duplicate ids before canonicalization', () => {
    expect(
      inspectVersionStepOrder({
        stepOrder: ['start', 'missing', 'start'],
        stepsById: {
          start: { stepId: 'start', stepName: 'Inicio', statusKey: 'legacy', kind: 'final' },
        },
      }),
    ).toEqual({
      stepOrder: ['start', 'missing', 'start'],
      orderedExistingSteps: [
        { stepId: 'start', stepName: 'Inicio', statusKey: 'legacy', kind: 'final', action: undefined },
        { stepId: 'start', stepName: 'Inicio', statusKey: 'legacy', kind: 'final', action: undefined },
      ],
      missingStepIds: ['missing'],
      duplicateStepIds: ['start'],
      isStructurallyValid: false,
    });
  });

  it('preserves raw version shape when stepOrder is structurally invalid', () => {
    const version = {
      initialStepId: 'legacy-start',
      stepOrder: ['start', 'missing', 'final'],
      stepsById: {
        start: { stepId: 'start', stepName: 'Inicio', statusKey: 'legacy', kind: 'final' },
        final: { stepId: 'final', stepName: 'Fim', statusKey: 'legacy-final', kind: 'start' },
      },
    };

    expect(canonicalizeVersionSteps(version)).toEqual({
      initialStepId: 'legacy-start',
      stepOrder: ['start', 'missing', 'final'],
      stepsById: {
        start: { stepId: 'start', stepName: 'Inicio', statusKey: 'legacy', kind: 'final', action: undefined },
        final: {
          stepId: 'final',
          stepName: 'Fim',
          statusKey: 'legacy-final',
          kind: 'start',
          action: undefined,
        },
      },
    });
  });

  it('canonicalizes version shape only after structural validation succeeds', () => {
    expect(
      canonicalizeVersionSteps({
        initialStepId: 'legacy-start',
        stepOrder: ['start', 'work', 'final'],
        stepsById: {
          start: { stepId: 'start', stepName: 'Inicio', statusKey: 'x', kind: 'final' },
          work: { stepId: 'work', stepName: 'Execucao', statusKey: 'y', kind: 'start' },
          final: { stepId: 'final', stepName: 'Fim', statusKey: 'z', kind: 'work' },
        },
      }),
    ).toEqual({
      initialStepId: 'start',
      stepOrder: ['start', 'work', 'final'],
      stepsById: {
        start: {
          stepId: 'start',
          stepName: 'Inicio',
          statusKey: 'solicitacao_aberta',
          kind: 'start',
          action: undefined,
        },
        work: {
          stepId: 'work',
          stepName: 'Execucao',
          statusKey: 'em_andamento',
          kind: 'work',
          action: undefined,
        },
        final: {
          stepId: 'final',
          stepName: 'Fim',
          statusKey: 'finalizado',
          kind: 'final',
          action: undefined,
        },
      },
    });
  });
});
