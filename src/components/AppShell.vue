<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const showNav = computed(() => route.name !== "login" && auth.isLoggedIn);

function logout() {
  auth.logout();
  router.push({ name: "login" });
}
</script>

<template>
  <div class="app">
    <header v-if="showNav" class="app-header">
      <div class="app-brand">
        <strong>PURASEC Audit</strong>
        <span class="badge">Vue preview</span>
      </div>
      <nav class="app-nav">
        <RouterLink to="/">Dashboard</RouterLink>
        <RouterLink to="/audits">Audits</RouterLink>
      </nav>
      <div class="app-user">
        <span class="muted">{{ auth.organizationName }} · {{ auth.email }}</span>
        <button type="button" class="btn-sm secondary" @click="logout">Logout</button>
      </div>
    </header>
    <main class="app-main">
      <slot />
    </main>
  </div>
</template>
