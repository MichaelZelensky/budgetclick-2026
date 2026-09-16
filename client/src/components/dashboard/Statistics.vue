<template>
  <DashboardWidget>
    <div class="tw-flex tw-items-center tw-gap-2 tw-pb-4">
      <LiteSelect
        v-model="selectedYear"
        :options="yearOptions"
      />

      <LiteSelect
        v-model="selectedAccount"
        :options="accountOptions"
      />

      <LiteSelect
        v-model="selectedMetric"
        :options="metricOptions"
      />

      <button
        type="button"
        class="tw-ml-auto tw-flex tw-items-center tw-justify-center tw-p-1 tw-text-zinc-500 hover:tw-text-zinc-300"
        aria-label="Regenerate statistics and balances"
        title="Regenerate statistics and balances"
        @click="recalculate"
      >
        <RefreshIcon />
      </button>
    </div>

    <div class="chart">
      <Bar
        :data="chartData"
        :options="chartOptions"
      />
    </div>

    <Modal
      v-if="showMissingRatesModal"
      title="Missing currency rates"
      primary-button-label="Ok"
      secondary-button-label="Cancel"
      @close="cancelRecalculate"
      @ok="confirmRecalculate"
      @cancel="cancelRecalculate"
    >
      Some currency rates are missing. Statistics will use 1:1 for missing rates.
    </Modal>
  </DashboardWidget>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Bar } from "vue-chartjs";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import DashboardWidget from "@/components/dashboard/DashboardWidget.vue";
import LiteSelect from "@/components/ui/lite-select/LiteSelect.vue";
import RefreshIcon from "@/components/icons/Refresh.vue";
import Modal from "@/components/ui/Modal.vue";
import { hasMissingCurrencyRates, rebuildStatistics } from "@/stats";
import { getState } from "@/state/state";
import type { Option } from "@/components/ui/lite-select/LiteSelect.types";
import { rebuildBalances } from "@/balance";

ChartJS.register(
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
);

type StatisticsMetric = "income" | "outcome" | "balance";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const monthKeys = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

const currentYear = new Date().getFullYear();
const selectedYear = ref(String(currentYear));
const selectedAccount = ref("total");
const selectedMetric = ref<StatisticsMetric>("balance");
const showMissingRatesModal = ref(false);

const state = getState();

const yearOptions = computed<Option<string>[]>(() => {
  const years = Object.keys(state.statistics?.statistics ?? {})
    .map(month => Number(month.slice(0, 4)))
    .filter(year => Number.isFinite(year));

  const uniqueYears = [...new Set([...years, currentYear])].sort((a, b) => b - a);

  return uniqueYears.map(year => ({
    value: String(year),
    text: String(year),
  }));
});

const accountOptions = computed<Option<string>[]>(() => [
  { value: "total", text: "Total" },
  ...(state.referenceData.accounts?.accounts ?? [])
    .filter(account => !account.isDeleted)
    .map(account => ({
      value: account.id,
      text: account.name,
    })),
]);

const metricOptions: Option<StatisticsMetric>[] = [
  { value: "income", text: "In" },
  { value: "outcome", text: "Out" },
  { value: "balance", text: "Balance" },
];

const values = computed<number[]>(() => {
  return monthKeys.map(month => {
    const statistics = state.statistics?.statistics[`${selectedYear.value}-${month}`];

    if (statistics === undefined) {
      return 0;
    }

    if (selectedAccount.value === "total") {
      return statistics[selectedMetric.value];
    }

    return statistics.accounts[selectedAccount.value]?.[selectedMetric.value] ?? 0;
  });
});

const chartData = computed(() => ({
  labels: months,
  datasets: [
    {
      label: metricOptions.find(option => option.value === selectedMetric.value)?.text ?? "",
      data: values.value,
      backgroundColor: values.value.map(value =>
        value < 0 ? "#ef4444" : "#0ea5e9",
      ),
      borderRadius: 3,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

const recalculate = async (): Promise<void> => {
  if (hasMissingCurrencyRates()) {
    showMissingRatesModal.value = true;
    return;
  }
  await rebuildStatistics();
  await rebuildBalances();
};

const confirmRecalculate = async (): Promise<void> => {
  showMissingRatesModal.value = false;
  await rebuildStatistics();
  await rebuildBalances();
};

const cancelRecalculate = (): void => {
  showMissingRatesModal.value = false;
};
</script>

<style lang="scss" scoped>
.title {
  @apply tw-font-semibold;
}

.chart {
  @apply tw-h-40 tw-w-full;
}
</style>