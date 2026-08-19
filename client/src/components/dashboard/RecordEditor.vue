<template>
  <DashboardWidget>
    <h2>Add / Edit Record</h2>

    <div class="tw-grid tw-gap-2">
      <LiteInputField placeholder="Description" />
      <LiteInputField type="number" placeholder="Amount" />

      <ButtonGroup>
        <LiteButton>
          Save
        </LiteButton>
        <LiteButton>
          Cancel
        </LiteButton>
      </ButtonGroup>
    </div>
  </DashboardWidget>
</template>

<script setup lang="ts">
import DashboardWidget from "@/components/dashboard/DashboardWidget.vue";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
</script>