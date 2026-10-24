
<template>
  <div class="tw-flex tw-h-[100dvh] tw-flex-col">
    <Header />
    <main
      class="tw-min-h-0 tw-flex-1"
      :class="[
        isDashboard
          ? 'tw-overflow-hidden'
          : 'tw-overflow-y-auto tw-px-4 tw-pt-2 tw-pb-8',
      ]"
    >
      <RouterView v-slot="{ Component, route }">
        <KeepAlive>
          <component :is="Component" v-if="route.path !== '/editor'" />
        </KeepAlive>
        <component :is="Component" v-if="route.path === '/editor'" />
      </RouterView>
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
