<template>
  <div class="relative h-[320px] md:h-[380px] w-full">
    <Bar :data="chartData" :options="defaultOptions" />
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
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "vue-chartjs";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ChartDataLabels
);

const props = defineProps({
  labels: {
    type: Array,
    required: true,
  },
  dataset1: {
    type: Object,
    required: true, // { label: 'ช่วงที่ 1', data: [...] }
  },
  dataset2: {
    type: Object,
    required: true, // { label: 'ช่วงที่ 2', data: [...] }
  },
});

const formatCurrencyShort = (val) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
  if (val >= 1000) return (val / 1000).toFixed(0) + "k";
  return val.toLocaleString("th-TH");
};

const chartData = computed(() => {
  return {
    labels: props.labels,
    datasets: [
      {
        label: props.dataset1.label || "ช่วงเวลาปัจจุบัน",
        data: props.dataset1.data || [],
        backgroundColor: "rgba(59, 130, 246, 0.85)", // Indigo Blue
        borderColor: "#2563eb",
        borderWidth: 1.5,
        borderRadius: { topLeft: 4, topRight: 4 },
        barPercentage: 0.8,
        categoryPercentage: 0.7,
      },
      {
        label: props.dataset2.label || "ช่วงเวลาเปรียบเทียบ",
        data: props.dataset2.data || [],
        backgroundColor: "rgba(245, 158, 11, 0.85)", // Amber Gold
        borderColor: "#d97706",
        borderWidth: 1.5,
        borderRadius: { topLeft: 4, topRight: 4 },
        barPercentage: 0.8,
        categoryPercentage: 0.7,
      },
    ],
  };
});

const defaultOptions = computed(() => {
  const totalItems = props.labels.length;
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 28,
        bottom: 5,
        left: 5,
        right: 5,
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          font: { family: "sans-serif", size: 12, weight: "bold" },
          usePointStyle: true,
          boxWidth: 8,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { size: 13, weight: "bold" },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("th-TH", {
                style: "currency",
                currency: "THB",
                maximumFractionDigits: 0,
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
      datalabels: {
        anchor: "end",
        align: "end",
        offset: 2,
        font: (context) => {
          return {
            weight: "bold",
            size: totalItems > 20 ? 8 : 10,
          };
        },
        color: (context) => {
          return context.datasetIndex === 0 ? "#1d4ed8" : "#b45309";
        },
        formatter: (value) => {
          if (!value || value === 0) return "";
          return formatCurrencyShort(value);
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11 },
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#f1f5f9" },
        ticks: {
          font: { size: 11 },
          callback: (value) => "฿" + formatCurrencyShort(value),
        },
      },
    },
  };
});
</script>
