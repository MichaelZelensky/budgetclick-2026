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

    <Modal
      v-if="showGenerateModal"
      title="Generate Transactions"
      primary-button-label="Yes"
      secondary-button-label="No"
      @close="finish"
      @cancel="finish"
      @ok="confirmGenerate"
    >
      Create all planned transactions of this recurrence and recalculate statistics?
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import Modal from "@/components/ui/Modal.vue";
import RecurrenceForm from "@/components/views/recurrences/RecurrenceForm.vue";
import { createRecurrence, createRecurrenceForm, createRecurrenceFormFromTransaction, replaceRecurrenceTransactions } from "@/recurrence";
import type { Recurrence } from "@/types/data/Recurrence";

const route = useRoute();
const router = useRouter();
const form = ref(createRecurrenceForm());
const showGenerateModal = ref(false);
const createdRecurrence = ref<Recurrence | undefined>();

watch(
  () => route.query.transactionId,
  transactionId => {
    if (transactionId !== undefined) {
      form.value = createRecurrenceFormFromTransaction(String(route.query.month), String(transactionId));
    }
  },
  { immediate: true },
);

const save = async () => {
  createdRecurrence.value = await createRecurrence(form.value);
  showGenerateModal.value = true;
};

const finish = () => {
  showGenerateModal.value = false;
  form.value = createRecurrenceForm();
  router.push("/recurrences");
};

const confirmGenerate = async () => {
  showGenerateModal.value = false;
  if (createdRecurrence.value !== undefined) {
    await replaceRecurrenceTransactions(createdRecurrence.value);
  }
  finish();
};

const back = () => {
  router.push("/recurrences");
};
</script>