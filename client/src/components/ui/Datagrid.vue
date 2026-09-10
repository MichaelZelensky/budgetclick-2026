<template>
  <div class="data-grid">
    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th v-if="selectRowCheckbox && !singleRowSelection"
              :style="{ width: selectColumnWidthPx, minWidth: selectColumnWidthPx }"
            >
              <div class="th-inner tw-flex tw-items-center tw-justify-center">
                <input
                  ref="refSelectAllCheckbox"
                  type="checkbox"
                  :checked="allRowsOnPageSelected"
                  :disabled="paginatedRowIds.length === 0"
                  @change="toggleAllRowsOnPage(($event.target as HTMLInputElement).checked)"
                />
              </div>
            </th>

            <th
              v-for="column in columns"
              :key="column.key"
              :style="{ width: resolvedWidth(column.key), minWidth: resolvedMinWidth(column.key) }"
            >
              <div class="th-inner tw-flex tw-items-center tw-gap-2 tw-relative">
                <button
                  class="tw-flex tw-items-center tw-gap-1 tw-font-medium tw-text-left tw-w-full tw-cursor-pointer header-sort-btn"
                  :disabled="!options.sortable"
                  @click="options.sortable ? sortBy(column.key) : null"
                >
                  <span v-if="sortKey === column.key">
                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                  </span>
                  <span class="tw-truncate">{{ column.label }}</span>
                </button>

                <!-- filter toggle -->
                <FunnelFill
                  v-if="options.filterable && column.filterable && (columnFilters[column.key] ?? '') !== ''"
                  class="filter-icon"
                  title="Filter active"
                  @click.stop="toggleFilter(column.key)"
                />
                <Funnel
                  v-else-if="options.filterable && column.filterable"
                  class="filter-icon"
                  title="Show/hide filter"
                  @click.stop="toggleFilter(column.key)"
                />

                <!-- resize handle (aligned to the true column border) -->
                <div
                  v-if="!isFixedColumn(column.key)"
                  class="resize-handle"
                  title="Resize column"
                  @mousedown.prevent="startResize($event, column.key)"
                ></div>
              </div>
            </th>
          </tr>

          <!-- Filter row -->
          <tr v-if="options.filterable && anyFilterVisible">
            <th v-if="selectRowCheckbox && !singleRowSelection"
              :style="{ width: selectColumnWidthPx, minWidth: selectColumnWidthPx }"
            >
              <div class="th-inner tw-px-4 tw-py-1">
                <div class="tw-h-0"></div>
              </div>
            </th>

            <th
              v-for="column in columns"
              :key="'filter-' + column.key"
              :style="{ width: resolvedWidth(column.key), minWidth: resolvedMinWidth(column.key) }"
            >
              <div class="th-inner tw-px-4 tw-py-1">
                <LiteSelect
                  v-if="column.filterable && visibleFilters[column.key] && column.type === DatagridColumnType.BOOLEAN"
                  v-model="columnFilters[column.key]"
                  :options="[
                    { text: 'All', value: '' },
                    { text: 'Yes', value: 'true' },
                    { text: 'No', value: 'false' }
                  ]"
                  @change="applyFilters"
                />
                <LiteInputField
                  v-else-if="column.filterable && visibleFilters[column.key]"
                  v-model="columnFilters[column.key]"
                  type="text"
                  placeholder="Filter..."
                  @input="applyFilters"
                  :ref="setFilterInputRef(column.key)"
                />
                <div v-else class="tw-h-0"></div>
              </div>

              <!-- keep handle aligned in filter row too -->
              <div
                v-if="!isFixedColumn(column.key)"
                class="resize-handle"
                title="Resize column"
                @mousedown.prevent="startResize($event, column.key)"
              ></div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in paginatedData" :key="String(item.id)" 
            @click="setRowSelection(item.id, !selectedRowIdSet.has(String(item.id)))"
            :class="{ selected: selectedRowIdSet.has(String(item.id)) }"
          >
            <td v-if="selectRowCheckbox && !singleRowSelection"
              :style="{ width: selectColumnWidthPx, minWidth: selectColumnWidthPx }"
              class="select-cell"
            >
              <div class="tw-flex tw-items-center tw-justify-center">
                <input
                  type="checkbox"
                  :checked="rowIsSelected(item.id)"
                  @change="setRowSelection(item.id, ($event.target as HTMLInputElement).checked)"
                />
              </div>
            </td>

            <td
              v-for="column in columns"
              :key="column.key"
              :style="{ width: resolvedWidth(column.key), minWidth: resolvedMinWidth(column.key) }"
            >
              <slot :name="column.key" :item="item" v-if="$slots[column.key]"></slot>
              <span v-else-if="column.type === DatagridColumnType.BOOLEAN && item[column.key]" class="tw-text-green-500">Yes</span>
              <span v-else-if="column.type === DatagridColumnType.BOOLEAN && !item[column.key]" class="tw-text-red-500">No</span>
              <span v-else-if="Array.isArray(item[column.key])">
                {{ (item[column.key] as (string | number | boolean)[]).join(', ') }}
              </span>
              <span v-else>
                {{ isDefined(item[column.key]) ? item[column.key] : 'null' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bottom-controls">
      <div class="tw-flex tw-items-center tw-space-x-2" v-if="selectRowCheckbox">
        <div v-if="selectedItemsOnPage.length" class="tw-text-sm">
          Selected: {{ selectedItemsOnPage.length }}
        </div>

        <LiteSelect
          v-if="bulkActions.length"
          :modelValue="selectedBulkActionKey"
          :options="bulkActionSelectOptions"
          title="With selected..."
          @update:modelValue="handleBulkActionSelection"
        />
      </div>

      <slot name="customBottomControls" />

      <div class="tw-flex tw-items-center tw-space-x-2" v-if="options.paginate && filteredData.length > itemsPerPage">
        <LiteButton size="sm" :disabled="currentPage === 1" @click="firstPage" title="First"> ⇤ </LiteButton>
        <LiteButton size="sm" :disabled="currentPage === 1" @click="prevPage" title="Previous"> ← </LiteButton>
        <LiteButton size="sm" v-for="page in pageNumbers" :key="page" @click="goToPage(page)" :disabled="+currentPage === +page">{{ page }}</LiteButton>
        <LiteButton size="sm" :disabled="currentPage === totalPages" @click="nextPage" title="Next"> → </LiteButton>
        <LiteButton size="sm" :disabled="currentPage === totalPages" @click="lastPage" title="Last"> ⇥ </LiteButton>
      </div>

      <div>
        Total rows: {{ data.length }}
        <span v-if="filteredData.length !== data.length">(Filtered: {{ filteredData.length }})</span>
      </div>

      <div class="tw-flex tw-items-center" v-if="options.paginate">
        <div class="tw-mr-2">Rows per page:</div>
        <LiteSelect v-model="itemsPerPage" :options="rowsPerPageSelectOptions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onBeforeUnmount, nextTick, ComponentPublicInstance } from 'vue';
import LiteSelect from '@/components/ui/lite-select/LiteSelect.vue';
import LiteButton from '@/components/ui/LiteButton.vue';
import LiteInputField from '@/components/ui/LiteInputField.vue';
import { isDefined } from '@/utils/defined';
import { useRouter, useRoute } from 'vue-router';
import Funnel from "@/components/icons/Funnel.vue";
import FunnelFill from "@/components/icons/FunnelFill.vue";

type DatagridCell =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | string[]
  | number[]
  | boolean[];

type DatagridRow = Record<string, DatagridCell>;

enum DatagridColumnType {
  TEXT = 'text',
  BOOLEAN = 'boolean',
}

type DatagridColumn<TRow extends DatagridRow = DatagridRow> = {
  key: keyof TRow & string;
  label: string;
  filterable?: boolean;
  type?: DatagridColumnType;
  getSortValue?: (row: TRow) => string | number | boolean | Date | null | undefined;
  compare?: (a: TRow, b: TRow) => number;
};

type DatagridOptions = {
  sortable?: boolean;
  filterable?: boolean;
  paginate?: boolean;
  initialSort?: { key: string; order: 'asc' | 'desc' };
  fixedColumnWidths?: Record<string, number>;
};

type DatagridBulkAction = {
  key: string;
  label: string;
};

type BulkActionPayload = {
  actionKey: string;
  selectedItems: DatagridRow[];
};

type RowId = DatagridRow['id'];

const emit = defineEmits<{
  bulkAction: [action: DatagridBulkAction, items: DatagridRow[]];
  selectionChange: [ids: string[]];
}>();

const props = defineProps<{
  data: DatagridRow[];
  columns: DatagridColumn[];
  options: DatagridOptions;
  rowsPerPageOptions?: number[];
  selectRowCheckbox?: boolean;
  singleRowSelection?: boolean;
  bulkActions?: DatagridBulkAction[];
}>();

const router = useRouter();
const route = useRoute();

const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc' | 'none'>('none');
const currentPage = ref<number>(
  route.query.page ? Math.max(1, Number(route.query.page)) : 1
);

/* ---------- Initial sort ---------- */
const initialSortApplied = ref(false);
const applyInitialSort = () => {
  if (initialSortApplied.value) return;
  if (!props.options?.sortable) return;

  const config = props.options.initialSort;
  if (!config || !config.key) return;

  const order = (config.order === 'asc' || config.order === 'desc') ? config.order : 'asc';
  const exists = props.columns.some(c => c.key === config.key);
  if (!exists) return;

  sortKey.value = config.key;
  sortOrder.value = order;
  initialSortApplied.value = true;
};

applyInitialSort();
watch(
  () => [props.options?.sortable, props.columns.map(c => c.key).join('|')],
  () => applyInitialSort()
);

/* ---------- Filter visibility state ---------- */
const visibleFilters = ref<Record<string, boolean>>({});
props.columns.forEach(col => {
  if (col.filterable) visibleFilters.value[col.key] = false;
});

const anyFilterVisible = computed(() =>
  props.columns.some(col => col.filterable && visibleFilters.value[col.key])
);

/* ---------- Rows per page select ---------- */
const rowsPerPageNumbers = computed<number[]>(() => {
  return props.rowsPerPageOptions && props.rowsPerPageOptions.length
    ? props.rowsPerPageOptions
    : [20, 50, 100];
});

const rowsPerPageSelectOptions = computed(() =>
  rowsPerPageNumbers.value.map(n => ({ text: n.toString(), value: n }))
);

/* ---------- Column filters ---------- */
const columnFilters = ref<Record<string, string>>({});
for (const column of props.columns) {
  if (column.type === DatagridColumnType.BOOLEAN) {
    columnFilters.value[column.key] = '';
  }
}

/* ---------- Pagination ---------- */
const itemsPerPage = ref<number>(
  route.query.pageSize
    ? Number(route.query.pageSize)
    : rowsPerPageNumbers.value[0]
);
watch(rowsPerPageNumbers, (newList) => {
  if (!newList.includes(itemsPerPage.value)) {
    itemsPerPage.value = newList[0];
    currentPage.value = 1;
  }
});

watch(itemsPerPage, (size) => {
  currentPage.value = 1;

  const sizeStr = String(size);
  if (route.query.pageSize === sizeStr && route.query.page === '1') return;

  router.push({
    path: route.path,
    query: {
      ...route.query,
      page: '1',
      pageSize: sizeStr
    }
  });
});

watch(
  () => route.query.pageSize,
  (size) => {
    const next = size ? Number(size) : rowsPerPageNumbers.value[0];
    if (next !== itemsPerPage.value) {
      itemsPerPage.value = next;
    }
  }
);

const toComparable = (v: string | number | boolean | Date | null | undefined): number | string | boolean | null => {
  if (v instanceof Date) return v.getTime();
  return v ?? null;
};

/* ---------- Filtering + sorting ---------- */
const filteredData = computed<DatagridRow[]>(() => {
  let result = [...props.data];

  // filtering
  if (props.options.filterable) {
    for (const col of props.columns) {
      const key = col.key;
      const filterValue = (columnFilters.value[key] ?? '') as string;
      if (filterValue !== '') {
        result = result.filter((item) => {
          const cell = item[key];
          if (col.type === DatagridColumnType.BOOLEAN) {
            const boolFilter = filterValue === 'true';
            return cell === boolFilter;
          }
          if (Array.isArray(cell)) {
            return cell.map(String).some(s => s.toLowerCase().includes(filterValue.toLowerCase()));
          }
          const s = (cell != null) ? String(cell) : '';
          return s.toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    }
  }

  // sorting with getSortValue / compare
  if (props.options.sortable && sortKey.value && sortOrder.value !== 'none') {
    const col = props.columns.find(c => c.key === sortKey.value);
    const dir = sortOrder.value === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      if (col?.compare) return col.compare(a, b) * dir;
      const avRaw = col?.getSortValue ? col.getSortValue(a) : (a[sortKey.value] as DatagridCell);
      const bvRaw = col?.getSortValue ? col.getSortValue(b) : (b[sortKey.value] as DatagridCell);
      const avScalar = Array.isArray(avRaw) ? (avRaw[0] as unknown as string | number | boolean | Date | null | undefined) : (avRaw as string | number | boolean | Date | null | undefined);
      const bvScalar = Array.isArray(bvRaw) ? (bvRaw[0] as unknown as string | number | boolean | Date | null | undefined) : (bvRaw as string | number | boolean | Date | null | undefined);
      const aU = avScalar === null || avScalar === undefined;
      const bU = bvScalar === null || bvScalar === undefined;
      if (aU && bU) return 0;
      if (aU) return -1 * dir;
      if (bU) return  1 * dir;

      const ax = toComparable(avScalar!);
      const bx = toComparable(bvScalar!);
      if (ax === bx) return 0;

      return (ax! > bx! ? 1 : -1) * dir;
    });
  }

  return result;
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredData.value.slice(start, start + itemsPerPage.value);
});

const totalPages = computed(() => Math.ceil(filteredData.value.length / itemsPerPage.value));

const pageNumbers = computed(() => {
  const maxPagesToShow = 3;
  let startPage = Math.max(1, currentPage.value - Math.floor(maxPagesToShow / 2));
  let endPage = startPage + maxPagesToShow - 1;
  if (endPage > totalPages.value) {
    endPage = totalPages.value;
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
});

watch(currentPage, (page) => {
  const pageStr = String(page);
  if (route.query.page === pageStr) return;

  router.push({
    path: route.path,
    query: { ...route.query, page: pageStr }
  });
});

watch(
  () => route.query.page,
  (page) => {
    const next = page ? Math.max(1, Number(page)) : 1;
    if (next !== currentPage.value) {
      currentPage.value = next;
    }
  }
);

watch(totalPages, (max) => {
  if (currentPage.value > max) currentPage.value = max || 1;
});

/* ---------- Sort toggle ---------- */
const sortBy = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : sortOrder.value === 'desc' ? 'none' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
  if (sortOrder.value === 'none') sortKey.value = '';
};

const filterInputRefs = ref<Record<string, InstanceType<typeof LiteInputField> | null>>({});
const setFilterInputRef = (key: string) => (el: Element | ComponentPublicInstance | null) => {
  filterInputRefs.value[key] = el as InstanceType<typeof LiteInputField> | null;
};

const toggleFilter = (key: string) => {
  const isFilled = (columnFilters.value[key] ?? '') !== '';
  const isVisible = !!visibleFilters.value[key];

  if (isFilled) { 
    visibleFilters.value[key] = true; 
    nextTick(() => filterInputRefs.value[key]?.focus());
    return; 
  }
  if (isVisible) { 
    visibleFilters.value[key] = false; 
    return; 
  }

  for (const col of props.columns) {
    if (!col.filterable) continue;
    const k = col.key;
    const otherVisible = !!visibleFilters.value[k];
    const otherFilled = (columnFilters.value[k] ?? '') !== '';
    if (otherVisible && !otherFilled && k !== key) {
      visibleFilters.value[k] = false;
    }
  }
  visibleFilters.value[key] = true;
  nextTick(() => filterInputRefs.value[key]?.focus());
};

/* ---------- Pagination controls ---------- */
const prevPage = () => currentPage.value--;
const nextPage = () => currentPage.value++;
const goToPage = (page: number) => (currentPage.value = page);
const firstPage = () => (currentPage.value = 1);
const lastPage = () => (currentPage.value = totalPages.value);
const applyFilters = () => { currentPage.value = 1; };

/* ---------- Row selection ---------- */
const selectColumnWidthPx = '44px';
const bulkActions = computed<DatagridBulkAction[]>(() => props.bulkActions ?? []);
const selectedRowIdSet = ref<Set<RowId>>(new Set<RowId>());
const selectedBulkActionKey = ref<string>('');
const refSelectAllCheckbox = ref<HTMLInputElement | null>(null);

const paginatedRowIds = computed<RowId[]>(() => paginatedData.value.map(x => x.id));
const paginatedRowIdKey = computed(() => paginatedRowIds.value.join('|'));

const selectedCountOnPage = computed(() =>
  paginatedRowIds.value.filter(x => selectedRowIdSet.value.has(x)).length
);

const allRowsOnPageSelected = computed(() =>
  paginatedRowIds.value.length > 0 && selectedCountOnPage.value === paginatedRowIds.value.length
);

const headerCheckboxIsIndeterminate = computed(() =>
  selectedCountOnPage.value > 0 && !allRowsOnPageSelected.value
);

const clearSelection = () => {
  selectedRowIdSet.value = new Set<RowId>();
};

watch(paginatedRowIdKey, () => clearSelection(), { immediate: true });

watch([headerCheckboxIsIndeterminate, paginatedRowIdKey], () => {
  if (refSelectAllCheckbox.value) {
    refSelectAllCheckbox.value.indeterminate = headerCheckboxIsIndeterminate.value;
  }
}, { immediate: true });

const rowIsSelected = (id: RowId): boolean => selectedRowIdSet.value.has(id);

const setRowSelection = (id: string, checked: boolean): void => {
  const next = props.singleRowSelection
    ? selectedRowIdSet.value.has(id)
      ? new Set<string>()
      : new Set<string>([id])
    : checked
      ? new Set<string>([...selectedRowIdSet.value, id])
      : new Set<string>([...selectedRowIdSet.value].filter(x => x !== id));

  selectedRowIdSet.value = next;
  emit("selectionChange", [...next]);
};

const toggleAllRowsOnPage = (checked: boolean) => {
  selectedRowIdSet.value = checked ? new Set<RowId>(paginatedRowIds.value) : new Set<RowId>();
};

const selectedItemsOnPage = computed(() =>
  paginatedData.value.filter(x => selectedRowIdSet.value.has(x.id))
);

const bulkActionSelectOptions = computed(() => {
  const actionsDisabled = selectedItemsOnPage.value.length === 0;
  const placeholder = { text: 'With selected...', value: '', disabled: true };
  const actionOptions = bulkActions.value.map(x => ({
    text: x.label,
    value: x.key,
    disabled: actionsDisabled
  }));
  return [placeholder, ...actionOptions];
});

const handleBulkActionSelection = (value: string | number | undefined) => {
  const actionKey = typeof value === 'string' ? value : String(value ?? '');
  if (!actionKey) return;
  if (selectedItemsOnPage.value.length === 0) {
    selectedBulkActionKey.value = '';
    return;
  }
  selectedBulkActionKey.value = actionKey;
  emit('bulkAction', { actionKey, selectedItems: selectedItemsOnPage.value });
  nextTick(() => {
    selectedBulkActionKey.value = '';
  });
};

/* ---------- Column resizing ---------- */
const minColPx = 80;

const columnWidths = reactive<Record<string, number>>({});
const resizingColumnKey = ref<string | null>(null);
let startX = 0;
let startWidth = 0;

const getFixedWidthPx = (key: string): number | null =>
  props.options?.fixedColumnWidths && typeof props.options.fixedColumnWidths[key] === 'number'
    ? props.options.fixedColumnWidths[key]
    : null;

const isFixedColumn = (key: string): boolean => getFixedWidthPx(key) !== null;

const resolvedWidth = (key: string): string => {
  const fixed = getFixedWidthPx(key);
  if (fixed !== null) return `${fixed}px`;
  return columnWidths[key] ? `${columnWidths[key]}px` : 'auto';
};

const resolvedMinWidth = (key: string): string => {
  const fixed = getFixedWidthPx(key);
  if (fixed !== null) return `${fixed}px`;
  return minColPx + 'px';
};

const onMouseMove = (e: MouseEvent) => {
  if (!resizingColumnKey.value) return;
  const dx = e.pageX - startX;
  const next = Math.max(minColPx, startWidth + dx);
  columnWidths[resizingColumnKey.value] = next;
};

const onMouseUp = () => {
  if (!resizingColumnKey.value) return;
  resizingColumnKey.value = null;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
};

const startResize = (e: MouseEvent, key: string) => {
  if (isFixedColumn(key)) return;
  const th = (e.target as HTMLElement).closest('th') as HTMLElement | null;
  const currentWidth = columnWidths[key] || th?.offsetWidth || 150;

  resizingColumnKey.value = key;
  startX = e.pageX;
  startWidth = currentWidth;

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
});

</script>

<style scoped lang="scss">
.data-grid { @apply tw-w-full; }

.table-shell {
  @apply tw-rounded-md tw-shadow-sm tw-border tw-border-zinc-600;
  @apply tw-overflow-hidden tw-w-full;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 0;
  table-layout: fixed;
}

th { padding: 0; position: relative; }

td { @apply tw-px-4 tw-py-2 tw-align-top tw-text-zinc-400; }

.th-inner { @apply tw-px-4 tw-py-2 tw-relative; }

th, td { @apply tw-overflow-hidden tw-whitespace-nowrap tw-text-ellipsis; }

thead tr { @apply tw-bg-zinc-700; }

thead th { @apply tw-text-zinc-200 tw-font-normal; }

.header-sort-btn {
  @apply tw-bg-transparent tw-border-0 tw-p-0 tw-m-0 tw-w-auto tw-font-medium;
}

tbody tr {
  @apply even:tw-bg-zinc-800 odd:tw-bg-zinc-900;
}

tbody tr:hover { @apply tw-bg-zinc-700; }

tbody tr:hover td { @apply tw-text-zinc-300; }

tbody tr:not(:last-child) td { @apply tw-border-b tw-border-zinc-700; }

tbody tr.selected td {
  @apply tw-bg-sky-900/40;
}

.bottom-controls {
  @apply tw-flex tw-justify-end tw-items-center tw-mt-3 tw-space-x-4;
  @apply tw-text-zinc-400;
}

.select-cell { @apply tw-px-2; }

.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 12px;
  transform: translateX(50%);
  cursor: col-resize;
  user-select: none;
  z-index: 10;
}

.resize-handle::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.35);
  pointer-events: none;
}

.resize-handle:hover::after {
  background: rgba(255, 255, 255, 0.65);
}

.filter-icon {
  @apply tw-w-4 tw-h-4 tw-shrink-0 tw-opacity-60 hover:tw-opacity-100 tw-cursor-pointer;
}
</style>
