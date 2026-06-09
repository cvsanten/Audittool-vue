<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const email = ref("");
const password = ref("");
const err = ref<string | null>(null);
const busy = ref(false);

onMounted(() => {
  if (auth.isLoggedIn && auth.isStaff) router.replace({ name: "dashboard" });
});

async function submit() {
  err.value = null;
  busy.value = true;
  try {
    await auth.login(email.value.trim(), password.value);
    if (!auth.isStaff) {
      auth.logout();
      err.value = "Alleen staff (MAIN_ADMIN / AUDITOR) kan deze Vue-preview gebruiken.";
      return;
    }
    router.push({ name: "dashboard" });
  } catch (e) {
    err.value = e instanceof Error ? e.message : "Login mislukt";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="card login-card">
    <h1>Inloggen</h1>
    <p class="muted">Vue staging preview — zelfde backend als de React-app.</p>
    <form @submit.prevent="submit">
      <div class="form-row">
        <label for="email">Email</label>
        <input id="email" v-model="email" type="email" autocomplete="email" required />
      </div>
      <div class="form-row">
        <label for="password">Wachtwoord</label>
        <input id="password" v-model="password" type="password" autocomplete="current-password" required />
      </div>
      <p v-if="err" class="error">{{ err }}</p>
      <button type="submit" :disabled="busy">{{ busy ? "Bezig…" : "Inloggen" }}</button>
    </form>
  </div>
</template>

<style scoped>
.login-card {
  max-width: 480px;
  margin: 2rem auto;
}
</style>
