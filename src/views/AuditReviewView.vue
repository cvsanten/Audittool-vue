<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AuditSubnav from "../components/AuditSubnav.vue";
import ReviewCommentToggle from "../components/ReviewCommentToggle.vue";
import ReviewFeedbackModal from "../components/ReviewFeedbackModal.vue";
import { useAuditAccess } from "../composables/useAuditAccess";
import {
  fetchAssessments,
  fetchAudit,
  fetchIsoControls,
  submitAuditReview,
  upsertControlReviewComment,
  upsertHsReviewComment,
} from "../api/client";
import type { Assessment, Audit, IsoControl, ReviewDecision } from "../api/types";
import { hsRowsInScope, parseHsMap } from "../domain/hs";

const props = defineProps<{ auditId: number }>();
const router = useRouter();

const audit = ref<Audit | null>(null);
const assessments = ref<Assessment[]>([]);
const controls = ref<IsoControl[]>([]);
const err = ref<string | null>(null);
const toast = ref<string | null>(null);
const hsSaving = ref<string | null>(null);
const controlSaving = ref<number | null>(null);
const reviewModalOpen = ref(false);
const reviewSaving = ref(false);

const { canEditReviewComments } = useAuditAccess(audit);

const hsMap = computed(() => parseHsMap(audit.value?.harmonizedStructureConformance ?? null));
const hsRefs = computed(() => (audit.value ? hsRowsInScope(audit.value) : []));

const controlsInScope = computed(() => {
  if (!audit.value) return [];
  const ids = audit.value.isoControlIdsInScope;
  if (!ids?.length) return controls.value;
  const set = new Set(ids.map(Number));
  return controls.value.filter((c) => set.has(c.id));
});

const assessmentByControlId = computed(() => {
  const m = new Map<number, Assessment>();
  for (const a of assessments.value) {
    if (a.control?.id != null) m.set(a.control.id, a);
  }
  return m;
});

async function load() {
  err.value = null;
  const [a, assess, ctrl] = await Promise.all([
    fetchAudit(props.auditId),
    fetchAssessments(props.auditId),
    fetchIsoControls(),
  ]);
  audit.value = a;
  assessments.value = assess;
  controls.value = ctrl;
  if (a.status !== "IN_REVIEW") {
    router.replace("/audits");
  }
}

async function saveHs(ref: string, comment: string | null) {
  if (!audit.value || !canEditReviewComments.value) return;
  hsSaving.value = ref;
  try {
    audit.value = await upsertHsReviewComment(audit.value.id, ref, comment);
  } catch (e) {
    err.value = e instanceof Error ? e.message : "Opslaan mislukt";
  } finally {
    hsSaving.value = null;
  }
}

async function saveControl(controlId: number, comment: string | null) {
  if (!audit.value || !canEditReviewComments.value) return;
  controlSaving.value = controlId;
  try {
    await upsertControlReviewComment(audit.value.id, controlId, comment);
    assessments.value = await fetchAssessments(audit.value.id);
  } catch (e) {
    err.value = e instanceof Error ? e.message : "Opslaan mislukt";
  } finally {
    controlSaving.value = null;
  }
}

function openReviewModal() {
  err.value = null;
  reviewModalOpen.value = true;
}

async function submitReview(payload: { decision: ReviewDecision; comment: string }) {
  if (!audit.value || !canEditReviewComments.value) return;
  reviewSaving.value = true;
  err.value = null;
  try {
    await submitAuditReview(audit.value.id, {
      decision: payload.decision,
      comment: payload.comment || null,
    });
    reviewModalOpen.value = false;
    toast.value =
      payload.decision === "APPROVED"
        ? "Audit goedgekeurd"
        : "Audit teruggestuurd naar hoofdauditor";
    router.push({ name: "audits" });
  } catch (e) {
    err.value = e instanceof Error ? e.message : "Review indienen mislukt";
  } finally {
    reviewSaving.value = false;
  }
}

onMounted(() => {
  load().catch((e) => {
    err.value = e instanceof Error ? e.message : "Laden mislukt";
  });
});
</script>

<template>
  <div v-if="audit">
    <AuditSubnav :audit-id="audit.id" :show-review="audit.status === 'IN_REVIEW'" />

    <h1>{{ audit.title }}</h1>
    <p class="muted">{{ audit.organizationName }} · {{ audit.status }}</p>
    <p class="intro">
      {{
        canEditReviewComments
          ? "Alle checklistitems op één pagina. Gebruik + om reviewcommentaar toe te voegen."
          : "Overzicht van checklistitems en reviewcommentaar (alleen-lezen)."
      }}
    </p>
    <p v-if="err" class="error">{{ err }}</p>
    <p v-if="toast" class="toast">{{ toast }}</p>

    <div v-if="canEditReviewComments" class="review-banner card">
      <div class="review-banner-body">
        <p class="review-banner-label">Volgende stap</p>
        <p class="review-banner-message">
          Deze audit wacht op jouw reviewbeslissing.
        </p>
      </div>
      <button type="button" class="primary" @click="openReviewModal">Review indienen</button>
    </div>

    <ReviewFeedbackModal
      :open="reviewModalOpen"
      :audit-title="audit.title"
      :saving="reviewSaving"
      @close="reviewModalOpen = false"
      @submit="submitReview"
    />

    <section class="card table-card">
      <h2>Harmonized structure</h2>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Ref.</th>
              <th>Status</th>
              <th>Evidence / notes</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ref in hsRefs" :key="ref">
              <td class="td-ref">{{ ref }}</td>
              <td>
                <span v-if="hsMap[ref]?.status" class="badge">{{ hsMap[ref].status }}</span>
                <span v-else class="muted">—</span>
              </td>
              <td class="notes">{{ hsMap[ref]?.notes?.trim() || "—" }}</td>
              <td>
                <ReviewCommentToggle
                  :value="hsMap[ref]?.reviewComment ?? ''"
                  :editable="canEditReviewComments"
                  :saving="hsSaving === ref"
                  @save="(c) => saveHs(ref, c)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card table-card">
      <h2>Annex A</h2>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Ref.</th>
              <th>Control</th>
              <th>Status</th>
              <th>Evidence / notes</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in controlsInScope" :key="c.id">
              <td class="td-ref">{{ c.reference }}</td>
              <td>{{ c.title }}</td>
              <td>
                <span v-if="assessmentByControlId.get(c.id)?.complianceStatus" class="badge">
                  {{ assessmentByControlId.get(c.id)?.complianceStatus }}
                </span>
                <span v-else class="muted">—</span>
              </td>
              <td class="notes">{{ assessmentByControlId.get(c.id)?.notes?.trim() || "—" }}</td>
              <td>
                <ReviewCommentToggle
                  :value="assessmentByControlId.get(c.id)?.reviewComment ?? ''"
                  :editable="canEditReviewComments"
                  :saving="controlSaving === c.id"
                  @save="(comment) => saveControl(c.id, comment)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
  <p v-else-if="!err" class="muted">Laden…</p>
</template>

<style scoped>
.intro {
  margin: 0 0 1rem;
  color: rgba(255, 255, 255, 0.72);
}
.table-card {
  margin-top: 1rem;
}
.notes {
  max-width: 22rem;
  white-space: pre-wrap;
  font-size: 0.9rem;
}
.review-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  border-color: rgba(147, 197, 253, 0.35);
  background: rgba(37, 99, 235, 0.12);
}
.review-banner-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #93c5fd;
  font-weight: 600;
}
.review-banner-message {
  margin: 0.25rem 0 0;
}
</style>
