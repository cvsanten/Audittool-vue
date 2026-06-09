<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  value: string;
  editable: boolean;
  saving?: boolean;
}>();

const emit = defineEmits<{
  save: [comment: string | null];
}>();

const editing = ref(false);
const draft = ref("");

function startEdit() {
  if (!props.editable) return;
  draft.value = props.value;
  editing.value = true;
}

function blurSave() {
  const trimmed = draft.value.trim();
  const prev = props.value.trim();
  editing.value = false;
  if (trimmed === prev) return;
  emit("save", trimmed ? trimmed : null);
}
</script>

<template>
  <div class="review-comment">
    <template v-if="!value.trim() && !editing">
      <button
        v-if="editable"
        type="button"
        class="icon-btn"
        title="Reviewcommentaar toevoegen"
        aria-label="Reviewcommentaar toevoegen"
        @click="startEdit"
      >
        +
      </button>
      <span v-else class="muted">—</span>
    </template>
    <template v-else-if="editing">
      <textarea
        v-model="draft"
        rows="2"
        class="review-comment__field"
        placeholder="Feedback voor de hoofdauditor…"
        :disabled="saving"
        @blur="blurSave"
      />
    </template>
    <template v-else>
      <p class="review-comment__text">{{ value.trim() }}</p>
      <button
        v-if="editable"
        type="button"
        class="icon-btn icon-btn--filled"
        title="Bewerken"
        aria-label="Reviewcommentaar bewerken"
        @click="startEdit"
      >
        💬
      </button>
    </template>
    <span v-if="saving" class="muted saving">Opslaan…</span>
  </div>
</template>

<style scoped>
.review-comment {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
}
.review-comment__text {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.45;
  white-space: pre-wrap;
  flex: 1;
}
.review-comment__field {
  width: 100%;
  font-size: 0.88rem;
}
.saving {
  font-size: 0.78rem;
}
</style>
