<template>
  <main v-if="recurrence">
    <h1>{{ recurrence.description }}</h1>

    <p>{{ describeRecurrence(recurrence) }}</p>
    <p>{{ recurrence.startDate }} - {{ recurrence.endDate }}</p>
    <p>{{ recurrence.direction === "in" ? "Income" : "Outcome" }}: {{ formatNumber(recurrence.amount) }}</p>
    <p>Account: {{ getAccountName(recurrence.accountId) }}</p>
    <p v-if="recurrence.comment">{{ recurrence.comment }}</p>

    <ButtonGroup>
      <LiteButton @click="edit">
        Edit
      </LiteButton>
      <LiteButton @click="showSeriesModal = true">
        Create series
      </LiteButton>
      <LiteButton @click="showDeleteModal = true">
        Delete
      </LiteButton>
      <LiteButton @click="back">
        Back
      </LiteButton>
    </ButtonGroup>

    <Modal
      v-if="showSeriesModal"
      title="Create Series"
      primary-button-label="Create"
      secondary-button-label="Cancel"
      @close="showSeriesModal = false"
      @cancel="showSeriesModal = false"
      @ok="confirmSeries"
    >
      All planned transactions of this recurrence will be removed and new ones will be created. Actual transactions are kept.
    </Modal>
    <Modal
      v-if="showDeleteModal"
      title="Delete Recurrence"
      primary-button-label="Delete planned"
      secondary-button-label="Keep planned"
      @close="showDeleteModal = false"
      @cancel="confirmDelete(false)"
      @ok="confirmDelete(true)"
    >
      This recurrence will be deleted. Choose what happens to its planned transactions: delete them, or keep them. Actual transactions are always kept. Kept transactions are detached from the recurrence and will no longer be linked to it. Closing this dialog cancels the deletion.
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import Modal from "@/components/ui/Modal.vue";
import { getState } from "@/state/state";
import { deleteRecurrence, describeRecurrence, getAccountName, replaceRecurrenceTransactions } from "@/recurrence";
import { formatNumber } from "@/utils/number";

const route = useRoute();
const router = useRouter();
const showDeleteModal = ref(false);
const showSeriesModal = ref(false);

const recurrence = computed(() =>
  getState().referenceData.recurrences?.recurrences.find(x => x.id === route.params.id && !x.isDeleted),
);

const edit = () => {
  router.push(`/recurrences/${route.params.id}/edit`);
};

const confirmSeries = async () => {
  showSeriesModal.value = false;
  if (recurrence.value !== undefined) {
    await replaceRecurrenceTransactions(recurrence.value);
  }
};

const confirmDelete = async (deletePlanned: boolean) => {
  showDeleteModal.value = false;
  await deleteRecurrence(String(route.params.id), deletePlanned);
  router.push("/recurrences");
};

const back = () => {
  router.push("/recurrences");
};
</script>