import { createRouter, createWebHistory } from "vue-router";

import SettingsView from "@/views/SettingsView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/views/HomeView.vue"),
    },
    {
      path: "/settings",
      component: SettingsView,
    },
  ],
});