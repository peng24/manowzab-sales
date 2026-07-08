<template>
  <div class="rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm">
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <h3 class="text-lg font-bold text-gray-800">{{ title }}</h3>
      <div v-if="lastUpdated" class="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 w-fit">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>อัปเดตล่าสุด: {{ lastUpdated }}</span>
      </div>
    </div>
    <div class="h-[300px] md:h-[350px] w-full">
      <Bar
        v-if="chartData.labels"
        :data="chartData"
        :options="computedOptions"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
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

// Default chart options
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 40, // Prevent data labels from being clipped at the top
    },
  },
  plugins: {
    legend: {
      position: "bottom",
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat("th-TH", {
              style: "currency",
              currency: "THB",
            }).format(context.parsed.y);
          }
          return label;
        },
      },
    },
    datalabels: {
      anchor: "end",
      align: "end",
      color: "#4b5563", // gray-600
      font: {
        weight: "bold",
        size: 11,
      },
      display: function (ctx) {
        // Show only on the last dataset to avoid duplicate labels
        return ctx.datasetIndex === ctx.chart.data.datasets.length - 1;
      },
      formatter: (value, ctx) => {
        // Calculate sum of all datasets for this data index
        const datasets = ctx.chart.data.datasets;
        const dataIndex = ctx.dataIndex;

        let sum = 0;
        datasets.forEach((dataset) => {
          const val = dataset.data[dataIndex];
          sum += val || 0;
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
      ticks: {
        callback: (value) => {
          if (value >= 1000) return "฿" + (value / 1000).toFixed(1) + "k";
          return "฿" + value;
        },
      },
    },
    x: {
      stacked: true,
      grid: { display: false },
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
