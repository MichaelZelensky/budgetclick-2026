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
      <LiteButton @click="showDeleteModal = true">
        Delete
      </LiteButton>
      <LiteButton @click="back">
        Back
      </LiteButton>
    </ButtonGroup>

    <Modal
      v-if="showDeleteModal"
      title="Delete Recurrence"
      secondary-button-label="Cancel"
      @close="showDeleteModal = false"
      @cancel="showDeleteModal = false"
      @ok="confirmDelete"
    >
      Delete this recurrence?
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
import { deleteRecurrence, describeRecurrence, getAccountName } from "@/recurrence";
import { formatNumber } from "@/utils/number";

const route = useRoute();
const router = useRouter();
const showDeleteModal = ref(false);

const recurrence = computed(() =>
  getState().referenceData.recurrences?.recurrences.find(x => x.id === route.params.id && !x.isDeleted),
);

const edit = () => {
  router.push(`/recurrences/${route.params.id}/edit`);
};

const confirmDelete = async () => {
  showDeleteModal.value = false;
  await deleteRecurrence(String(route.params.id));
  router.push("/recurrences");
};

const back = () => {
  router.push("/recurrences");
};
</script>