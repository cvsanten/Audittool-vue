<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import AuditSubnav from "../components/AuditSubnav.vue";
import ComplianceStatusSelect from "../components/ComplianceStatusSelect.vue";
import { useAuditAccess } from "../composables/useAuditAccess";
import {
  fetchAssessments,
  fetchAudit,
  fetchIsoControls,
  updateAudit,
  upsertAssessment,
} from "../api/client";
import type { Assessment, Audit, AuditType, ComplianceStatus, IsoControl } from "../api/types";
import { buildAuditUpdateBody, hsPayloadFromCells } from "../domain/auditUpdate";
import { hsRowsInScope, parseHsMap, type HsCell } from "../domain/hs";

const props = defineProps<{ auditId: number }>();

const audit = ref<Audit | null>(null);
const assessments = ref<Assessment[]>([]);
const controls = ref<IsoControl[]>([]);
const err = ref<string | null>(null);
const toast = ref<string | null>(null);
const metaSaving = ref(false);
const hsSaving = ref<string | null>(null);
const annexSaving = ref<number | null>(null);

const editTitle = ref("");
const editOrganization = ref("");
const editType = ref<AuditType>("interne audit");
const editStartDate = ref("");
const editEndDate = ref("");
const editScope = ref("");

const hsCells = reactive<Record<string, HsCell>>({});
const annexDraft = reactive<Record<number, { status: ComplianceStatus | ""; notes: string }>>({});

const { canEditAuditContent, isAssignedReviewer } = useAuditAccess(audit);

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

function syncMetaForm(a: Audit) {
  editTitle.value = a.title;
  editOrganization.value = a.organizationName;
  editType.value = a.type;
  editStartDate.value = a.startDate;
  editEndDate.value = a.endDate ?? "";
  editScope.value = a.scope ?? "";
}

function syncHsCells(a: Audit) {
  const parsed = parseHsMap(a.harmonizedStructureConformance ?? null);
  for (const ref of hsRefs.value) {
    hsCells[ref] = { ...parsed[ref] };
  }
}

function syncAnnexDraft() {
  for (const c of controlsInScope.value) {
    const a = assessmentByControlId.value.get(c.id);
    annexDraft[c.id] = {
      status: a?.complianceStatus ?? "",
      notes: a?.notes ?? "",
    };
  }
}

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
  syncMetaForm(a);
  syncHsCells(a);
  syncAnnexDraft();
}

async function saveMetadata() {
  if (!audit.value || !canEditAuditContent.value) return;
  metaSaving.value = true;
  err.value = null;
  try {
    const scopeTrim = editScope.value.trim();
    const endNull = editEndDate.value.trim() === "" ? null : editEndDate.value.trim();
    audit.value = await updateAudit(
      audit.value.id,
      buildAuditUpdateBody(audit.value, {
        title: editTitle.value.trim() || audit.value.title,
        organizationName: editOrganization.value.trim() || audit.value.organizationName,
        type: editType.value,
        startDate: editStartDate.value.trim() || audit.value.startDate,
        endDate: endNull,
        scope: scopeTrim.length > 0 ? scopeTrim : null,
      }),
    );
    syncMetaForm(audit.value);
    toast.value = "Auditgegevens opgeslagen";
  } catch (e) {
    err.value = e instanceof Error ? e.message : "Opslaan mislukt";
  } finally {
    metaSaving.value = false;
  }
}

async function saveHs(ref: string) {
  if (!audit.value || !canEditAuditContent.value) return;
  const cell = hsCells[ref];
  if (!cell?.status) {
    err.value = "Kies een status voordat je opslaat.";
    return;
  }
  hsSaving.value = ref;
  err.value = null;
  try {
    audit.value = await updateAudit(
      audit.value.id,
      buildAuditUpdateBody(audit.value, {
        harmonizedStructureConformance: hsPayloadFromCells(hsCells),
      }),
    );
    syncHsCells(audit.value);
    toast.value = `HS ${ref} opgeslagen`;
  } catch (e) {
    err.value = e instanceof Error ? e.message : "Opslaan mislukt";
  } finally {
    hsSaving.value = null;
  }
}

