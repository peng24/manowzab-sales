<template>
  <PullToRefresh :on-refresh="fetchData">
    <div class="container mx-auto px-4 py-8 max-w-7xl">
      <!-- Header & Filter -->
      <div
        class="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p class="text-gray-500">ภาพรวมยอดขาย {{ timeRangeLabel }}</p>
        </div>

        <!-- Hybrid Time Range Filter -->
        <div
          class="flex items-center gap-3 rounded-xl bg-white p-2 shadow-sm border border-gray-200"
        >
          <select
            v-model="selectedTimeRange"
            class="rounded-lg border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="today">วันนี้ (Today)</option>
            <option value="thisWeek">สัปดาห์นี้ (This Week)</option>
            <option value="thisMonth">เดือนนี้ (This Month)</option>
            <option value="thisYear">ปีนี้ (This Year)</option>
            <option value="allTime">ทั้งหมด (All Time)</option>
            <option value="selectMonth">ระบุเดือน (Select Month)</option>
          </select>

          <!-- Conditional Month/Year Pickers (shown only when "Select Month" is chosen) -->
          <template v-if="selectedTimeRange === 'selectMonth'">
            <span class="text-gray-400">/</span>
            <select
              v-model="selectedMonth"
              class="rounded-lg border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium focus:border-blue-500 focus:ring-blue-500"
            >
              <option
                v-for="(name, index) in monthNames"
                :key="index"
                :value="index"
              >
                {{ name }}
              </option>
            </select>
            <span class="text-gray-400">/</span>
            <select
              v-model="selectedYear"
              class="rounded-lg border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium focus:border-blue-500 focus:ring-blue-500"
            >
              <option v-for="year in yearRange" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </template>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex h-64 w-full items-center justify-center">
        <div class="flex flex-col items-center gap-2">
          <div
            class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
          ></div>
          <p class="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>

      <div v-else class="space-y-8 animate-fade-in-up">
        <!-- 1. Summary Cards -->
        <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <!-- Total Sales -->
          <div
            class="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 md:p-6 shadow-sm transition-transform hover:-translate-y-1"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-blue-600">ยอดขายรวม</p>
                <h3 class="mt-2 text-2xl md:text-3xl font-bold text-gray-900">
                  ฿{{ formatCurrency(stats.totalSales) }}
                </h3>
              </div>
              <div
                class="rounded-lg bg-blue-100 p-2 md:p-3 text-blue-600 hidden sm:block"
              >
                <Wallet class="h-6 w-6" />
              </div>
            </div>
          </div>

          <!-- Total Orders -->
          <div
            class="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 md:p-6 shadow-sm transition-transform hover:-translate-y-1"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-indigo-600">จำนวนออเดอร์</p>
                <h3 class="mt-2 text-2xl md:text-3xl font-bold text-gray-900">
                  {{ stats.totalOrders.toLocaleString() }}
                </h3>
              </div>
              <div
                class="rounded-lg bg-indigo-100 p-2 md:p-3 text-indigo-600 hidden sm:block"
              >
                <ShoppingBag class="h-6 w-6" />
              </div>
            </div>
          </div>

          <!-- Transfer Total -->
          <div
            class="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 md:p-6 shadow-sm transition-transform hover:-translate-y-1"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-emerald-600">
                  ยอดโอน (Transfer)
                </p>
                <h3 class="mt-2 text-2xl md:text-3xl font-bold text-gray-900">
                  ฿{{ formatCurrency(stats.totalTransfer) }}
                </h3>
              </div>
              <div
                class="rounded-lg bg-emerald-100 p-2 md:p-3 text-emerald-600 hidden sm:block"
              >
                <ArrowRightLeft class="h-6 w-6" />
              </div>
            </div>
          </div>

          <!-- COD Total -->
          <div
            class="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 md:p-6 shadow-sm transition-transform hover:-translate-y-1"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-orange-600">
                  เก็บปลายทาง (COD)
                </p>
                <h3 class="mt-2 text-2xl md:text-3xl font-bold text-gray-900">
                  ฿{{ formatCurrency(stats.totalCOD) }}
                </h3>
              </div>
              <div
                class="rounded-lg bg-orange-100 p-2 md:p-3 text-orange-600 hidden sm:block"
              >
                <Truck class="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Chart Section -->
        <SalesChart :title="chartTitle" :chart-data="chartData" />

        <!-- 3. Recent Transactions -->
        <div
          class="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
        >
          <div
            class="flex items-center justify-between border-b border-gray-100 px-6 py-4"
          >
            <h3 class="font-bold text-gray-800">รายการล่าสุด</h3>
            <router-link
              to="/all-sales"
              class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              ดูรายการทั้งหมด >
            </router-link>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    วันที่
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Order No
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    ลูกค้า
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    ประเภท
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    ยอดเงิน
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 bg-white">
                <tr v-if="recentTransactions.length === 0">
                  <td
                    colspan="5"
                    class="px-6 py-8 text-center text-sm text-gray-400"
                  >
                    ไม่มีรายการในช่วงเวลานี้
                  </td>
                </tr>
                <tr
                  v-for="tx in recentTransactions"
                  :key="tx.id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {{ formatDate(tx.dateTime) }}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                  >
                    {{ tx.orderNo || "-" }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <router-link
                      v-if="tx.customerName"
                      :to="{
                        name: 'CustomerDetail',
                        params: { name: tx.customerName },
                      }"
                      class="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {{ tx.customerName }}
                    </router-link>
                    <span v-else class="text-gray-600">ไม่ระบุ</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
                      :class="{
                        'bg-orange-100 text-orange-800': tx.type === 'COD',
                        'bg-emerald-100 text-emerald-800': tx.type !== 'COD',
                      }"
                    >
                      {{ tx.type || "N/A" }}
                    </span>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700"
                  >
                    ฿{{ formatCurrency(tx.amount) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </PullToRefresh>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import { th } from "date-fns/locale";

// Store
import { useSalesStore } from "../stores/salesStore.js";

// Icons
import { Wallet, ShoppingBag, ArrowRightLeft, Truck } from "lucide-vue-next";

// Components
import PullToRefresh from "../components/PullToRefresh.vue";
import SalesChart from "../components/SalesChart.vue";

// --- Store ---
const salesStore = useSalesStore();

// --- State ---
const currentDate = new Date();
const selectedTimeRange = ref("thisMonth"); // Default: This Month
const selectedMonth = ref(currentDate.getMonth());
const selectedYear = ref(currentDate.getFullYear());

const chartData = ref({});

// Constants
const monthNames = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const monthNamesShort = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const dayNamesShort = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

const yearRange = computed(() => {
  const current = new Date().getFullYear();
  const years = [];
  for (let i = current - 4; i <= current + 1; i++) {
    years.push(i);
  }
  return years;
});

// --- Computed ---

// Use store getters for stats
const stats = computed(() => ({
  totalSales: salesStore.totalSales,
  totalOrders: salesStore.totalOrders,
  totalTransfer: salesStore.totalTransfer,
  totalCOD: salesStore.totalCOD,
}));

const recentTransactions = computed(() => salesStore.recentSales);
const loading = computed(() => salesStore.loading);

const timeRangeLabel = computed(() => {
  const labels = {
    today: "ประจำวันนี้",
    thisWeek: "ประจำสัปดาห์นี้",
    thisMonth: "ประจำเดือนนี้",
    thisYear: "ประจำปีนี้",
    allTime: "ตั้งแต่เริ่มต้น",
    selectMonth: `ประจำ ${monthNames[selectedMonth.value]} ${
      selectedYear.value
    }`,
  };
  return labels[selectedTimeRange.value] || "";
});

const chartTitle = computed(() => {
  const titles = {
    today: "ยอดขายรายวัน",
    thisWeek: "ยอดขายรายวัน",
    thisMonth: "ยอดขายรายวัน",
    selectMonth: "ยอดขายรายวัน",
    thisYear: "ยอดขายรายเดือน",
    allTime: "ยอดขายรายเดือน",
  };
  return titles[selectedTimeRange.value] || "ยอดขาย";
});

// --- Logic ---

// Calculate date range based on selected time range
const getDateRange = () => {
  const now = new Date();

  switch (selectedTimeRange.value) {
    case "today":
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
    case "thisWeek":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "thisMonth":
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case "selectMonth":
      const targetDate = new Date(selectedYear.value, selectedMonth.value);
      return {
        start: startOfMonth(targetDate),
        end: endOfMonth(targetDate),
      };
    case "thisYear":
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
    case "allTime":
      return {
        start: null,
        end: null,
      };
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
  }
};

const fetchData = async () => {
  try {
    const { start, end } = getDateRange();

    // Prepare filter for salesStore
    let filter = {};

    switch (selectedTimeRange.value) {
      case "today":
        filter = { mode: "today" };
        break;
      case "thisWeek":
        filter = { mode: "thisWeek", startDate: start, endDate: end };
        break;
      case "thisMonth":
        filter = { mode: "thisMonth" };
        break;
      case "selectMonth":
        filter = {
          mode: "selectMonth",
          month: selectedMonth.value,
          year: selectedYear.value,
        };
        break;
      case "thisYear":
        filter = { mode: "thisYear" };
        break;
      case "allTime":
        filter = { mode: "all", limitCount: 500 };
        break;
      default:
        filter = { mode: "thisMonth" };
    }

    // Fetch sales using the store
    await salesStore.fetchSales(filter);

    // Get sales with dates from store for charting
    const txs = salesStore.salesWithDates;

    // Prepare Chart Data based on time range
    prepareChartData(txs, start, end);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  }
};

const prepareChartData = (transactions, start, end) => {
  const range = selectedTimeRange.value;

  if (range === "thisYear" || range === "allTime") {
    // Group by Month
    prepareMonthlyChart(transactions, start, end);
  } else {
    // Group by Day (today, thisWeek, thisMonth, selectMonth)
    prepareDailyChart(transactions, start, end);
  }
};

const prepareMonthlyChart = (transactions, start, end) => {
  // Determine the range of months
  let monthsRange;

  if (selectedTimeRange.value === "allTime") {
    // Find min and max dates from transactions
    if (transactions.length === 0) {
      monthsRange = eachMonthOfInterval({
        start: startOfYear(new Date()),
        end: endOfYear(new Date()),
      });
    } else {
      const dates = transactions.map((tx) => tx.dateTime).filter((d) => d);
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      monthsRange = eachMonthOfInterval({
        start: startOfMonth(minDate),
        end: endOfMonth(maxDate),
      });
    }
  } else {
    // This year
    monthsRange = eachMonthOfInterval({ start, end });
  }

  // Initialize monthly data
  const monthlyData = {};
  monthsRange.forEach((month) => {
    const key = format(month, "yyyy-MM");
    monthlyData[key] = { COD: 0, Transfer: 0 };
  });

  // Aggregate data
  transactions.forEach((tx) => {
    const key = format(tx.dateTime, "yyyy-MM");
    const type = tx.type === "COD" ? "COD" : "Transfer";
    const amt = Number(tx.amount) || 0;

    if (monthlyData[key]) {
      monthlyData[key][type] += amt;
    }
  });

  // Prepare labels and data
  const labels = monthsRange.map((month) => {
    const monthIndex = month.getMonth();
    return monthNamesShort[monthIndex];
  });

  const dataCOD = monthsRange.map((month) => {
    const key = format(month, "yyyy-MM");
    return monthlyData[key].COD;
  });

  const dataTransfer = monthsRange.map((month) => {
    const key = format(month, "yyyy-MM");
    return monthlyData[key].Transfer;
  });

  chartData.value = {
    labels: labels,
    datasets: [
      {
        label: "โอนเงิน",
        backgroundColor: "#10b981", // emerald-500
        data: dataTransfer,
        borderRadius: 4,
        stack: "combined",
      },
      {
        label: "COD",
        backgroundColor: "#f97316", // orange-500
        data: dataCOD,
        borderRadius: 4,
        stack: "combined",
      },
    ],
  };
};

const prepareDailyChart = (transactions, start, end) => {
  const range = selectedTimeRange.value;

  // Generate days in range
  const daysRange = eachDayOfInterval({ start, end });

  // Initialize daily data
  const dailyData = {};
  daysRange.forEach((day) => {
    const key = format(day, "yyyy-MM-dd");
    dailyData[key] = { COD: 0, Transfer: 0 };
  });

  // Aggregate data
  transactions.forEach((tx) => {
    const key = format(tx.dateTime, "yyyy-MM-dd");
    const type = tx.type === "COD" ? "COD" : "Transfer";
    const amt = Number(tx.amount) || 0;

    if (dailyData[key]) {
      dailyData[key][type] += amt;
    }
  });

  // Prepare labels based on range
  let labels;
  if (range === "thisWeek" || range === "today") {
    // Show day names (จันทร์, อังคาร...)
    labels = daysRange.map((day) => {
      const dayIndex = day.getDay();
      return dayNamesShort[dayIndex];
    });
  } else {
    // This Month / Select Month - show day numbers (1, 2, 3...)
    labels = daysRange.map((day) => day.getDate().toString());
  }

  const dataCOD = daysRange.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    return dailyData[key].COD;
  });

  const dataTransfer = daysRange.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    return dailyData[key].Transfer;
  });

  chartData.value = {
    labels: labels,
    datasets: [
      {
        label: "โอนเงิน",
        backgroundColor: "#10b981", // emerald-500
        data: dataTransfer,
        borderRadius: 4,
        stack: "combined",
      },
      {
        label: "COD",
        backgroundColor: "#f97316", // orange-500
        data: dataCOD,
        borderRadius: 4,
        stack: "combined",
      },
    ],
  };
};

// Watchers
watch(selectedTimeRange, () => {
  fetchData();
});

watch([selectedMonth, selectedYear], () => {
  if (selectedTimeRange.value === "selectMonth") {
    fetchData();
  }
});

onMounted(() => {
  fetchData();
});

// Utilities
const formatCurrency = (val) => new Intl.NumberFormat("th-TH").format(val || 0);

const formatDate = (date) => {
  if (!date) return "-";
  try {
    return format(date, "d MMM yy HH:mm", { locale: th });
  } catch (e) {
    return "-";
  }
};
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
