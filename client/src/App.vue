<template>
  <div>
    <header>
      <RouterLink to="/" aria-label="Home">
        BudgetClick
      </RouterLink>

      <RouterLink to="/settings" aria-label="Settings" title="Settings">
        <GearIcon />
      </RouterLink>
    </header>

    <RouterView />
  </div>
</template>

<script setup lang="ts">
import GearIcon from "@/components/icons/gear.vue";
</script>