async function saveAnnex(controlId: number) {
  if (!audit.value || !canEditAuditContent.value) return;
  const draft = annexDraft[controlId];
  if (!draft?.status) {
    err.value = "Kies een status voordat je opslaat.";
    return;
  }
  annexSaving.value = controlId;
  err.value = null;
  try {
    const existing = assessmentByControlId.value.get(controlId);
    await upsertAssessment(audit.value.id, {
      id: existing?.id,
      isoControlId: controlId,
      complianceStatus: draft.status,
      notes: draft.notes.trim() || null,
      auditee: null,
    });
    assessments.value = await fetchAssessments(audit.value.id);
    syncAnnexDraft();
    toast.value = "Annex-assessment opgeslagen";
  } catch (e) {
    err.value = e instanceof Error ? e.message : "Opslaan mislukt";
  } finally {
    annexSaving.value = null;
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
    <p class="muted">{{ audit.organizationName }} · {{ audit.status }} · {{ audit.type }}</p>

    <p v-if="isAssignedReviewer && audit.status === 'IN_REVIEW'" class="read-only-hint muted">
      Tijdens jouw review is auditcontent read-only. Gebruik de Review-tab voor commentaar.
    </p>
    <p v-else-if="!canEditAuditContent" class="read-only-hint muted">
      Auditcontent is alleen-lezen in deze status.
    </p>

    <p v-if="err" class="error">{{ err }}</p>
    <p v-if="toast" class="toast">{{ toast }}</p>

    <section class="card form-card">
      <h2>Auditgegevens</h2>
      <form @submit.prevent="saveMetadata">
        <fieldset :disabled="!canEditAuditContent || metaSaving">
          <div class="form-row">
            <label for="edit-title">Titel</label>
            <input id="edit-title" v-model="editTitle" type="text" required />
          </div>
          <div class="form-row">
            <label for="edit-org">Organisatie</label>
            <input id="edit-org" v-model="editOrganization" type="text" required />
          </div>
          <div class="form-row">
            <label for="edit-type">Type</label>
            <select id="edit-type" v-model="editType">
              <option value="GAP-analyse">GAP-analyse</option>
              <option value="interne audit">Interne audit</option>
            </select>
          </div>
          <div class="form-row grid-2">
            <div>
              <label for="edit-start">Startdatum</label>
              <input id="edit-start" v-model="editStartDate" type="date" required />
            </div>
            <div>
              <label for="edit-end">Einddatum (optioneel)</label>
              <input id="edit-end" v-model="editEndDate" type="date" />
            </div>
          </div>
          <div class="form-row">
            <label for="edit-scope">Scope (optioneel)</label>
            <textarea id="edit-scope" v-model="editScope" rows="3" />
          </div>
          <button type="submit" :disabled="metaSaving">
            {{ metaSaving ? "Opslaan…" : "Auditgegevens opslaan" }}
          </button>
        </fieldset>
      </form>
    </section>

    <section class="card table-card">
      <h2>Harmonized structure</h2>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Ref.</th>
              <th>Status</th>
              <th>Evidence / notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ref in hsRefs" :key="ref">
              <td class="td-ref">{{ ref }}</td>
              <td>
                <ComplianceStatusSelect
                  v-if="hsCells[ref]"
                  v-model="hsCells[ref].status"
                  :disabled="!canEditAuditContent || hsSaving === ref"
                />
              </td>
              <td>
                <textarea
                  v-if="hsCells[ref]"
                  v-model="hsCells[ref].notes"
                  rows="2"
                  class="inline-notes"
                  :disabled="!canEditAuditContent || hsSaving === ref"
                />
              </td>
              <td>
                <button
                  type="button"
                  class="btn-sm secondary"
                  :disabled="!canEditAuditContent || hsSaving === ref"
                  @click="saveHs(ref)"
                >
                  {{ hsSaving === ref ? "…" : "Opslaan" }}
                </button>
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in controlsInScope" :key="c.id">
              <td class="td-ref">{{ c.reference }}</td>
              <td>{{ c.title }}</td>
              <td>
                <ComplianceStatusSelect
                  v-if="annexDraft[c.id]"
                  v-model="annexDraft[c.id].status"
                  :disabled="!canEditAuditContent || annexSaving === c.id"
                />
              </td>
              <td>
                <textarea
                  v-if="annexDraft[c.id]"
                  v-model="annexDraft[c.id].notes"
                  rows="2"
                  class="inline-notes"
                  :disabled="!canEditAuditContent || annexSaving === c.id"
                />
              </td>
              <td>
                <button
                  type="button"
                  class="btn-sm secondary"
                  :disabled="!canEditAuditContent || annexSaving === c.id"
                  @click="saveAnnex(c.id)"
                >
                  {{ annexSaving === c.id ? "…" : "Opslaan" }}
                </button>
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
.form-card,
.table-card {
  margin-top: 1rem;
}
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.inline-notes {
  width: 100%;
  min-width: 14rem;
  font-size: 0.9rem;
}
.read-only-hint {
  margin: 0 0 1rem;
  font-size: 0.9rem;
}
</style>
