<template>
  <main>
    <h1>Welcome to BudgetClick</h1>

    <p>
      Your application is not configured yet.
    </p>

    <p>
      Please configure your storage and client ID to get started.
    </p>

    <p>
      You can optionally install BudgetClick as a PWA to use it offline.
    </p>

    <LiteButton to="/settings" @click="router.push('/settings')">
      Configure settings
    </LiteButton>
    
    <RouterLink to="/help" class="tw-ml-2">
      Get help
    </RouterLink>
  </main>
</template>

<script setup lang="ts">
import LiteButton from "@/components/ui/LiteButton.vue";
import { useRouter } from "vue-router";
const router = useRouter();
</script>