<template>
  <div class="space-y-6 pb-12">
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <TrendingUp class="h-7 w-7 text-blue-600" />
          เปรียบเทียบยอดขาย
        </h1>
        <p class="text-xs md:text-sm text-slate-500 mt-1">
          วิเคราะห์แนวโน้ม อัตราการเติบโต และเปรียบเทียบยอดขายระหว่างช่วงเวลา
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="loadComparisonData"
          class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCw class="h-4 w-4 text-slate-400" :class="{ 'animate-spin': loading }" />
          รีเฟรชข้อมูล
        </button>
      </div>
    </div>

    <!-- Customization Control Panel -->
    <div class="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
          <SlidersHorizontal class="h-4 w-4 text-blue-500" />
          ตัวเลือกการปรับแต่งเปรียบเทียบ (Customization Controls)
        </h2>
        <span class="text-xs font-medium text-slate-400">
          {{ periodSummaryLabel }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 1. Comparison Mode -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-600">โหมดการเปรียบเทียบ</label>
          <select
            v-model="compareMode"
            @change="onCompareModeChange"
            class="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all"
          >
            <option value="MoY">📅 เดือนนี้ vs เดือนเดียวกันปีก่อน (MoY)</option>
            <option value="MoM">⏱️ เดือนนี้ vs เดือนก่อนหน้า (MoM)</option>
            <option value="YoY">📈 ทั้งปีนี้ vs ทั้งปีก่อน (YoY)</option>
            <option value="Custom">⚙️ กำหนด 2 ช่วงเวลาเอง (Custom)</option>
          </select>
        </div>

        <!-- 2. Primary Period Selector -->
        <div v-if="compareMode !== 'YoY'" class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-600">เดือนหลัก</label>
          <div class="grid grid-cols-2 gap-1.5">
            <select
              v-model="primaryMonth"
              class="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option v-for="(mName, idx) in thaiMonths" :key="idx" :value="idx">
                {{ mName }}
              </option>
            </select>
            <select
              v-model="primaryYear"
              class="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option v-for="yr in yearRange" :key="yr" :value="yr">
                พ.ศ. {{ yr + 543 }}
              </option>
            </select>
          </div>
        </div>

        <div v-else class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-600">ปีหลัก</label>
          <select
            v-model="primaryYear"
            class="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option v-for="yr in yearRange" :key="yr" :value="yr">
              พ.ศ. {{ yr + 543 }}
            </option>
          </select>
        </div>

        <!-- 3. Secondary Period Selector (Custom Mode Only) -->
        <div v-if="compareMode === 'Custom'" class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-600">ช่วงเวลาเปรียบเทียบ</label>
          <div class="grid grid-cols-2 gap-1.5">
            <select
              v-model="secondaryMonth"
              class="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option v-for="(mName, idx) in thaiMonths" :key="idx" :value="idx">
                {{ mName }}
              </option>
            </select>
            <select
              v-model="secondaryYear"
              class="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option v-for="yr in yearRange" :key="yr" :value="yr">
                พ.ศ. {{ yr + 543 }}
              </option>
            </select>
          </div>
        </div>

        <!-- 4. Payment Type Filter -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-600">ประเภทช่องทางการขาย</label>
          <select
            v-model="paymentTypeFilter"
            class="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="all">ทั้งหมด (โอนเงิน + COD)</option>
            <option value="Transfer">💳 เฉพาะโอนเงิน (Transfer)</option>
            <option value="COD">📦 เฉพาะเก็บปลายทาง (COD)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading Spinner -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16">
      <Loader2 class="h-10 w-10 text-blue-600 animate-spin mb-3" />
      <p class="text-sm font-semibold text-slate-600">กำลังประมวลผลข้อมูลเปรียบเทียบ...</p>
    </div>

    <template v-else>
      <!-- KPI Executive Growth Summary Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <!-- KPI 1: Total Revenue -->
        <div class="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
          <div class="absolute -right-4 -bottom-4 text-blue-50 opacity-60 pointer-events-none">
            <DollarSign class="h-24 w-24" />
          </div>
          <div>
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">ยอดขายรวม</span>
            <div class="mt-2 flex items-baseline justify-between">
              <h3 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                ฿{{ formatCurrency(stats1.sales) }}
              </h3>
              <!-- Growth Badge -->
              <span
                class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                :class="salesGrowth >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-rose-50 text-rose-600 border border-rose-200/60'"
              >
                <ArrowUpRight v-if="salesGrowth >= 0" class="h-3.5 w-3.5" />
                <ArrowDownRight v-else class="h-3.5 w-3.5" />
                {{ Math.abs(salesGrowth).toFixed(1) }}%
              </span>
            </div>
          </div>
          <div class="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>เทียบช่วงเดิม: ฿{{ formatCurrency(stats2.sales) }}</span>
            <span :class="salesDiff >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'">
              {{ salesDiff >= 0 ? '+' : '' }}฿{{ formatCurrency(salesDiff) }}
            </span>
          </div>
        </div>

        <!-- KPI 2: Total Orders -->
        <div class="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
          <div class="absolute -right-4 -bottom-4 text-amber-50 opacity-60 pointer-events-none">
            <ShoppingBag class="h-24 w-24" />
          </div>
          <div>
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">จำนวนคำสั่งซื้อ</span>
            <div class="mt-2 flex items-baseline justify-between">
              <h3 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {{ stats1.orders.toLocaleString('th-TH') }} <span class="text-sm font-semibold text-slate-500">ออเดอร์</span>
              </h3>
              <span
                class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                :class="ordersGrowth >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-rose-50 text-rose-600 border border-rose-200/60'"
              >
                <ArrowUpRight v-if="ordersGrowth >= 0" class="h-3.5 w-3.5" />
                <ArrowDownRight v-else class="h-3.5 w-3.5" />
                {{ Math.abs(ordersGrowth).toFixed(1) }}%
              </span>
            </div>
          </div>
          <div class="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>เทียบช่วงเดิม: {{ stats2.orders.toLocaleString('th-TH') }} ออเดอร์</span>
            <span :class="ordersDiff >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'">
              {{ ordersDiff >= 0 ? '+' : '' }}{{ ordersDiff }}
            </span>
          </div>
        </div>

        <!-- KPI 3: Average Order Value (AOV) -->
        <div class="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
          <div class="absolute -right-4 -bottom-4 text-purple-50 opacity-60 pointer-events-none">
            <Receipt class="h-24 w-24" />
          </div>
          <div>
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">เฉลี่ยต่อออเดอร์ (AOV)</span>
            <div class="mt-2 flex items-baseline justify-between">
              <h3 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                ฿{{ formatCurrency(stats1.aov) }}
              </h3>
              <span
                class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                :class="aovGrowth >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-rose-50 text-rose-600 border border-rose-200/60'"
              >
                <ArrowUpRight v-if="aovGrowth >= 0" class="h-3.5 w-3.5" />
                <ArrowDownRight v-else class="h-3.5 w-3.5" />
                {{ Math.abs(aovGrowth).toFixed(1) }}%
              </span>
            </div>
          </div>
          <div class="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>เทียบช่วงเดิม: ฿{{ formatCurrency(stats2.aov) }}</span>
            <span :class="aovDiff >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'">
              {{ aovDiff >= 0 ? '+' : '' }}฿{{ formatCurrency(aovDiff) }}
            </span>
          </div>
        </div>

        <!-- KPI 4: Net Profit (ยอดขาย - รายจ่าย) -->
        <div class="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 shadow-lg shadow-emerald-600/10 text-white flex flex-col justify-between relative overflow-hidden">
          <div class="absolute -right-4 -bottom-4 text-white opacity-10 pointer-events-none">
            <PiggyBank class="h-24 w-24" />
          </div>
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-emerald-100 uppercase tracking-wider">กำไรสุทธิ (Net Profit)</span>
              <span class="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-xs">
                Margin {{ stats1.margin.toFixed(1) }}%
              </span>
            </div>
            <div class="mt-2 flex items-baseline justify-between">
              <h3 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                ฿{{ formatCurrency(stats1.netProfit) }}
              </h3>
              <span
                class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold bg-white/20 text-white backdrop-blur-xs"
              >
                <ArrowUpRight v-if="profitGrowth >= 0" class="h-3.5 w-3.5" />
                <ArrowDownRight v-else class="h-3.5 w-3.5" />
                {{ Math.abs(profitGrowth).toFixed(1) }}%
              </span>
            </div>
          </div>
          <div class="mt-4 border-t border-white/20 pt-3 flex items-center justify-between text-xs text-emerald-100 font-medium">
            <span>เทียบช่วงเดิม: ฿{{ formatCurrency(stats2.netProfit) }}</span>
            <span class="font-bold text-white">
              {{ profitDiff >= 0 ? '+' : '' }}฿{{ formatCurrency(profitDiff) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Chart Comparison Section -->
      <div class="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-slate-100">
        <div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 class="h-5 w-5 text-blue-600" />
              กราฟเปรียบเทียบยอดขาย (Sales Comparison Chart)
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              เปรียบเทียบยอดขายแยกตามรายวัน/รายเดือน ของทั้งสองช่วงเวลา
            </p>
          </div>
          <div class="flex items-center gap-4 text-xs font-bold">
            <span class="flex items-center gap-1.5 text-blue-600">
              <span class="h-3 w-3 rounded-xs bg-blue-600"></span> {{ labelPeriod1 }}
            </span>
            <span class="flex items-center gap-1.5 text-amber-600">
              <span class="h-3 w-3 rounded-xs bg-amber-500"></span> {{ labelPeriod2 }}
            </span>
          </div>
        </div>

        <!-- Render Chart Component -->
        <CompareChart
          :labels="chartLabels"
          :dataset1="{ label: labelPeriod1, data: series1Data }"
          :dataset2="{ label: labelPeriod2, data: series2Data }"
        />
      </div>

      <!-- Breakdown Table Comparison -->
      <div class="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet class="h-5 w-5 text-blue-600" />
            ตารางวิเคราะห์ส่วนต่างการขาย (Detailed Breakdown Table)
          </h3>
          <span class="text-xs font-semibold text-slate-400">
            แสดงส่วนต่าง (฿) และอัตราเปลี่ยนแปลง (%)
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
              <tr>
                <th class="px-6 py-3.5">ช่วงเวลา / วันที่</th>
                <th class="px-6 py-3.5 text-right">{{ labelPeriod1 }}</th>
                <th class="px-6 py-3.5 text-right">{{ labelPeriod2 }}</th>
                <th class="px-6 py-3.5 text-right">ส่วนต่าง (฿)</th>
                <th class="px-6 py-3.5 text-center">% เปลี่ยนแปลง</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700 font-medium">
              <tr
                v-for="(row, idx) in breakdownRows"
                :key="idx"
                class="hover:bg-slate-50/80 transition-colors"
              >
                <td class="px-6 py-3.5 font-bold text-slate-900">
                  {{ row.label }}
                </td>
                <td class="px-6 py-3.5 text-right font-semibold text-blue-600">
                  ฿{{ formatCurrency(row.val1) }}
                </td>
                <td class="px-6 py-3.5 text-right font-semibold text-amber-600">
                  ฿{{ formatCurrency(row.val2) }}
                </td>
                <td
                  class="px-6 py-3.5 text-right font-bold"
                  :class="row.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'"
                >
                  {{ row.diff >= 0 ? '+' : '' }}฿{{ formatCurrency(row.diff) }}
                </td>
                <td class="px-6 py-3.5 text-center">
                  <span
                    class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold"
                    :class="row.percent >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'"
                  >
                    {{ row.percent >= 0 ? '+' : '' }}{{ row.percent.toFixed(1) }}%
                  </span>
                </td>
              </tr>
            </tbody>
            <!-- Total Summary Row -->
            <tfoot class="bg-slate-900 text-white font-bold border-t-2 border-slate-800">
              <tr>
                <td class="px-6 py-4">ยอดรวมทั้งหมด (Total)</td>
                <td class="px-6 py-4 text-right text-blue-300">฿{{ formatCurrency(stats1.sales) }}</td>
                <td class="px-6 py-4 text-right text-amber-300">฿{{ formatCurrency(stats2.sales) }}</td>
                <td class="px-6 py-4 text-right" :class="salesDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                  {{ salesDiff >= 0 ? '+' : '' }}฿{{ formatCurrency(salesDiff) }}
                </td>
                <td class="px-6 py-4 text-center">
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-extrabold"
                    :class="salesGrowth >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'"
                  >
                    {{ salesGrowth >= 0 ? '+' : '' }}{{ salesGrowth.toFixed(1) }}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import {
  TrendingUp,
  RotateCw,
  SlidersHorizontal,
  Loader2,
  DollarSign,
  ShoppingBag,
  Receipt,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  FileSpreadsheet,
} from "lucide-vue-next";
import CompareChart from "../components/CompareChart.vue";
import { formatCurrency } from "../utils/formatUtils.js";
import { formatThaiDate, toDate } from "../utils/dateUtils.js";

// Services & Store
import { getAllSales } from "../services/salesService.js";
import { getAllExpenses } from "../services/expenseService.js";

const loading = ref(false);
const allSales = ref([]);
const allExpenses = ref([]);

const thaiMonths = [
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

const today = new Date();
const currentMonthIdx = today.getMonth();
const currentYearNum = today.getFullYear();

// Year range dropdown
const yearRange = computed(() => {
  const cy = today.getFullYear();
  const list = [];
  for (let y = cy - 5; y <= cy + 1; y++) {
    list.push(y);
  }
  return list;
});

// Customization Controls State
const compareMode = ref("MoY"); // 'MoY', 'MoM', 'YoY', 'Custom'
const primaryMonth = ref(currentMonthIdx);
const primaryYear = ref(currentYearNum);
const secondaryMonth = ref(currentMonthIdx);
const secondaryYear = ref(currentYearNum - 1);
const paymentTypeFilter = ref("all"); // 'all', 'Transfer', 'COD'

// Mode Change Handler
const onCompareModeChange = () => {
  if (compareMode.value === "MoY") {
    secondaryMonth.value = primaryMonth.value;
    secondaryYear.value = primaryYear.value - 1;
  } else if (compareMode.value === "MoM") {
    if (primaryMonth.value === 0) {
      secondaryMonth.value = 11;
      secondaryYear.value = primaryYear.value - 1;
    } else {
      secondaryMonth.value = primaryMonth.value - 1;
      secondaryYear.value = primaryYear.value;
    }
  } else if (compareMode.value === "YoY") {
    secondaryYear.value = primaryYear.value - 1;
  }
};

watch([primaryMonth, primaryYear], () => {
  if (compareMode.value === "MoY") {
    secondaryMonth.value = primaryMonth.value;
    secondaryYear.value = primaryYear.value - 1;
  } else if (compareMode.value === "MoM") {
    if (primaryMonth.value === 0) {
      secondaryMonth.value = 11;
      secondaryYear.value = primaryYear.value - 1;
    } else {
      secondaryMonth.value = primaryMonth.value - 1;
      secondaryYear.value = primaryYear.value;
    }
  } else if (compareMode.value === "YoY") {
    secondaryYear.value = primaryYear.value - 1;
  }
});

// Period Labels
const labelPeriod1 = computed(() => {
  if (compareMode.value === "YoY") {
    return `ปี พ.ศ. ${primaryYear.value + 543}`;
  }
  return `${thaiMonths[primaryMonth.value]} พ.ศ. ${primaryYear.value + 543}`;
});

const labelPeriod2 = computed(() => {
  if (compareMode.value === "YoY") {
    return `ปี พ.ศ. ${secondaryYear.value + 543}`;
  }
  return `${thaiMonths[secondaryMonth.value]} พ.ศ. ${secondaryYear.value + 543}`;
});

const periodSummaryLabel = computed(() => {
  return `เปรียบเทียบ [ ${labelPeriod1.value} ] vs [ ${labelPeriod2.value} ]`;
});

// Data Loaders
const loadComparisonData = async () => {
  loading.value = true;
  try {
    const [salesData, expensesData] = await Promise.all([
      getAllSales(),
      getAllExpenses(),
    ]);
    allSales.value = salesData || [];
    allExpenses.value = expensesData || [];
  } catch (err) {
    console.error("Error loading comparison data:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadComparisonData();
});

// Data Filtering & Analysis Computation
const filteredSales = computed(() => {
  if (paymentTypeFilter.value === "all") return allSales.value;
  return allSales.value.filter((s) => s.type === paymentTypeFilter.value);
});

// Period 1 Records
const period1Sales = computed(() => {
  return filteredSales.value.filter((sale) => {
    const d = toDate(sale.dateTime);
    if (!d) return false;
    if (compareMode.value === "YoY") {
      return d.getFullYear() === primaryYear.value;
    }
    return (
      d.getFullYear() === primaryYear.value &&
      d.getMonth() === primaryMonth.value
    );
  });
});

const period1Expenses = computed(() => {
  return allExpenses.value.filter((exp) => {
    const d = toDate(exp.date);
    if (!d) return false;
    if (compareMode.value === "YoY") {
      return d.getFullYear() === primaryYear.value;
    }
    return (
      d.getFullYear() === primaryYear.value &&
      d.getMonth() === primaryMonth.value
    );
  });
});

// Period 2 Records
const period2Sales = computed(() => {
  return filteredSales.value.filter((sale) => {
    const d = toDate(sale.dateTime);
    if (!d) return false;
    if (compareMode.value === "YoY") {
      return d.getFullYear() === secondaryYear.value;
    }
    return (
      d.getFullYear() === secondaryYear.value &&
      d.getMonth() === secondaryMonth.value
    );
  });
});

const period2Expenses = computed(() => {
  return allExpenses.value.filter((exp) => {
    const d = toDate(exp.date);
    if (!d) return false;
    if (compareMode.value === "YoY") {
      return d.getFullYear() === secondaryYear.value;
    }
    return (
      d.getFullYear() === secondaryYear.value &&
      d.getMonth() === secondaryMonth.value
    );
  });
});

// Stats calculation for Period 1
const stats1 = computed(() => {
  const salesSum = period1Sales.value.reduce(
    (acc, item) => acc + Number(item.amount || 0),
    0
  );
  const orderCount = period1Sales.value.length;
  const aov = orderCount > 0 ? salesSum / orderCount : 0;
  const expenseSum = period1Expenses.value.reduce(
    (acc, item) => acc + Number(item.amount || 0),
    0
  );
  const netProfit = salesSum - expenseSum;
  const margin = salesSum > 0 ? (netProfit / salesSum) * 100 : 0;
  return {
    sales: salesSum,
    orders: orderCount,
    aov,
    expenses: expenseSum,
    netProfit,
    margin,
  };
});

// Stats calculation for Period 2
const stats2 = computed(() => {
  const salesSum = period2Sales.value.reduce(
    (acc, item) => acc + Number(item.amount || 0),
    0
  );
  const orderCount = period2Sales.value.length;
  const aov = orderCount > 0 ? salesSum / orderCount : 0;
  const expenseSum = period2Expenses.value.reduce(
    (acc, item) => acc + Number(item.amount || 0),
    0
  );
  const netProfit = salesSum - expenseSum;
  const margin = salesSum > 0 ? (netProfit / salesSum) * 100 : 0;
  return {
    sales: salesSum,
    orders: orderCount,
    aov,
    expenses: expenseSum,
    netProfit,
    margin,
  };
});

// Growth Differentials
const salesDiff = computed(() => stats1.value.sales - stats2.value.sales);
const salesGrowth = computed(() => {
  if (stats2.value.sales === 0) return stats1.value.sales > 0 ? 100 : 0;
  return ((stats1.value.sales - stats2.value.sales) / stats2.value.sales) * 100;
});

const ordersDiff = computed(() => stats1.value.orders - stats2.value.orders);
const ordersGrowth = computed(() => {
  if (stats2.value.orders === 0) return stats1.value.orders > 0 ? 100 : 0;
  return ((stats1.value.orders - stats2.value.orders) / stats2.value.orders) * 100;
});

const aovDiff = computed(() => stats1.value.aov - stats2.value.aov);
const aovGrowth = computed(() => {
  if (stats2.value.aov === 0) return stats1.value.aov > 0 ? 100 : 0;
  return ((stats1.value.aov - stats2.value.aov) / stats2.value.aov) * 100;
});

const profitDiff = computed(() => stats1.value.netProfit - stats2.value.netProfit);
const profitGrowth = computed(() => {
  if (stats2.value.netProfit === 0) return stats1.value.netProfit > 0 ? 100 : 0;
  return ((stats1.value.netProfit - stats2.value.netProfit) / Math.abs(stats2.value.netProfit)) * 100;
});

// Chart & Breakdown Table Data
const chartLabels = computed(() => {
  if (compareMode.value === "YoY") {
    return thaiMonths.map((m) => m.substring(0, 3));
  }
  // Days 1 to 31
  const daysInMonth = new Date(
    primaryYear.value,
    primaryMonth.value + 1,
    0
  ).getDate();
  const list = [];
  for (let i = 1; i <= daysInMonth; i++) {
    list.push(`วันที่ ${i}`);
  }
  return list;
});

const series1Data = computed(() => {
  if (compareMode.value === "YoY") {
    const monthTotals = Array(12).fill(0);
    period1Sales.value.forEach((s) => {
      const d = toDate(s.dateTime);
      if (d) monthTotals[d.getMonth()] += Number(s.amount || 0);
    });
    return monthTotals;
  }

  const daysInMonth = chartLabels.value.length;
  const dayTotals = Array(daysInMonth).fill(0);
  period1Sales.value.forEach((s) => {
    const d = toDate(s.dateTime);
    if (d) {
      const dayIdx = d.getDate() - 1;
      if (dayIdx >= 0 && dayIdx < daysInMonth) {
        dayTotals[dayIdx] += Number(s.amount || 0);
      }
    }
  });
  return dayTotals;
});

const series2Data = computed(() => {
  if (compareMode.value === "YoY") {
    const monthTotals = Array(12).fill(0);
    period2Sales.value.forEach((s) => {
      const d = toDate(s.dateTime);
      if (d) monthTotals[d.getMonth()] += Number(s.amount || 0);
    });
    return monthTotals;
  }

  const daysInMonth = chartLabels.value.length;
  const dayTotals = Array(daysInMonth).fill(0);
  period2Sales.value.forEach((s) => {
    const d = toDate(s.dateTime);
    if (d) {
      const dayIdx = d.getDate() - 1;
      if (dayIdx >= 0 && dayIdx < daysInMonth) {
        dayTotals[dayIdx] += Number(s.amount || 0);
      }
    }
  });
  return dayTotals;
});

const breakdownRows = computed(() => {
  const labels = chartLabels.value;
  const s1 = series1Data.value;
  const s2 = series2Data.value;

  return labels.map((lbl, idx) => {
    const val1 = s1[idx] || 0;
    const val2 = s2[idx] || 0;
    const diff = val1 - val2;
    const percent = val2 > 0 ? (diff / val2) * 100 : val1 > 0 ? 100 : 0;
    return {
      label: lbl,
      val1,
      val2,
      diff,
      percent,
    };
  });
});
</script>
