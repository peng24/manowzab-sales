<template>
  <PullToRefresh :on-refresh="fetchData">
    <div class="container mx-auto max-w-7xl py-1 md:py-2">
      <!-- Header & Filter Card -->
      <div
        class="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
      >
        <div class="flex items-center gap-3.5">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
          >
            <Calendar class="h-6 w-6" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">
              ภาพรวมยอดขาย
            </p>
            <h1 class="text-xl md:text-2xl font-black text-gray-900">
              {{ timeRangeLabel }}
            </h1>
          </div>
        </div>

        <!-- Filter Presets & Dropdown -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Quick Presets -->
          <div class="flex rounded-xl bg-gray-100 p-1 text-xs font-medium">
            <button
              v-for="range in [
                { key: 'today', label: 'วันนี้' },
                { key: 'thisWeek', label: 'สัปดาห์นี้' },
                { key: 'thisMonth', label: 'เดือนนี้' },
                { key: 'thisYear', label: 'ปีนี้' },
                { key: 'allTime', label: 'ทั้งหมด' }
              ]"
              :key="range.key"
              @click="selectedTimeRange = range.key"
              class="rounded-lg px-3 py-1.5 transition-all duration-150 cursor-pointer"
              :class="
                selectedTimeRange === range.key
                  ? 'bg-white font-bold text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              "
            >
              {{ range.label }}
            </button>
          </div>

          <!-- Select Month Dropdown -->
          <div class="flex items-center gap-2 border-l border-gray-200 pl-2">
            <select
              v-model="selectedTimeRange"
              class="rounded-lg border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 focus:border-blue-500 focus:ring-blue-500 cursor-pointer"
            >
              <option value="selectMonth">📅 เลือกเดือนเฉพาะ...</option>
              <option value="today">วันนี้ (Today)</option>
              <option value="thisWeek">สัปดาห์นี้ (This Week)</option>
              <option value="thisMonth">เดือนนี้ (This Month)</option>
              <option value="thisYear">ปีนี้ (This Year)</option>
              <option value="allTime">ทั้งหมด (All Time)</option>
            </select>

            <template v-if="selectedTimeRange === 'selectMonth'">
              <select
                v-model="selectedMonth"
                class="rounded-lg border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700"
              >
                <option
                  v-for="(name, index) in monthNames"
                  :key="index"
                  :value="index"
                >
                  {{ name }}
                </option>
              </select>
              <select
                v-model="selectedYear"
                class="rounded-lg border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700"
              >
                <option v-for="year in yearRange" :key="year" :value="year">
                  พ.ศ. {{ year + 543 }}
                </option>
              </select>
            </template>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex h-64 w-full items-center justify-center">
        <div class="flex flex-col items-center gap-2">
          <div
            class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
          ></div>
          <p class="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>

      <div v-else class="space-y-6 animate-fade-in-up">
        <!-- 1. KPI Cards Grid (3x2 Layout) -->
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <!-- Hero Card 1: Net Profit (กำไรสุทธิ) -->
          <div
            class="relative overflow-hidden rounded-2xl p-6 transition-all duration-200 hover:shadow-lg"
            :class="
              netProfit >= 0
                ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-md shadow-emerald-600/15'
                : 'bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 text-white shadow-md shadow-rose-600/15'
            "
          >
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider text-emerald-100/80">
                  กำไรสุทธิ (Net Profit)
                </span>
                <h3 class="mt-2 text-3xl font-black tracking-tight text-white">
                  ฿{{ formatCurrency(netProfit) }}
                </h3>
              </div>
              <div class="rounded-xl bg-white/10 p-3 backdrop-blur-xs">
                <component :is="netProfit >= 0 ? TrendingUp : TrendingDown" class="h-6 w-6 text-white" />
              </div>
            </div>
            <div
              class="group relative mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/80 font-medium cursor-help"
              :title="`คิดจาก: (กำไรสุทธิ ฿${formatCurrency(netProfit)} ÷ ยอดขายรวม ฿${formatCurrency(stats.totalSales)}) × 100 = ${netProfitMargin}%`"
            >
              <span class="flex items-center gap-1">
                อัตรากำไร (Margin)
                <HelpCircle class="h-3.5 w-3.5 text-white/70 group-hover:text-white transition-colors" />
              </span>
              <span class="rounded-full bg-white/20 px-2.5 py-0.5 font-bold text-white shadow-xs">
                {{ netProfitMargin }}%
              </span>

              <!-- Hover Tooltip -->
              <div class="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 group-hover:flex flex-col items-center z-20 pointer-events-none w-64 text-center">
                <div class="rounded-xl bg-gray-900/95 text-white p-3 text-xs shadow-xl backdrop-blur-xs border border-white/10">
                  <p class="font-bold text-emerald-400 mb-1 flex items-center justify-center gap-1">
                    💡 สูตรคำนวณ Margin
                  </p>
                  <p class="text-gray-200">(กำไรสุทธิ ÷ ยอดขายรวม) × 100</p>
                  <p class="mt-1 text-[11px] text-gray-300 border-t border-gray-700/80 pt-1.5">
                    (฿{{ formatCurrency(netProfit) }} ÷ ฿{{ formatCurrency(stats.totalSales) }}) × 100 = <span class="font-bold text-white">{{ netProfitMargin }}%</span>
                  </p>
                </div>
                <div class="w-2.5 h-2.5 -mt-1 bg-gray-900/95 rotate-45 border-r border-b border-white/10"></div>
              </div>
            </div>
          </div>

          <!-- Hero Card 2: Total Sales (ยอดขายรวม) -->
          <div
            class="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  ยอดขายรวม (Total Revenue)
                </span>
                <h3 class="mt-2 text-3xl font-black tracking-tight text-gray-900">
                  ฿{{ formatCurrency(stats.totalSales) }}
                </h3>
              </div>
              <div class="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                <Wallet class="h-6 w-6" />
              </div>
            </div>
            <div class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
              <span>สัดส่วนยอดโอน / COD</span>
              <span class="font-bold text-gray-800">
                {{ transferPercent }}% / {{ codPercent }}%
              </span>
            </div>
          </div>

          <!-- Card 3: Transfer (ยอดโอน) -->
          <div
            class="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-blue-600">
                  ยอดโอน (Transfer)
                </span>
                <h3 class="mt-2 text-2xl md:text-3xl font-black text-gray-900">
                  ฿{{ formatCurrency(stats.totalTransfer) }}
                </h3>
              </div>
              <div class="rounded-xl bg-blue-50 p-3 text-blue-600">
                <ArrowRightLeft class="h-6 w-6" />
              </div>
            </div>
            <div class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
              <span>คิดเป็นสัดส่วนยอดขาย</span>
              <span class="rounded-full bg-blue-50 px-2 py-0.5 font-bold text-blue-700">
                {{ transferPercent }}%
              </span>
            </div>
          </div>

          <!-- Card 4: COD (เก็บปลายทาง) -->
          <div
            class="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-amber-600">
                  เก็บปลายทาง (COD)
                </span>
                <h3 class="mt-2 text-2xl md:text-3xl font-black text-gray-900">
                  ฿{{ formatCurrency(stats.totalCOD) }}
                </h3>
              </div>
              <div class="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Truck class="h-6 w-6" />
              </div>
            </div>
            <div class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
              <span>คิดเป็นสัดส่วนยอดขาย</span>
              <span class="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-700">
                {{ codPercent }}%
              </span>
            </div>
          </div>

          <!-- Card 5: Expenses (รายจ่ายรวม) -->
          <div
            class="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-rose-600">
                  รายจ่ายรวม (Expenses)
                </span>
                <h3 class="mt-2 text-2xl md:text-3xl font-black text-rose-950">
                  ฿{{ formatCurrency(expenseStore.totalExpenses) }}
                </h3>
              </div>
              <div class="rounded-xl bg-rose-50 p-3 text-rose-600">
                <Receipt class="h-6 w-6" />
              </div>
            </div>
            <div class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
              <span>จำนวนรายการ</span>
              <span class="font-bold text-rose-600">
                {{ expenseStore.totalCount }} รายการ
              </span>
            </div>
          </div>

          <!-- Card 6: Total Orders (จำนวนออเดอร์) -->
          <div
            class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500">
                  จำนวนออเดอร์ (Total Orders)
                </span>
                <h3 class="mt-2 text-2xl md:text-3xl font-black text-gray-900">
                  {{ stats.totalOrders.toLocaleString() }}
                </h3>
              </div>
              <div class="rounded-xl bg-slate-100 p-3 text-slate-600">
                <ShoppingBag class="h-6 w-6" />
              </div>
            </div>
            <div class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
              <span>เฉลี่ยต่อออเดอร์</span>
              <span class="font-bold text-gray-700">
                ฿{{ formatCurrency(avgOrderValue) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 2. Chart Section -->
        <SalesChart
          :title="chartTitle"
          :chart-data="chartData"
          :last-updated="lastUpdatedText"
        />

        <!-- 3. Recent Transactions Section -->
        <div
          class="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
        >
          <div
            class="flex items-center justify-between border-b border-gray-100 px-6 py-4"
          >
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-gray-900">รายการขายล่าสุด</h3>
              <span class="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                {{ recentTransactions.length }} รายการ
              </span>
            </div>
            <router-link
              to="/all-sales"
              class="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              ดูทั้งหมด →
            </router-link>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100">
              <thead class="bg-gray-50/70">
                <tr>
                  <th class="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    วันที่ & เวลา
                  </th>
                  <th class="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    เลขที่ออเดอร์
                  </th>
                  <th class="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    ลูกค้า
                  </th>
                  <th class="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    ประเภทการชำระ
                  </th>
                  <th class="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                    ยอดเงิน
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 bg-white">
                <tr v-if="recentTransactions.length === 0">
                  <td
                    colspan="5"
                    class="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    ไม่มีรายการในช่วงเวลานี้
                  </td>
                </tr>
                <tr
                  v-for="tx in recentTransactions"
                  :key="tx.id"
                  class="hover:bg-slate-50/80 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-600">
                    {{ formatDate(tx.dateTime) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {{ tx.orderNo || "-" }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <router-link
                      v-if="tx.customerName"
                      :to="{
                        name: 'CustomerDetail',
                        params: { name: tx.customerName },
                      }"
                      class="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                    >
                      {{ tx.customerName }}
                    </router-link>
                    <span v-else class="text-gray-400">ไม่ระบุ</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
                      :class="{
                        'bg-amber-50 text-amber-700 border border-amber-200/60': tx.type === 'COD',
                        'bg-indigo-50 text-indigo-700 border border-indigo-200/60': tx.type !== 'COD',
                      }"
                    >
                      {{ tx.type === 'COD' ? '📦 เก็บปลายทาง (COD)' : '💳 โอนเงิน (Transfer)' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-gray-900">
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
import Swal from "sweetalert2";
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
import { formatThaiDateTime, toDate } from "../utils/dateUtils.js";
import { formatCurrency } from "../utils/formatUtils.js";

// Store
import { useSalesStore } from "../stores/salesStore.js";
import { useExpenseStore } from "../stores/expenseStore.js";

// Icons
import { Wallet, ShoppingBag, ArrowRightLeft, Truck, Calendar, Receipt, TrendingUp, TrendingDown, HelpCircle } from "lucide-vue-next";

// Components
import PullToRefresh from "../components/PullToRefresh.vue";
import SalesChart from "../components/SalesChart.vue";

// --- Store ---
const salesStore = useSalesStore();
const expenseStore = useExpenseStore();

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

const netProfit = computed(
  () => stats.value.totalSales - expenseStore.totalExpenses
);

const netProfitMargin = computed(() => {
  if (stats.value.totalSales <= 0) return 0;
  return Math.round((netProfit.value / stats.value.totalSales) * 100);
});

const transferPercent = computed(() => {
  if (stats.value.totalSales <= 0) return 0;
  return Math.round(
    (stats.value.totalTransfer / stats.value.totalSales) * 100
  );
});

const codPercent = computed(() => {
  if (stats.value.totalSales <= 0) return 0;
  return Math.round((stats.value.totalCOD / stats.value.totalSales) * 100);
});

const avgOrderValue = computed(() => {
  if (stats.value.totalOrders <= 0) return 0;
  return Math.round(stats.value.totalSales / stats.value.totalOrders);
});

const recentTransactions = computed(() => salesStore.recentSales);
const loading = computed(() => salesStore.loading);

const lastUpdatedText = computed(() => {
  if (!salesStore.lastImportedTime) return "";
  return formatThaiDateTime(salesStore.lastImportedTime);
});

const timeRangeLabel = computed(() => {
  const labels = {
    today: "ประจำวันนี้",
    thisWeek: "ประจำสัปดาห์นี้",
    thisMonth: `ประจำเดือน${monthNames[currentDate.getMonth()]} พ.ศ. ${currentDate.getFullYear() + 543}`,
    thisYear: `ประจำปี พ.ศ. ${currentDate.getFullYear() + 543}`,
    allTime: "ตั้งแต่เริ่มต้น",
    selectMonth: `ประจำเดือน${monthNames[selectedMonth.value]} พ.ศ. ${selectedYear.value + 543}`,
  };
  return labels[selectedTimeRange.value] || "";
});

const chartTitle = computed(() => {
  const titles = {
    today: "เปรียบเทียบยอดขายและรายจ่ายรายวัน",
    thisWeek: "เปรียบเทียบยอดขายและรายจ่ายรายวัน",
    thisMonth: "เปรียบเทียบยอดขายและรายจ่ายรายวัน",
    selectMonth: "เปรียบเทียบยอดขายและรายจ่ายรายวัน",
    thisYear: "เปรียบเทียบยอดขายและรายจ่ายรายเดือน",
    allTime: "เปรียบเทียบยอดขายและรายจ่ายรายเดือน",
  };
  return titles[selectedTimeRange.value] || "ยอดขายและรายจ่าย";
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
        filter = { mode: "all" };
        break;
      default:
        filter = { mode: "thisMonth" };
    }

    // Fetch sales using the store
    await salesStore.fetchSales(filter);
    // Fetch expenses using the store
    await expenseStore.setFilter(filter);

    // Get sales with dates from store for charting
    const txs = salesStore.salesWithDates;

    // Prepare Chart Data based on time range
    prepareChartData(txs, start, end);

    // Show toast message for pull-to-refresh validation
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: false,
    });
    Toast.fire({
      icon: "success",
      title: "อัปเดตข้อมูลแล้ว (Sales Data Updated)",
    });
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
    monthlyData[key] = { COD: 0, Transfer: 0, Expense: 0 };
  });

  // Aggregate sales data
  transactions.forEach((tx) => {
    const key = format(tx.dateTime, "yyyy-MM");
    const type = tx.type === "COD" ? "COD" : "Transfer";
    const amt = Number(tx.amount) || 0;

    if (monthlyData[key]) {
      monthlyData[key][type] += amt;
    }
  });

  // Aggregate expenses data
  expenseStore.expenses.forEach((exp) => {
    const d = toDate(exp.dateTime);
    if (!d || isNaN(d.getTime())) return;
    const key = format(d, "yyyy-MM");
    const amt = Number(exp.amount) || 0;

    if (monthlyData[key]) {
      monthlyData[key].Expense += amt;
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

  const dataExpense = monthsRange.map((month) => {
    const key = format(month, "yyyy-MM");
    return monthlyData[key].Expense;
  });

  chartData.value = {
    labels: labels,
    datasets: [
      {
        label: "โอนเงิน",
        backgroundColor: "#4f46e5", // Indigo-600
        data: dataTransfer,
        borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
        stack: "sales",
      },
      {
        label: "COD",
        backgroundColor: "#f59e0b", // Amber-500
        data: dataCOD,
        borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
        stack: "sales",
      },
      {
        label: "รายจ่าย",
        backgroundColor: "#f43f5e", // Rose-500
        data: dataExpense,
        borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
        stack: "expenses",
      },
    ],
  };
};

const prepareDailyChart = (transactions, start, end) => {
  const range = selectedTimeRange.value;

  // Guard: start and end must be valid dates
  if (!start || !end) return;

  // Generate days in range
  const daysRange = eachDayOfInterval({ start, end });

  // Initialize daily data
  const dailyData = {};
  daysRange.forEach((day) => {
    const key = format(day, "yyyy-MM-dd");
    dailyData[key] = { COD: 0, Transfer: 0, Expense: 0 };
  });

  // Aggregate sales data
  transactions.forEach((tx) => {
    const key = format(tx.dateTime, "yyyy-MM-dd");
    const type = tx.type === "COD" ? "COD" : "Transfer";
    const amt = Number(tx.amount) || 0;

    if (dailyData[key]) {
      dailyData[key][type] += amt;
    }
  });

  // Aggregate expense data
  expenseStore.expenses.forEach((exp) => {
    const d = toDate(exp.dateTime);
    if (!d || isNaN(d.getTime())) return;
    const key = format(d, "yyyy-MM-dd");
    const amt = Number(exp.amount) || 0;

    if (dailyData[key]) {
      dailyData[key].Expense += amt;
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

  const dataExpense = daysRange.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    return dailyData[key].Expense;
  });

  chartData.value = {
    labels: labels,
    datasets: [
      {
        label: "โอนเงิน",
        backgroundColor: "#4f46e5", // Indigo-600
        data: dataTransfer,
        borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
        stack: "sales",
      },
      {
        label: "COD",
        backgroundColor: "#f59e0b", // Amber-500
        data: dataCOD,
        borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
        stack: "sales",
      },
      {
        label: "รายจ่าย",
        backgroundColor: "#f43f5e", // Rose-500
        data: dataExpense,
        borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
        stack: "expenses",
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

const formatDate = formatThaiDateTime;
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
