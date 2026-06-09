<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ReviewCommentToggle from "../components/ReviewCommentToggle.vue";
import {
  currentUserEmail,
  currentUserId,
  fetchAssessments,
  fetchAudit,
  fetchIsoControls,
  upsertControlReviewComment,
  upsertHsReviewComment,
} from "../api/client";
import type { Assessment, Audit, IsoControl } from "../api/types";
import { hsRowsInScope, parseHsMap } from "../domain/hs";

const props = defineProps<{ auditId: number }>();
const router = useRouter();

const audit = ref<Audit | null>(null);
const assessments = ref<Assessment[]>([]);
const controls = ref<IsoControl[]>([]);
const err = ref<string | null>(null);
const hsSaving = ref<string | null>(null);
const controlSaving = ref<number | null>(null);

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

function matchesUser(userId?: number | null, email?: string | null): boolean {
  const uid = currentUserId();
  if (uid != null && userId != null && Number(userId) === Number(uid)) return true;
  const em = currentUserEmail()?.toLowerCase();
  const linked = email?.trim().toLowerCase();
  return Boolean(em && linked && em === linked);
}

const isAssignedReviewer = computed(
  () =>
    audit.value?.status === "IN_REVIEW"
    && matchesUser(audit.value.reviewerUserId, audit.value.reviewerEmail),
);

const canEditReviewComments = computed(() => isAssignedReviewer.value);

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

onMounted(() => {
  load().catch((e) => {
    err.value = e instanceof Error ? e.message : "Laden mislukt";
  });
});
</script>

<template>
  <div v-if="audit">
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
</style>
