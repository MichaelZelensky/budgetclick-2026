<template>
  <div class="tw-flex tw-h-screen tw-flex-col">
    <Header />

    <main
      class="tw-min-h-0 tw-flex-1 tw-overflow-y-auto"
      :class="{ 'tw-px-4 tw-pt-2 tw-pb-8': !isDashboard || isFirstLaunch }"
    >
      <Setup v-if="isFirstLaunch && isDashboard" />
      <RouterView v-else />
    </main>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import Footer from "@/components/layout/Footer.vue";
import Header from "@/components/layout/Header.vue";
import Setup from "@/components/Setup.vue";
import { useRoute } from "vue-router";
import { getSettings } from "./state/modules/settings";

const route = useRoute();

const isFirstLaunch = computed(() => getSettings().storage === "-" || getSettings().clientId === "-");
const isDashboard = computed(() => route.path === "/");
</script>