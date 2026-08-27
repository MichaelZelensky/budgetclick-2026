import { createRouter, createWebHashHistory } from "vue-router";
import { getRequiredSetupRoute } from "@/setup";

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
      path: "/categories",
      component: () => import("@/components/views/categories/ListCategories.vue"),
    },
    {
      path: "/categories/create",
      component: () => import("@/components/views/categories/CreateCategory.vue"),
    },
    {
      path: "/categories/:id",
      component: () => import("@/components/views/categories/ViewCategory.vue"),
    },
    {
      path: "/categories/:id/edit",
      component: () => import("@/components/views/categories/EditCategory.vue"),
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
      path: "/setup/client-id",
      component: () => import("@/components/views/setup/ClientId.vue"),
    },
    {
      path: "/setup/storage",
      component: () => import("@/components/views/setup/Storage.vue"),
    },
    {
      path: "/setup/passphrase-create",
      component: () => import("@/components/views/setup/PassphraseCreate.vue"),
    },
    {
      path: "/setup/passphrase-unlock",
      component: () => import("@/components/views/setup/PassphraseUnlock.vue"),
    },
    {
      path: "/setup/account",
      component: () => import("@/components/views/setup/CreateAccount.vue"),
    },
    {
      path: "/setup/complete",
      component: () => import("@/components/views/setup/Complete.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      component: () => import("@/components/views/NotFound.vue"),
    },
  ],
});

router.beforeEach(async to => {
  if (to.path === "/settings" || to.path === "/help") {
    return true;
  }
  if (to.path.startsWith("/setup/")) {
    return true;
  }
  const requiredRoute = await getRequiredSetupRoute();
  if (requiredRoute !== null && requiredRoute !== to.path) {
    return requiredRoute;
  }
  return true;
});