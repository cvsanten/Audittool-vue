import type { ComplianceStatus } from "../api/types";

/** ISO/IEC 27001:2022 clauses 4–10 — harmonized structure sub-clauses. */
export const HS_ROW_DEFS = [
  { ref: "4.1", clause: "Context van de organisatie", requirement: "Inzicht in de organisatie en haar context" },
  { ref: "4.2", clause: "Context van de organisatie", requirement: "Inzicht in de behoeften en verwachtingen van belanghebbenden" },
  { ref: "4.3", clause: "Context van de organisatie", requirement: "Vaststellen van de scope van het informatiebeveiligingsmanagementsysteem" },
  { ref: "4.4", clause: "Context van de organisatie", requirement: "Informatiebeveiligingsmanagementsysteem" },
  { ref: "5.1", clause: "Leiderschap", requirement: "Leiderschap en betrokkenheid" },
  { ref: "5.2", clause: "Leiderschap", requirement: "Beleid" },
  { ref: "5.3", clause: "Leiderschap", requirement: "Rollen, verantwoordelijkheden en bevoegdheden binnen de organisatie" },
  { ref: "6.1.1", clause: "Planning", requirement: "Algemeen" },
  { ref: "6.1.2", clause: "Planning", requirement: "Risicobeoordeling informatiebeveiliging" },
  { ref: "6.1.3", clause: "Planning", requirement: "Risicobehandeling informatiebeveiliging" },
  { ref: "6.2", clause: "Planning", requirement: "Informatiebeveiligingsdoelstellingen en planning om die te bereiken" },
  { ref: "6.3", clause: "Planning", requirement: "Planning van wijzigingen" },
  { ref: "7.1", clause: "Ondersteuning", requirement: "Middelen" },
  { ref: "7.2", clause: "Ondersteuning", requirement: "Competentie" },
  { ref: "7.3", clause: "Ondersteuning", requirement: "Bewustwording" },
  { ref: "7.4", clause: "Ondersteuning", requirement: "Communicatie" },
  { ref: "7.5.1", clause: "Ondersteuning", requirement: "Gedocumenteerde informatie — Algemeen" },
  { ref: "7.5.2", clause: "Ondersteuning", requirement: "Gedocumenteerde informatie — Opstellen en bijwerken" },
  { ref: "7.5.3", clause: "Ondersteuning", requirement: "Gedocumenteerde informatie — Beheersing van gedocumenteerde informatie" },
  { ref: "8.1", clause: "Uitvoering", requirement: "Operationele planning en beheersing" },
  { ref: "8.2", clause: "Uitvoering", requirement: "Risicobeoordeling informatiebeveiliging" },
  { ref: "8.3", clause: "Uitvoering", requirement: "Risicobehandeling informatiebeveiliging" },
  { ref: "9.1", clause: "Prestatie-evaluatie", requirement: "Monitoring, meting, analyse en evaluatie" },
  { ref: "9.2.1", clause: "Prestatie-evaluatie", requirement: "Interne audit — Algemeen" },
  { ref: "9.2.2", clause: "Prestatie-evaluatie", requirement: "Intern auditprogramma" },
  { ref: "9.2.3", clause: "Prestatie-evaluatie", requirement: "Interne audit — Beheer van auditprogramma en resultaten" },
  { ref: "9.3.1", clause: "Prestatie-evaluatie", requirement: "Managementbeoordeling — Algemeen" },
  { ref: "9.3.2", clause: "Prestatie-evaluatie", requirement: "Input voor managementbeoordeling" },
  { ref: "9.3.3", clause: "Prestatie-evaluatie", requirement: "Resultaten van managementbeoordeling" },
  { ref: "10.1", clause: "Verbetering", requirement: "Continue verbetering" },
  { ref: "10.2", clause: "Verbetering", requirement: "Afwijking en corrigerende maatregel" },
] as const;

export type HsRef = (typeof HS_ROW_DEFS)[number]["ref"];

export const HS_ROWS = HS_ROW_DEFS.map((r) => r.ref);

const HS_BY_REF = Object.fromEntries(HS_ROW_DEFS.map((r) => [r.ref, r])) as Record<
  HsRef,
  (typeof HS_ROW_DEFS)[number]
>;

export type HsCell = {
  status: ComplianceStatus | "";
  notes: string;
  auditee: string;
  reviewComment: string;
};

export function hsClauseLabel(ref: string): string {
  return HS_BY_REF[ref as HsRef]?.clause ?? "—";
}

export function hsRequirementLabel(ref: string): string {
  return HS_BY_REF[ref as HsRef]?.requirement ?? "—";
}

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
