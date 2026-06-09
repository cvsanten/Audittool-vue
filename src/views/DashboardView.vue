<script setup lang="ts">
import { onMounted, ref } from "vue";
import { fetchDashboard } from "../api/client";
import type { DashboardStats } from "../api/types";

const stats = ref<DashboardStats | null>(null);
const err = ref<string | null>(null);

onMounted(async () => {
  try {
    stats.value = await fetchDashboard();
  } catch (e) {
    err.value = e instanceof Error ? e.message : "Laden mislukt";
  }
});
</script>

<template>
  <div>
    <h1>Dashboard</h1>
    <p class="muted">Vue staging op <code>vue-staging.christavansanten.org</code></p>
    <p v-if="err" class="error">{{ err }}</p>
    <div v-if="stats" class="grid">
      <div class="card stat">
        <span class="muted">Audits</span>
        <strong>{{ stats.totalAudits }}</strong>
      </div>
      <div class="card stat">
        <span class="muted">Assessments</span>
        <strong>{{ stats.totalAssessments }}</strong>
      </div>
      <div class="card stat">
        <span class="muted">Findings</span>
        <strong>{{ stats.totalFindings }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.stat strong {
  font-size: 1.6rem;
}
</style>
