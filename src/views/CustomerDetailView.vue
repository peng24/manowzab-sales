<template>
  <PullToRefresh :on-refresh="fetchCustomerSales">
    <div class="container mx-auto max-w-6xl px-4 py-8">
      <!-- Back Button + Header -->
      <div class="mb-8">
        <!-- Improved Back Button -->
        <button
          @click="$router.back()"
          class="mb-4 inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-all"
        >
          <ArrowLeft class="h-5 w-5" />
          <span class="font-medium">ย้อนกลับ</span>
        </button>

        <!-- Enhanced Header Card with Gradient -->
        <div
          class="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8 shadow-lg"
        >
          <div
            class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
          >
            <!-- Customer Name -->
            <div>
              <p class="text-sm font-medium text-blue-100 mb-2">ข้อมูลลูกค้า</p>
              <h1 class="text-3xl md:text-4xl font-bold text-white">
                {{ name }}
              </h1>
            </div>

            <!-- Right Section: Total & Filter -->
            <div
              class="flex flex-col gap-4 sm:flex-row sm:items-end lg:items-center"
            >
              <!-- Total Spent -->
              <div class="text-left sm:text-right">
                <p class="text-sm font-medium text-blue-100 mb-1">
                  ยอดซื้อรวม<span class="text-xs ml-1"
                    >({{ dateFilterLabel }})</span
                  >
                </p>
                <h2 class="text-3xl md:text-4xl font-bold text-white">
                  ฿{{ formatCurrency(totalSpent) }}
                </h2>
              </div>

              <!-- Date Filter Dropdown -->
              <div class="flex flex-col gap-1">
                <label class="text-xs font-medium text-blue-100"
                  >ช่วงเวลา</label
                >
                <select
                  v-model="selectedFilter"
                  class="bg-white/95 border border-white/30 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-white focus:border-white block px-3 py-2.5 shadow-md backdrop-blur-sm min-w-[150px]"
                >
                  <option
                    v-for="filter in dateFilters"
                    :key="filter.value"
                    :value="filter.value"
                  >
                    {{ filter.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex h-64 items-center justify-center">
        <div class="flex flex-col items-center gap-2">
          <div
            class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
          ></div>
          <p class="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>

      <!-- Transaction Table -->
      <div
        v-else
        class="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden"
      >
        <div
          class="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4"
        >
          <h3 class="text-lg font-bold text-gray-800">
            📋 ประวัติการสั่งซื้อ ({{ totalOrders }} รายการ)
          </h3>
        </div>

        <div v-if="sales.length === 0" class="px-6 py-12 text-center">
          <div class="flex flex-col items-center gap-2">
            <div class="text-4xl">📭</div>
            <p class="text-gray-500 font-medium">ยังไม่มีรายการสั่งซื้อ</p>
          </div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <!-- Enhanced Table Header -->
            <thead class="bg-gray-100">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  วันที่
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  Order No.
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  ประเภท
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  ยอดเงิน
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr
                v-for="sale in sales"
                :key="sale.id"
                class="hover:bg-blue-50/50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ formatThaiDateTime(sale.dateTime) }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                >
                  {{ sale.orderNo || "-" }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5"
                    :class="{
                      'bg-amber-100 text-amber-800 border border-amber-200':
                        sale.type === 'COD',
                      'bg-blue-100 text-blue-800 border border-blue-200':
                        sale.type !== 'COD',
                    }"
                  >
                    {{ sale.type || "N/A" }}
                  </span>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900"
                >
                  ฿{{ formatCurrency(sale.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Enhanced Pagination -->
        <div
          v-if="totalPages > 1"
          class="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4"
        >
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700 font-medium">
              หน้า
              <span class="font-bold text-blue-600">{{ currentPage }}</span> จาก
              <span class="font-bold text-gray-900">{{ totalPages }}</span>
            </div>
            <div class="flex gap-2">
              <button
                @click="prevPage"
                :disabled="currentPage === 1"
                class="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 transition-all"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                ก่อนหน้า
              </button>
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 transition-all"
              >
                ถัดไป
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PullToRefresh>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { subDays, startOfMonth, startOfYear } from "date-fns";
import { formatThaiDateTime } from "../utils/dateUtils.js";
import { formatCurrency } from "../utils/formatUtils.js";
import { ArrowLeft } from "lucide-vue-next";
import { getSalesByCustomerName } from "../services/salesService.js";

// Components
import PullToRefresh from "../components/PullToRefresh.vue";

// Props
const props = defineProps({
  name: {
    type: String,
    required: true,
  },
});

// State
const loading = ref(true);
const sales = ref([]);
const currentPage = ref(1);
const pageSize = 10;
const selectedFilter = ref("all");
const totalSpent = ref(0);
const totalOrders = ref(0);

// Pagination Cursors
const pageCursors = ref({ 1: null });
const hasMore = ref(true);

// Date Filter Options
const dateFilters = [
  { value: "all", label: "ทั้งหมด" },
  { value: "7days", label: "7 วันล่าสุด" },
  { value: "month", label: "เดือนนี้" },
  { value: "year", label: "ปีนี้" },
];

// Computed
const dateFilterLabel = computed(() => {
  const filter = dateFilters.find((f) => f.value === selectedFilter.value);
  return filter ? filter.label : "ทั้งหมด";
});

const totalPages = computed(() => {
  return Math.ceil(totalOrders.value / pageSize) || 1;
});

// Methods
const fetchCustomerSales = async (isRefresh = false) => {
  loading.value = true;
  if (isRefresh) {
    currentPage.value = 1;
    pageCursors.value = { 1: null };
    hasMore.value = true;
  }

  try {
    const now = new Date();
    let cutoffDate = null;

    switch (selectedFilter.value) {
      case "7days":
        cutoffDate = subDays(now, 7);
        break;
      case "month":
        cutoffDate = startOfMonth(now);
        break;
      case "year":
        cutoffDate = startOfYear(now);
        break;
    }

    // 1. Fetch total spent and count with a limit of 200 for safety/speed
    const { items: allItems } = await getSalesByCustomerName(props.name, {
      cutoffDate,
      limitCount: 200,
    });
    totalOrders.value = allItems.length;
    totalSpent.value = allItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // 2. Fetch paginated sales
    const { items, lastDoc } = await getSalesByCustomerName(props.name, {
      cutoffDate,
      limitCount: pageSize,
      lastDoc: pageCursors.value[currentPage.value],
    });

    sales.value = items;

    // Save next page cursor if we have full page of items
    if (lastDoc && items.length === pageSize) {
      pageCursors.value[currentPage.value + 1] = lastDoc;
      hasMore.value = true;
    } else {
      hasMore.value = false;
    }
  } catch (error) {
    console.error("Error fetching customer sales:", error);
  } finally {
    loading.value = false;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value && hasMore.value) {
    currentPage.value++;
    fetchCustomerSales();
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchCustomerSales();
  }
};

// Watchers
watch(selectedFilter, () => {
  fetchCustomerSales(true);
});

watch(
  () => props.name,
  () => {
    fetchCustomerSales(true);
  },
);

// Lifecycle
onMounted(() => {
  fetchCustomerSales();
});
</script>
