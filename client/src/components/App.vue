<template>
  <div class="tw-flex tw-h-screen tw-flex-col">
    <Header />
    <main
      class="tw-min-h-0 tw-flex-1 tw-overflow-y-auto"
      :class="{ 'tw-px-4 tw-pt-2 tw-pb-8': !isDashboard }"
    >
      <RouterView />
    </main>
    <Footer />
    <SpinnerOverlay />
    <ErrorOverlay />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ErrorOverlay from "@/components/ui/overlays/ErrorOverlay.vue";
import Footer from "@/components/layout/Footer.vue";
import Header from "@/components/layout/Header.vue";
import SpinnerOverlay from "@/components/ui/overlays/SpinnerOverlay.vue";
import { useRoute } from "vue-router";

const route = useRoute();

const isDashboard = computed(() => route.path === "/");
</script>