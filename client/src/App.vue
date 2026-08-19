<template>
  <div class="tw-flex tw-h-screen tw-flex-col">
    <Header />

    <main class="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-4 tw-py-2">
      <div v-if="!isManifestInitialized">
        <p>Storage is not initialized</p>
        <RouterView />
      </div>

      <RouterView v-else />
    </main>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import Footer from "@/components/layout/Footer.vue";
import Header from "@/components/layout/Header.vue";
import { getState } from "@/state";

const isManifestInitialized = computed(() => getState().manifest !== null);
</script>