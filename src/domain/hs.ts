import type { ComplianceStatus } from "../api/types";

export const HS_ROWS = [
  "4.1", "4.2", "4.3", "4.4",
  "5.1", "5.2", "5.3",
  "6.1.1", "6.1.2", "6.1.3", "6.2", "6.3",
  "7.1", "7.2", "7.3", "7.4", "7.5.1", "7.5.2", "7.5.3",
  "8.1", "8.2", "8.3",
  "9.1", "9.2.1", "9.2.2", "9.2.3", "9.3.1", "9.3.2", "9.3.3",
  "10.1", "10.2",
] as const;

export type HsRef = (typeof HS_ROWS)[number];

export type HsCell = {
  status: ComplianceStatus | "";
  notes: string;
  auditee: string;
  reviewComment: string;
};

export function hsRowsInScope(audit: { harmonizedStructureRefsInScope?: string[] | null }): string[] {
  const scoped = audit.harmonizedStructureRefsInScope;
  if (!scoped?.length) return [...HS_ROWS];
  return HS_ROWS.filter((r) => scoped.includes(r));
}

export function parseHsMap(map?: Record<string, unknown> | null): Record<string, HsCell> {
  const out: Record<string, HsCell> = {};
  for (const ref of HS_ROWS) {
    out[ref] = { status: "", notes: "", auditee: "", reviewComment: "" };
  }
  if (!map) return out;
  for (const ref of HS_ROWS) {
    const v = map[ref];
    if (typeof v === "string") {
      out[ref].status = v as ComplianceStatus;
      continue;
    }
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.status === "string") out[ref].status = o.status as ComplianceStatus;
      if (typeof o.notes === "string") out[ref].notes = o.notes;
      if (typeof o.auditee === "string") out[ref].auditee = o.auditee;
      if (typeof o.reviewComment === "string") out[ref].reviewComment = o.reviewComment;
    }
  }
  return out;
}
