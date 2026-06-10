import { computed, type Ref } from "vue";
import { currentUserEmail, currentUserId, role } from "../api/client";
import type { Audit } from "../api/types";

function matchesUser(userId?: number | null, email?: string | null): boolean {
  const uid = currentUserId();
  if (uid != null && userId != null && Number(userId) === Number(uid)) return true;
  const em = currentUserEmail()?.toLowerCase();
  const linked = email?.trim().toLowerCase();
  return Boolean(em && linked && em === linked);
}

export function useAuditAccess(audit: Ref<Audit | null>) {
  const isAssignedReviewer = computed(
    () =>
      audit.value?.status === "IN_REVIEW"
      && matchesUser(audit.value.reviewerUserId, audit.value.reviewerEmail),
  );

  const isLeadAuditor = computed(() =>
    matchesUser(audit.value?.auditorUserId, audit.value?.auditorEmail),
  );

  const isMainAdmin = computed(() => role() === "MAIN_ADMIN");

  const canEditReviewComments = computed(() => isAssignedReviewer.value);

  const canEditAuditContent = computed(() => {
    if (!audit.value) return false;
    if (audit.value.status !== "IN_REVIEW") return true;
    return isLeadAuditor.value || (isMainAdmin.value && !isAssignedReviewer.value);
  });

  return {
    isAssignedReviewer,
    isLeadAuditor,
    canEditReviewComments,
    canEditAuditContent,
  };
}
