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
      path: "/contractors",
      component: () => import("@/components/views/contractors/ListContractors.vue"),
    },
    {
      path: "/contractors/create",
      component: () => import("@/components/views/contractors/CreateContractor.vue"),
    },
    {
      path: "/contractors/:id",
      component: () => import("@/components/views/contractors/ViewContractor.vue"),
    },
    {
      path: "/contractors/:id/edit",
      component: () => import("@/components/views/contractors/EditContractor.vue"),
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