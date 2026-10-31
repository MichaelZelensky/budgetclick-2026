<template>
  <div>
    <label>
      Description
      <LiteInputField v-model="form.description" />
    </label>

    <label>
      Amount
      <LiteInputField v-model="form.amount" type="number" :allow-negative="false" />
    </label>

    <LiteToggle :model-value="form.direction === 'in'" @update:model-value="setIncome">
      Income
    </LiteToggle>

    <LiteSelect v-model="form.accountId" :options="accountOptions" title="Account" />
    <LiteSelect v-model="form.categoryId" :options="categoryOptions" title="Category" />
    <LiteSelect v-model="form.contractorId" :options="contractorOptions" title="Contractor" />

    <label>
      Comment
      <LiteInputField v-model="form.comment" />
    </label>

    <LiteSelect v-model="form.frequency" :options="frequencyOptions" title="Frequency" />

    <label>
      Repeat every (n)
      <LiteInputField v-model="form.interval" type="number" :allow-negative="false" />
    </label>

    <label>
      Start date
      <LiteInputField v-model="form.startDate" type="date" />
    </label>

    <label>
      End date
      <LiteInputField v-model="form.endDate" type="date" />
    </label>

    <div v-if="form.frequency === 'weekly'" class="tw-mb-4 tw-flex tw-flex-wrap tw-gap-4">
      <label v-for="(name, index) in weekdayNames" :key="name" class="tw-flex tw-items-center tw-gap-1">
        <input v-model="form.weekdays" type="checkbox" :value="index" />
        {{ name.slice(0, 3) }}
      </label>
    </div>

    <div v-if="form.frequency === 'monthly'">
      <LiteSelect v-model="form.monthlyType" :options="monthlyTypeOptions" title="Monthly pattern" />

      <label v-if="form.monthlyType === 'date'">
        Day of month
        <LiteInputField v-model="form.monthlyDay" type="number" :allow-negative="false" />
      </label>

      <div v-else>
        <LiteSelect v-model="form.monthlyOrdinal" :options="ordinalOptions" title="Occurrence" />
        <LiteSelect v-model="form.monthlyWeekday" :options="weekdayOptions" title="Weekday" />
      </div>
    </div>

    <LiteSelect
      v-if="form.frequency === 'annually'"
      v-model="form.month"
      :options="monthOptions"
      title="Month"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import LiteSelect from "@/components/ui/lite-select/LiteSelect.vue";
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