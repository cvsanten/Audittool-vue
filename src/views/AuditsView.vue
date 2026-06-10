<script setup lang="ts">
import { onMounted, ref } from "vue";
import { fetchAudits } from "../api/client";
import type { Audit } from "../api/types";

const audits = ref<Audit[]>([]);
const err = ref<string | null>(null);

onMounted(async () => {
  try {
    const page = await fetchAudits();
    audits.value = page.content;
  } catch (e) {
    err.value = e instanceof Error ? e.message : "Laden mislukt";
  }
});
</script>

<template>
  <div>
    <h1>Audits</h1>
    <p v-if="err" class="error">{{ err }}</p>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Titel</th>
            <th>Organisatie</th>
            <th>Status</th>
            <th>Lead auditor</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in audits" :key="a.id">
            <td>{{ a.title }}</td>
            <td class="muted">{{ a.organizationName }}</td>
            <td><span class="badge">{{ a.status }}</span></td>
            <td class="muted">{{ a.auditorName }}</td>
            <td class="actions">
              <RouterLink :to="`/audits/${a.id}/edit`" class="btn-sm secondary">Edit</RouterLink>
              <RouterLink
                v-if="a.status === 'IN_REVIEW'"
                :to="`/audits/${a.id}/review`"
                class="btn-sm secondary"
              >
                Review
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
</style>
