import { createRouter, createWebHashHistory } from "vue-router";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/components/views/Dashboard.vue"),
    },
    {
      path: "/settings",
      component: () => import("@/components/views/Settings.vue"),
    },
    {
      path: "/help",
      component: () => import("@/components/views/Help.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      component: () => import("@/components/views/NotFound.vue"),
    },
  ],
});