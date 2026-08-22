import { createRouter, createWebHashHistory } from "vue-router";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/components/views/Dashboard.vue"),
    },
    {
      path: "/accounts",
      component: () => import("@/components/views/accounts/ListAccounts.vue"),
    },
    {
      path: "/accounts/create",
      component: () => import("@/components/views/accounts/CreateAccount.vue"),
    },
    {
      path: "/accounts/:id",
      component: () => import("@/components/views/accounts/ViewAccount.vue"),
    },
    {
      path: "/accounts/:id/edit",
      component: () => import("@/components/views/accounts/EditAccount.vue"),
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