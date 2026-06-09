export type AuditStatus =
  | "CREATED"
  | "PLANNING"
  | "PLANNED"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "COMPLETED"
  | "CLOSED";

export type AuditType = "GAP-analyse" | "interne audit";

export type ComplianceStatus = "COMPLIANT" | "PARTIAL" | "NON_COMPLIANT" | "NOT_APPLICABLE";

export interface OrganizationLoginResponse {
  accessToken: string;
  tokenType: string;
  expiresAtEpochSeconds: number;
  organizationName: string;
  role: string;
}

export interface Audit {
  id: number;
  title: string;
  scope: string | null;
  organizationName: string;
  organizationId?: number | null;
  auditorName: string;
  auditorUserId?: number | null;
  auditorEmail?: string | null;
  startDate: string;
  endDate: string | null;
  status: AuditStatus;
  type: AuditType;
  reviewerUserId?: number | null;
  reviewerEmail?: string | null;
  harmonizedStructureConformance?: Record<string, unknown> | null;
  harmonizedStructureRefsInScope?: string[] | null;
  isoControlIdsInScope?: number[] | null;
}

export interface AuditPage {
  content: Audit[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface DashboardStats {
  totalAudits: number;
  auditsByStatus: Record<string, number>;
  totalAssessments: number;
  totalFindings: number;
}

export interface Assessment {
  id: number;
  complianceStatus: ComplianceStatus | null;
  notes: string | null;
  auditee?: string | null;
  reviewComment?: string | null;
  control?: { id: number; reference: string; title: string; domain: string } | null;
}

export interface IsoControl {
  id: number;
  reference: string;
  title: string;
  domain: string;
}
