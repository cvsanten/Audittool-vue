import type {
  Assessment,
  Audit,
  AuditPage,
  DashboardStats,
  IsoControl,
  OrganizationLoginResponse,
} from "./types";

const API = "/api";
const ORG_KEY = "orgPortal.organization";
const TOKEN_KEY = "orgPortal.accessToken";
const ROLE_KEY = "orgPortal.role";

function errorMessage(body: string, fallback: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: string };
    if (parsed.error?.trim()) return parsed.error;
  } catch {
    /* ignore */
  }
  return body.trim() || fallback;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(errorMessage(await res.text(), res.statusText));
  }
  return res.json() as Promise<T>;
}

function token(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearSession(): void {
  sessionStorage.removeItem(ORG_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}

export function setSession(login: OrganizationLoginResponse): void {
  sessionStorage.setItem(ORG_KEY, login.organizationName);
  sessionStorage.setItem(TOKEN_KEY, login.accessToken);
  sessionStorage.setItem(ROLE_KEY, login.role);
}

export function readSession(): {
  organizationName: string | null;
  role: string | null;
  accessToken: string | null;
} {
  return {
    organizationName: sessionStorage.getItem(ORG_KEY),
    role: sessionStorage.getItem(ROLE_KEY),
    accessToken: sessionStorage.getItem(TOKEN_KEY),
  };
}

export function organizationName(): string | null {
  return sessionStorage.getItem(ORG_KEY);
}

export function role(): string | null {
  return sessionStorage.getItem(ROLE_KEY);
}

export function hasSession(): boolean {
  return Boolean(token() && organizationName() && role());
}

function decodeJwtPayload(): Record<string, unknown> | null {
  const t = token();
  if (!t) return null;
  const parts = t.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function currentUserId(): number | null {
  const payload = decodeJwtPayload();
  if (!payload) return null;
  const raw = payload.uid;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function currentUserEmail(): string | null {
  const payload = decodeJwtPayload();
  const sub = payload?.sub;
  return typeof sub === "string" && sub.trim() ? sub : null;
}

export function isStaff(): boolean {
  const r = role();
  return r === "MAIN_ADMIN" || r === "AUDITOR";
}

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const t = token();
  if (t) headers.set("Authorization", `Bearer ${t}`);
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    clearSession();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.assign("/login");
    }
    throw new Error("Unauthorized");
  }
  return res;
}

export async function login(email: string, password: string): Promise<OrganizationLoginResponse> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseJson(res);
}

export async function fetchDashboard(): Promise<DashboardStats> {
  return parseJson(await authFetch(`${API}/statistics/dashboard`));
}

export async function fetchAudits(page = 0, size = 50): Promise<AuditPage> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return parseJson(await authFetch(`${API}/audits?${q}`));
}

export async function fetchAudit(id: number): Promise<Audit> {
  return parseJson(await authFetch(`${API}/audits/${id}`));
}

export async function fetchIsoControls(): Promise<IsoControl[]> {
  return parseJson(await authFetch(`${API}/iso-controls`));
}

export async function fetchAssessments(auditId: number): Promise<Assessment[]> {
  return parseJson(await authFetch(`${API}/audits/${auditId}/assessments`));
}

export async function upsertHsReviewComment(
  auditId: number,
  hsRef: string,
  reviewComment: string | null,
): Promise<Audit> {
  return parseJson(
    await authFetch(`${API}/audits/${auditId}/review-comments/hs/${encodeURIComponent(hsRef)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewComment }),
    }),
  );
}

export async function upsertControlReviewComment(
  auditId: number,
  isoControlId: number,
  reviewComment: string | null,
): Promise<Assessment> {
  return parseJson(
    await authFetch(`${API}/audits/${auditId}/review-comments/controls/${isoControlId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewComment }),
    }),
  );
}
