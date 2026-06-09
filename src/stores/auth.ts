import { defineStore } from "pinia";
import {
  clearSession,
  currentUserEmail,
  hasSession,
  isStaff,
  login as apiLogin,
  organizationName,
  role,
  setSession,
} from "../api/client";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    ready: false,
  }),
  getters: {
    isLoggedIn: () => hasSession(),
    isStaff: () => isStaff(),
    organizationName: () => organizationName(),
    role: () => role(),
    email: () => currentUserEmail(),
  },
  actions: {
    init() {
      this.ready = true;
    },
    async login(email: string, password: string) {
      const res = await apiLogin(email, password);
      setSession(res);
    },
    logout() {
      clearSession();
    },
  },
});
