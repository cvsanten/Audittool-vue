<script setup lang="ts">
defineProps<{
  auditId: number;
  showReview?: boolean;
}>();
</script>

<template>
  <nav class="audit-subnav">
    <RouterLink :to="`/audits/${auditId}/edit`">Edit</RouterLink>
    <RouterLink v-if="showReview" :to="`/audits/${auditId}/review`">Review</RouterLink>
    <RouterLink to="/audits" class="muted-link">← Audits</RouterLink>
  </nav>
</template>

<style scoped>
.audit-subnav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 0 0 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.muted-link {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.62);
}
</style>
