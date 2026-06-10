import type { Audit, ComplianceStatus, HarmonizedStructureConformance, UpdateAuditPayload } from "../api/types";
import type { HsCell } from "./hs";
import { HS_ROWS } from "./hs";

export function buildAuditUpdateBody(
  audit: Audit,
  overrides: Partial<UpdateAuditPayload> = {},
): UpdateAuditPayload {
  return {
    title: overrides.title ?? audit.title,
    scope: "scope" in overrides ? overrides.scope : audit.scope,
    organizationName: overrides.organizationName ?? audit.organizationName,
    auditorName: overrides.auditorName ?? audit.auditorName,
    auditorUserId:
      "auditorUserId" in overrides ? overrides.auditorUserId : (audit.auditorUserId ?? null),
    startDate: overrides.startDate ?? audit.startDate,
    endDate: "endDate" in overrides ? overrides.endDate : audit.endDate,
    status: overrides.status ?? audit.status,
    type: overrides.type ?? audit.type,
    harmonizedStructureRefsInScope: audit.harmonizedStructureRefsInScope ?? null,
    isoControlIdsInScope: audit.isoControlIdsInScope ?? null,
    ...(overrides.harmonizedStructureConformance !== undefined
      ? { harmonizedStructureConformance: overrides.harmonizedStructureConformance }
      : {}),
  };
}

export function hsPayloadFromCells(
  cells: Record<string, HsCell>,
): Record<string, HarmonizedStructureConformance> {
  const out: Record<string, HarmonizedStructureConformance> = {};
  for (const ref of HS_ROWS) {
    const cell = cells[ref];
    if (!cell) continue;
    const notesTrim = cell.notes.trim();
    const reviewTrim = cell.reviewComment.trim();
    if (cell.status) {
      out[ref] = {
        status: cell.status,
        notes: notesTrim || null,
        ...(reviewTrim ? { reviewComment: reviewTrim } : {}),
      };
    } else if (notesTrim || reviewTrim) {
      out[ref] = {
        ...(notesTrim ? { notes: notesTrim } : {}),
        ...(reviewTrim ? { reviewComment: reviewTrim } : {}),
      };
    }
  }
  return out;
}

export const COMPLIANCE_STATUS_OPTIONS: ComplianceStatus[] = [
  "COMPLIANT",
  "PARTIAL",
  "NON_COMPLIANT",
  "NOT_APPLICABLE",
];

export function complianceStatusLabel(status: ComplianceStatus): string {
  switch (status) {
    case "COMPLIANT":
      return "Compliant";
    case "PARTIAL":
      return "Partial";
    case "NON_COMPLIANT":
      return "Non-compliant";
    case "NOT_APPLICABLE":
      return "N/A";
    default:
      return status;
  }
}
