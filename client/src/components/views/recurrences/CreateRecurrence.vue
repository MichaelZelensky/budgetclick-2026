<template>
  <main>
    <h1>Create Recurrence</h1>

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
import { useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import RecurrenceForm from "@/components/views/recurrences/RecurrenceForm.vue";
import { createRecurrence, createRecurrenceForm } from "@/recurrence";

const router = useRouter();
const form = ref(createRecurrenceForm());

const save = async () => {
  await createRecurrence(form.value);
  form.value = createRecurrenceForm();
  router.push("/recurrences");
};

const back = () => {
  router.push("/recurrences");
};
</script>