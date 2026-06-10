import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "login", component: () => import("../views/LoginView.vue"), meta: { public: true } },
    { path: "/", name: "dashboard", component: () => import("../views/DashboardView.vue") },
    { path: "/audits", name: "audits", component: () => import("../views/AuditsView.vue") },
    {
      path: "/audits/:id/edit",
      name: "audit-edit",
      component: () => import("../views/AuditEditView.vue"),
      props: (route) => ({ auditId: Number(route.params.id) }),
    },
    {
      path: "/audits/:id/review",
      name: "audit-review",
      component: () => import("../views/AuditReviewView.vue"),
      props: (route) => ({ auditId: Number(route.params.id) }),
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!auth.ready) auth.init();
  if (to.meta.public) return true;
  if (!auth.isLoggedIn) return { name: "login" };
  if (!auth.isStaff) {
    auth.logout();
    return { name: "login" };
  }
  return true;
});

export default router;
