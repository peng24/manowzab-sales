<template>
  <div class="rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm">
    <div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-bold text-gray-800">{{ title }}</h3>
        <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hidden md:inline-block">
          {{ chartMode === 'sales' ? 'มุมมอง: โครงสร้างการขาย' : 'มุมมอง: รายรับ vs รายจ่าย' }}
        </span>
      </div>

      <div class="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
        <!-- Toggle Mode Switch -->
        <div class="flex items-center bg-gray-100/90 p-1 rounded-xl text-xs font-semibold border border-gray-200/60 shadow-inner">
          <button
            type="button"
            @click="chartMode = 'sales'"
            :class="[
              'px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer',
              chartMode === 'sales'
                ? 'bg-white text-indigo-700 shadow-sm font-bold border border-gray-200/50'
                : 'text-gray-600 hover:text-gray-900'
            ]"
          >
            <span>📊 โครงสร้างการขาย</span>
          </button>
          <button
            type="button"
            @click="chartMode = 'compare'"
            :class="[
              'px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer',
              chartMode === 'compare'
                ? 'bg-white text-indigo-700 shadow-sm font-bold border border-gray-200/50'
                : 'text-gray-600 hover:text-gray-900'
            ]"
          >
            <span>⚖️ รายรับ vs รายจ่าย</span>
          </button>
        </div>

        <div v-if="lastUpdated" class="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 w-fit">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>อัปเดตล่าสุด: {{ lastUpdated }}</span>
        </div>
      </div>
    </div>
    <div class="h-[210px] md:h-[235px] w-full">
      <Bar
        v-if="displayChartData.labels"
        :data="displayChartData"
        :options="computedOptions"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Bar } from "vue-chartjs";
import ChartDataLabels from "chartjs-plugin-datalabels";

import { formatCurrency } from "../utils/formatUtils.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
);

// Props
const props = defineProps({
  title: {
    type: String,
    default: "ยอดขาย",
  },
  chartData: {
    type: Object,
    required: true,
    default: () => ({ labels: [], datasets: [] }),
  },
  customOptions: {
    type: Object,
    default: null,
  },
  lastUpdated: {
    type: String,
    default: "",
  },
});

// State
const chartMode = ref("sales"); // 'sales' | 'compare'

// Filter chart data based on selected mode
const displayChartData = computed(() => {
  if (!props.chartData || !props.chartData.datasets) {
    return { labels: [], datasets: [] };
  }

  if (chartMode.value === "sales") {
    // Mode 1: Sales Breakdown only (Transfer + COD) -> Filter out Expense dataset
    return {
      labels: props.chartData.labels || [],
      datasets: props.chartData.datasets.filter(
        (ds) => ds.stack !== "expenses" && ds.label !== "รายจ่าย"
      ),
    };
  }

  // Mode 2: Revenue vs Expenses comparison -> Show all datasets
  return props.chartData;
});

// Default chart options
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 10, // Compact top clearance for data labels
    },
  },
  plugins: {
    legend: {
      position: "top",
      align: "end",
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        boxWidth: 8,
        boxHeight: 8,
        padding: 8,
        font: {
          family: "'Inter', 'Prompt', sans-serif",
          size: 12,
          weight: "500",
        },
        color: "#4b5563",
      },
    },
    tooltip: {
      backgroundColor: "#1e293b",
      titleColor: "#f8fafc",
      bodyColor: "#f1f5f9",
      padding: 12,
      cornerRadius: 10,
      titleFont: {
        size: 13,
        weight: "bold",
      },
      bodyFont: {
        size: 12,
      },
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += "฿" + formatCurrency(context.parsed.y);
          }
          return label;
        },
      },
    },
    datalabels: {
      anchor: "end",
      align: "end",
      offset: 1,
      clip: false,
      color: function (ctx) {
        const dataset = ctx.chart.data.datasets[ctx.datasetIndex];
        if (dataset?.stack === "expenses") return "#e11d48"; // rose-600 for expenses
        return "#374151"; // gray-700 for sales
      },
      font: function (ctx) {
        const totalLabels = ctx.chart.data.labels?.length || 0;
        return {
          weight: "700",
          size: totalLabels > 25 ? 8 : totalLabels > 15 ? 9 : 10,
        };
      },
      display: function (ctx) {
        const datasets = ctx.chart.data.datasets;
        const currentDataset = datasets[ctx.datasetIndex];
        const currentStack = currentDataset?.stack;
        const dataIndex = ctx.dataIndex;

        // Calculate stack sum for this index
        let sum = 0;
        datasets.forEach((dataset) => {
          if (!currentStack || dataset.stack === currentStack) {
            const val = dataset.data[dataIndex];
            sum += val || 0;
          }
        });

        // Hide label if sum is zero
        if (sum === 0) return false;

        // Find the last dataset index for this stack that has non-zero data
        let lastInStackIndex = -1;
        for (let i = 0; i < datasets.length; i++) {
          if (!currentStack || datasets[i].stack === currentStack) {
            lastInStackIndex = i;
          }
        }
        return ctx.datasetIndex === lastInStackIndex;
      },
      formatter: (value, ctx) => {
        const datasets = ctx.chart.data.datasets;
        const currentDataset = datasets[ctx.datasetIndex];
        const currentStack = currentDataset?.stack;
        const dataIndex = ctx.dataIndex;

        let sum = 0;
        datasets.forEach((dataset) => {
          if (!currentStack || dataset.stack === currentStack) {
            const val = dataset.data[dataIndex];
            sum += val || 0;
          }
        });

        // Hide if sum is 0
        if (sum === 0) return "";

        // Format as k for thousands (e.g., 1.5k, 10k, 15.5k)
        if (sum >= 1000) {
          return (sum / 1000).toFixed(sum % 1000 === 0 ? 0 : 1) + "k";
        }

        // Show raw number for values < 1000
        return sum.toString();
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      stacked: true,
      grace: "5%",
      border: { dash: [4, 4] },
      grid: {
        color: "#f1f5f9",
      },
      ticks: {
        color: "#64748b",
        font: { size: 11 },
        callback: (value) => {
          if (value >= 1000) return "฿" + (value / 1000).toFixed(1) + "k";
          return "฿" + value;
        },
      },
    },
    x: {
      stacked: true,
      grid: { display: false },
      ticks: {
        color: "#64748b",
        font: { size: 11, weight: "500" },
      },
    },
  },
};

// Simple deep merge helper
function deepMerge(target, source) {
  const output = { ...target };
  if (target && typeof target === "object" && source && typeof source === "object") {
    Object.keys(source).forEach((key) => {
      if (source[key] && typeof source[key] === "object") {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

// Merge custom options with default options
const computedOptions = computed(() => {
  if (props.customOptions) {
    return deepMerge(defaultOptions, props.customOptions);
  }
  return defaultOptions;
});
</script>
