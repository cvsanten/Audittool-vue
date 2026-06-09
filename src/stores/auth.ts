import { defineStore } from "pinia";
import {
  clearSession,
  currentUserEmail,
  login as apiLogin,
  readSession,
  setSession,
} from "../api/client";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    ready: false,
    organizationName: null as string | null,
    role: null as string | null,
    accessToken: null as string | null,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.accessToken && state.organizationName && state.role),
    isStaff: (state) => state.role === "MAIN_ADMIN" || state.role === "AUDITOR",
    email: () => currentUserEmail(),
  },
  actions: {
    init() {
      Object.assign(this, readSession());
      this.ready = true;
    },
    applySession(session: ReturnType<typeof readSession>) {
      this.organizationName = session.organizationName;
      this.role = session.role;
      this.accessToken = session.accessToken;
    },
    async login(email: string, password: string) {
      const res = await apiLogin(email, password);
      setSession(res);
      this.applySession(readSession());
    },
    logout() {
      clearSession();
      this.organizationName = null;
      this.role = null;
      this.accessToken = null;
    },
  },
});
