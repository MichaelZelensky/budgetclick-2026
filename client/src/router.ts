import { createRouter, createWebHashHistory } from "vue-router";

import SettingsView from "@/views/SettingsView.vue";

export const router = createRouter({
  history: createWebHashHistory(),
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
