export const VACATION_REQUESTS_COLLECTION = "vacation_requests";
export const VACATION_APPROVERS_COLLECTION = "vacation_approvers";

export type VacationRequestStatus = "pending" | "approved" | "rejected";

export interface VacationRequest {
  id: string;
  requesterUid: string;
  requesterName: string;
  startDate: string;
  endDate: string;
  businessDays: number;
  status: VacationRequestStatus;
  responsibleUid?: string;
  responsibleName?: string;
  reviewedByUid?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewReason?: string;
  requesterArchivedAt?: string;
  requesterArchivedByUid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VacationApprover {
  id: string;
  userUid: string;
  userName: string;
  responsibleUid: string;
  responsibleName: string;
  createdAt: string;
  updatedAt: string;
  updatedByUid: string;
}

export interface ResponsibleOption {
  name: string;
}

export const RESPONSIBLE_OPTIONS: ResponsibleOption[] = [
  { name: "Augusto Cesar Carsalade Vieira" },
  { name: "Henrique Ayres Jameli" },
  { name: "Thiago Nogueira Penna" },
];

export type CreateVacationRequestInput = Pick<
  VacationRequest,
  "startDate" | "endDate" | "businessDays"
>;
