import type { StepActionDef } from './types';

type SupportedActionType = StepActionDef['type'];

export function supportsActionAttachments(actionType: unknown): actionType is SupportedActionType {
  return actionType === 'execution';
}

export function normalizeActionAttachmentCapability(action: StepActionDef): StepActionDef {
  if (supportsActionAttachments(action.type)) {
    return {
      ...action,
      attachmentRequired: action.attachmentRequired === true,
    };
  }

  const { attachmentPlaceholder: _attachmentPlaceholder, ...rest } = action;

  return {
    ...rest,
    attachmentRequired: false,
  };
}
