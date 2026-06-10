<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ReviewDecision } from "../api/types";

const props = defineProps<{
  open: boolean;
  auditTitle: string;
  saving: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [payload: { decision: ReviewDecision; comment: string }];
}>();

const decision = ref<ReviewDecision>("APPROVED");
const comment = ref("");

const sendBackRequiresComment = computed(
  () => decision.value === "SEND_BACK" && comment.value.trim().length === 0,
);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    decision.value = "APPROVED";
    comment.value = "";
  },
);

function onBackdropMouseDown() {
  if (!props.saving) emit("close");
}

function onSubmit() {
  emit("submit", { decision: decision.value, comment: comment.value.trim() });
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal-backdrop"
      role="presentation"
      @mousedown="onBackdropMouseDown"
    >
      <div
        class="modal-panel modal-panel--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-feedback-title"
        @mousedown.stop
      >
        <div class="modal-header">
          <div>
            <p class="modal-kicker">Reviewer feedback</p>
            <h3 id="review-feedback-title" class="modal-title modal-title--left">
              {{ auditTitle }}
            </h3>
            <p class="modal-meta">
              Keur de audit goed om deze op Completed te zetten, of stuur terug naar de
              hoofdauditor met een toelichting.
            </p>
          </div>
          <button
            type="button"
            class="modal-close secondary"
            aria-label="Sluiten"
            :disabled="saving"
            @click="emit('close')"
          >
            ×
          </button>
        </div>

        <form @submit.prevent="onSubmit">
          <div class="form-row">
            <label for="review-decision">Besluit</label>
            <select id="review-decision" v-model="decision" :disabled="saving">
              <option value="APPROVED">Goedkeuren — markeer als Completed</option>
              <option value="SEND_BACK">Terugsturen naar hoofdauditor</option>
            </select>
          </div>

          <div class="form-row">
            <label for="review-comment">
              {{
                decision === "SEND_BACK"
                  ? "Toelichting voor hoofdauditor (verplicht)"
                  : "Toelichting voor hoofdauditor (optioneel)"
              }}
            </label>
            <textarea
              id="review-comment"
              v-model="comment"
              rows="6"
              maxlength="4000"
              placeholder="Wat moet worden verbeterd? Specifieke assessments, evidence-gaten, vervolgacties…"
              :disabled="saving"
            />
          </div>

          <div class="modal-actions">
            <button type="button" class="secondary" :disabled="saving" @click="emit('close')">
              Annuleren
            </button>
            <button type="submit" :disabled="saving || sendBackRequiresComment">
              {{
                saving
                  ? "Opslaan…"
                  : decision === "APPROVED"
                    ? "Goedkeuren"
                    : "Terugsturen"
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
