import {
  normalizeActionAttachmentCapability,
  supportsActionAttachments,
} from '../action-capabilities';

describe('action-capabilities', () => {
  it('supports attachments only for execution actions', () => {
    expect(supportsActionAttachments('execution')).toBe(true);
    expect(supportsActionAttachments('approval')).toBe(false);
    expect(supportsActionAttachments('acknowledgement')).toBe(false);
    expect(supportsActionAttachments('other')).toBe(false);
  });

  it('preserves attachmentRequired for execution actions', () => {
    expect(
      normalizeActionAttachmentCapability({
        type: 'execution',
        label: 'Executar',
        attachmentRequired: true,
      }),
    ).toEqual({
      type: 'execution',
      label: 'Executar',
      attachmentRequired: true,
    });
  });

  it('forces attachmentRequired to false outside execution', () => {
    expect(
      normalizeActionAttachmentCapability({
        type: 'approval',
        label: 'Aprovar',
        attachmentRequired: true,
        attachmentPlaceholder: 'Nao deve ser exigido',
      }),
    ).toEqual({
      type: 'approval',
      label: 'Aprovar',
      attachmentRequired: false,
    });
  });
});
