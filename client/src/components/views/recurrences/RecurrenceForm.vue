<template>
  <div class="tw-mb-4 tw-grid tw-max-w-xl tw-gap-8">
    <section class="tw-grid tw-gap-4 tw-mt-4">
      <div class="tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-2 sm:tw-grid-cols-2">
        <label class="tw-grid tw-gap-1">
          <span class="tw-text-sm tw-mb-1">Amount</span>
          <LiteInputField v-model="form.amount" type="number" :allow-negative="false" />
        </label>

        <label class="tw-grid tw-gap-1">
          <span class="tw-text-sm">Account</span>
          <LiteSelect v-model="form.accountId" :options="accountOptions" title="Account" />
        </label>  
      </div>

      <LiteToggle :model-value="form.direction === 'in'" @update:model-value="setIncome">
        Income
      </LiteToggle>

      <label class="tw-grid tw-gap-1">
        <span class="tw-text-sm">Description</span>
        <LiteInputField v-model="form.description" />
      </label>

      <div class="tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-2 sm:tw-grid-cols-2">
        <label class="tw-grid tw-gap-1">
          <span class="tw-text-sm">Category</span>
          <LiteSelect v-model="form.categoryId" :options="categoryOptions" title="Category" />
        </label>
        <label class="tw-grid tw-gap-1">
          <span class="tw-text-sm">Contractor</span>
          <LiteSelect v-model="form.contractorId" :options="contractorOptions" title="Contractor" />
        </label>
      </div>

      <label class="tw-grid tw-gap-1">
        <span class="tw-text-sm">Comment</span>
        <LiteTextarea v-model="form.comment" :rows="3" />
      </label>
    </section>

    <section class="tw-grid tw-gap-4">
      <h2 class="">
        Schedule
      </h2>

      <div class="tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-2 sm:tw-grid-cols-2">
        <label class="tw-grid tw-gap-1">
          <span class="tw-text-sm">Frequency</span>
          <LiteSelect v-model="form.frequency" :options="frequencyOptions" title="Frequency" />
        </label>

        <label class="tw-grid tw-gap-1">
          <span class="tw-text-sm tw-mb-1">Repeat every (n)</span>
          <LiteInputField v-model="form.interval" type="number" :allow-negative="false" />
        </label>
      </div>

      <div class="tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-2 sm:tw-grid-cols-2">
        <label class="tw-grid tw-gap-1">
          <span class="tw-text-sm">Start date</span>
          <LiteInputField v-model="form.startDate" type="date" />
        </label>

        <label class="tw-grid tw-gap-1">
          <span class="tw-text-sm">End date</span>
          <LiteInputField v-model="form.endDate" type="date" />
        </label>
      </div>

      <div v-if="form.frequency === 'weekly'" class="tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-2">
        <label v-for="(name, index) in weekdayNames" :key="name" class="tw-flex tw-items-center tw-gap-1">
          <input v-model="form.weekdays" type="checkbox" :value="index" />
          {{ name.slice(0, 3) }}
        </label>
      </div>

      <div v-if="form.frequency === 'monthly'" class="tw-grid tw-gap-4">
        <div class="tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-2 sm:tw-grid-cols-2">
          <label class="tw-grid tw-gap-1">
            <span class="tw-text-sm">When</span>
            <LiteSelect v-model="form.monthlyType" :options="monthlyTypeOptions" title="Monthly pattern" />
          </label>

          <label v-if="form.monthlyType === 'date'" class="tw-grid tw-gap-1">
            <span class="tw-text-sm">Day of month</span>
            <LiteInputField v-model="form.monthlyDay" type="number" :allow-negative="false" />
          </label>
        </div>

<div v-if="form.monthlyType !== 'date'" class="tw-grid tw-grid-cols-2 tw-gap-x-4">
  <LiteSelect v-model="form.monthlyOrdinal" :options="ordinalOptions" title="Occurrence" />
  <LiteSelect v-model="form.monthlyWeekday" :options="weekdayOptions" title="Weekday" />
</div>
      </div>

      <div v-if="form.frequency === 'annually'" class="tw-grid tw-grid-cols-1 tw-gap-x-4 sm:tw-grid-cols-2">
        <LiteSelect v-model="form.month" :options="monthOptions" title="Month" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import LiteSelect from "@/components/ui/lite-select/LiteSelect.vue";
import LiteTextarea from "@/components/ui/LiteTextarea.vue";
import LiteToggle from "@/components/ui/LiteToggle.vue";
import type { Option } from "@/components/ui/lite-select/LiteSelect.types";
import { getState } from "@/state/state";
import { monthNames, RecurrenceFormData, weekdayNames } from "@/recurrence";

const form = defineModel<RecurrenceFormData>({ required: true });

const frequencyOptions: Option[] = [
  { value: "daily", text: "Daily" },
  { value: "weekly", text: "Weekly" },
  { value: "monthly", text: "Monthly" },
  { value: "annually", text: "Annually" },
];
const monthlyTypeOptions: Option[] = [
  { value: "date", text: "On a day of the month" },
  { value: "weekday", text: "On a weekday" },
];
const ordinalOptions: Option[] = [
  { value: "1", text: "First" },
  { value: "2", text: "Second" },
  { value: "3", text: "Third" },
  { value: "4", text: "Fourth" },
  { value: "-1", text: "Last" },
];
const weekdayOptions: Option[] = weekdayNames.map((name, index) => ({
  value: String(index),
  text: name,
}));
const monthOptions: Option[] = monthNames.map((name, index) => ({
  value: String(index + 1),
  text: name,
}));

const accountOptions = computed<Option[]>(() =>
  getState().referenceData.accounts?.accounts.map(account => ({
    value: account.id,
    text: account.name,
  })) ?? []
);

const categoryOptions = computed<Option[]>(() => [
  { value: "", text: "Select category" },
  ...(getState().referenceData.categories?.categories.map(category => ({
    value: category.id,
    text: category.name,
  })) ?? []),
]);

const contractorOptions = computed<Option[]>(() => [
  { value: "", text: "Select contractor" },
  ...(getState().referenceData.contractors?.contractors.map(contractor => ({
    value: contractor.id,
    text: contractor.name,
  })) ?? []),
]);

const setIncome = (value: boolean) => {
  form.value.direction = value ? "in" : "out";
};
</script>