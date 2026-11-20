import { createRouter, createWebHashHistory } from "vue-router";
import { getRequiredSetupRoute } from "@/setup";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/gui/views/Dashboard.vue"),
    },
    {
      path: "/editor",
      component: () => import("@/gui/views/ImageEditor.vue"),
    },
    {
      path: "/accounts",
      component: () => import("@/gui/views/accounts/ListAccounts.vue"),
    },
    {
      path: "/accounts/create",
      component: () => import("@/gui/views/accounts/CreateAccount.vue"),
    },
    {
      path: "/accounts/:id",
      component: () => import("@/gui/views/accounts/ViewAccount.vue"),
    },
    {
      path: "/accounts/:id/edit",
      component: () => import("@/gui/views/accounts/EditAccount.vue"),
    },
    {
      path: "/categories",
      component: () => import("@/gui/views/categories/ListCategories.vue"),
    },
    {
      path: "/categories/create",
      component: () => import("@/gui/views/categories/CreateCategory.vue"),
    },
    {
      path: "/categories/:id",
      component: () => import("@/gui/views/categories/ViewCategory.vue"),
    },
    {
      path: "/categories/:id/edit",
      component: () => import("@/gui/views/categories/EditCategory.vue"),
    },
    {
      path: "/contractors",
      component: () => import("@/gui/views/contractors/ListContractors.vue"),
    },
    {
      path: "/contractors/create",
      component: () => import("@/gui/views/contractors/CreateContractor.vue"),
    },
    {
      path: "/contractors/:id",
      component: () => import("@/gui/views/contractors/ViewContractor.vue"),
    },
    {
      path: "/contractors/:id/edit",
      component: () => import("@/gui/views/contractors/EditContractor.vue"),
    },
    {
      path: "/rates",
      component: () => import("@/gui/views/rates/ListRates.vue"),
    },
    {
      path: "/rates/create",
      component: () => import("@/gui/views/rates/CreateRate.vue"),
    },
    {
      path: "/rates/:id",
      component: () => import("@/gui/views/rates/ViewRate.vue"),
    },
    {
      path: "/rates/:id/edit",
      component: () => import("@/gui/views/rates/EditRate.vue"),
    },
    {
      path: "/recurrences",
      component: () => import("@/gui/views/recurrences/ListRecurrences.vue"),
    },
    {
      path: "/recurrences/create",
      component: () => import("@/gui/views/recurrences/CreateRecurrence.vue"),
    },
    {
      path: "/recurrences/:id",
      component: () => import("@/gui/views/recurrences/ViewRecurrence.vue"),
    },
    {
      path: "/recurrences/:id/edit",
      component: () => import("@/gui/views/recurrences/EditRecurrence.vue"),
    },
    {
      path: "/settings",
      component: () => import("@/gui/views/Settings.vue"),
    },
    {
      path: "/help",
      component: () => import("@/gui/views/Help.vue"),
    },
    {
      path: "/setup/before-you-start",
      component: () => import("@/gui/views/setup/BeforeYouStart.vue"),
    },
    {
      path: "/setup/client-id",
      component: () => import("@/gui/views/setup/ClientId.vue"),
    },
    {
      path: "/setup/storage",
      component: () => import("@/gui/views/setup/Storage.vue"),
    },
    {
      path: "/setup/passphrase-create",
      component: () => import("@/gui/views/setup/PassphraseCreate.vue"),
    },
    {
      path: "/setup/passphrase-unlock",
      component: () => import("@/gui/views/setup/PassphraseUnlock.vue"),
    },
    {
      path: "/setup/account",
      component: () => import("@/gui/views/setup/CreateAccount.vue"),
    },
    {
      path: "/setup/complete",
      component: () => import("@/gui/views/setup/Complete.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      component: () => import("@/gui/views/NotFound.vue"),
    },
  ],
});

let routeLoadingId: string | null = null;

router.beforeEach(async to => {
  if (routeLoadingId !== null) {
    setLoadingOff(routeLoadingId);
  }
  routeLoadingId = setLoadingOn();

  if (to.path === "/help") {
    return true;
  }
  const requiredRoute = await getRequiredSetupRoute();
  if (to.path === "/setup/complete") {
    return requiredRoute === null ? true : requiredRoute;
  }
  if (to.path.startsWith("/setup/")) {
    return requiredRoute === to.path ? true : requiredRoute ?? "/";
  }
  if (requiredRoute !== null && requiredRoute !== to.path) {
    return requiredRoute;
  }
  return true;
});

router.afterEach(() => {
  if (routeLoadingId !== null) {
    setLoadingOff(routeLoadingId);
    routeLoadingId = null;
  }
});

router.onError(() => {
  if (routeLoadingId !== null) {
    setLoadingOff(routeLoadingId);
    routeLoadingId = null;
  }
});