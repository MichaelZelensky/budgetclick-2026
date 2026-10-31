<template>
  <main>
    <h1>Edit Recurrence</h1>

    <RecurrenceForm v-model="form" />

    <ButtonGroup>
      <LiteButton @click="save">
        Save
      </LiteButton>
      <LiteButton @click="back">
        Cancel
      </LiteButton>
    </ButtonGroup>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import RecurrenceForm from "@/components/views/recurrences/RecurrenceForm.vue";
import { getState } from "@/state/state";
import { toRecurrenceFormData, updateRecurrence } from "@/recurrence";

const route = useRoute();
const router = useRouter();
const recurrence = getState().referenceData.recurrences?.recurrences.find(x => x.id === route.params.id && !x.isDeleted);

if (!recurrence) {
  throw new Error("Recurrence not found");
}

const form = ref(toRecurrenceFormData(recurrence));

const save = async () => {
  await updateRecurrence(recurrence.id, form.value);
  router.push(`/recurrences/${recurrence.id}`);
};

const back = () => {
  router.push(`/recurrences/${recurrence.id}`);
};
</script>