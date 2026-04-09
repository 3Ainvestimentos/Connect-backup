/** @jest-environment node */

export {};

const { buildAccessPreview, evaluateDraftReadiness, normalizeAllowedUserIds } = require('../draft-readiness');

describe('draft-readiness helpers', () => {
  it('normalizes allowedUserIds for all and specific modes', () => {
    expect(normalizeAllowedUserIds('all', ['SMO2'])).toEqual(['all']);
    expect(normalizeAllowedUserIds('specific', ['SMO2', 'SMO2', 'all', ''])).toEqual(['SMO2']);
  });

  it('builds a readable access preview', () => {
    expect(buildAccessPreview('all', ['all'])).toBe('Acesso publico para todos os colaboradores');
    expect(buildAccessPreview('specific', ['SMO2', 'DLE'])).toBe('Acesso restrito a 2 colaboradores');
  });

  it('returns blocking issues for incomplete drafts', () => {
    const issues = evaluateDraftReadiness({
      general: {
        name: '',
        description: '',
        icon: 'FileText',
        areaId: '',
        ownerEmail: '',
        ownerUserId: '',
        defaultSlaDays: 0,
        activeOnPublish: true,
      },
      access: {
        mode: 'specific',
        allowedUserIds: [],
      },
      fields: [],
      steps: [],
      initialStepId: '',
      collaborators: [],
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'MISSING_NAME', category: 'general', severity: 'blocking' }),
        expect.objectContaining({ code: 'INVALID_OWNER', category: 'general', severity: 'blocking' }),
        expect.objectContaining({ code: 'MISSING_STEPS', category: 'steps', severity: 'blocking' }),
      ]),
    );
  });
});
