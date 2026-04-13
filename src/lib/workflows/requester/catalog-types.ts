export type RequesterCatalogWorkflow = {
  workflowTypeId: string;
  name: string;
  description: string;
  icon: string;
};

export type RequesterCatalogArea = {
  areaId: string;
  areaName: string;
  areaIcon?: string;
  workflows: RequesterCatalogWorkflow[];
};

export type RequesterCatalogResponse = {
  ok: true;
  data: RequesterCatalogArea[];
};

export type RequesterCatalogError = {
  ok: false;
  code?: string;
  message?: string;
};

export type OpenRequesterWorkflowInput = {
  workflowTypeId: string;
  requesterName: string;
  formData: Record<string, unknown>;
};

export type OpenRequesterWorkflowResult = {
  requestId: number;
  docId: string;
};
