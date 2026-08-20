<template>
  <div class="tw-flex tw-h-screen tw-flex-col">
    <Header />

    <main
      class="tw-min-h-0 tw-flex-1 tw-overflow-y-auto"
      :class="{ 'tw-px-4 tw-py-2': !isDashboard }"
    >
      <InlineAlert v-if="!isManifestInitialized" variant="warning">
        Storage is not initialized or misconfigured. Please check your settings and ensure that the storage is properly configured.
      </InlineAlert>

      <RouterView />
    </main>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import Footer from "@/components/layout/Footer.vue";
import Header from "@/components/layout/Header.vue";
import InlineAlert from "@/components/ui/InlineAlert.vue";
import { getState } from "@/state";

const route = useRoute();

const isDashboard = computed(() => route.path === "/");
const isManifestInitialized = computed(() => getState().manifest !== null);
</script>