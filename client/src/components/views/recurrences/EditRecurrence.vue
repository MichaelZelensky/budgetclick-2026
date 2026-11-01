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

    <Modal
      v-if="showRebuildModal"
      title="Rebuild Series"
      primary-button-label="Yes"
      secondary-button-label="No"
      @close="finish"
      @cancel="finish"
      @ok="confirmRebuild"
    >
      All planned transactions of this recurrence will be removed and new ones will be created. Actual transactions are kept. Rebuild the series?
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import Modal from "@/components/ui/Modal.vue";
import RecurrenceForm from "@/components/views/recurrences/RecurrenceForm.vue";
import { getState } from "@/state/state";
import { replaceRecurrenceTransactions, toRecurrenceFormData, updateRecurrence } from "@/recurrence";

const route = useRoute();
const router = useRouter();
const recurrence = getState().referenceData.recurrences?.recurrences.find(x => x.id === route.params.id && !x.isDeleted);

if (!recurrence) {
  throw new Error("Recurrence not found");
}

const form = ref(toRecurrenceFormData(recurrence));
const showRebuildModal = ref(false);

const save = async () => {
  await updateRecurrence(recurrence.id, form.value);
  showRebuildModal.value = true;
};

const finish = () => {
  showRebuildModal.value = false;
  router.push(`/recurrences/${recurrence.id}`);
};

const confirmRebuild = async () => {
  showRebuildModal.value = false;
  const updatedRecurrence = getState().referenceData.recurrences?.recurrences.find(x => x.id === recurrence.id);
  if (updatedRecurrence !== undefined) {
    await replaceRecurrenceTransactions(updatedRecurrence);
  }
  finish();
};

const back = () => {
  router.push(`/recurrences/${recurrence.id}`);
};
</script>