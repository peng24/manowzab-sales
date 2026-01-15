<template>
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- Header & Filter -->
    <div class="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p class="text-gray-500">ภาพรวมยอดขายประจำเดือน</p>
      </div>

      <!-- Date Filter -->
      <div class="flex items-center gap-3 rounded-xl bg-white p-2 shadow-sm border border-gray-200">
        <select 
          v-model="selectedMonth" 
          class="rounded-lg border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium focus:border-blue-500 focus:ring-blue-500"
        >
          <option v-for="(name, index) in monthNames" :key="index" :value="index">
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
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex h-64 w-full items-center justify-center">
      <div class="flex flex-col items-center gap-2">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p class="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    </div>

    <div v-else class="space-y-8 animate-fade-in-up">
      <!-- 1. Summary Cards -->
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Total Sales -->
        <div class="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm transition-transform hover:-translate-y-1">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-blue-600">ยอดขายรวม</p>
              <h3 class="mt-2 text-3xl font-bold text-gray-900">฿{{ formatCurrency(stats.totalSales) }}</h3>
            </div>
            <div class="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Wallet class="h-6 w-6" />
            </div>
          </div>
        </div>

        <!-- Total Orders -->
        <div class="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6 shadow-sm transition-transform hover:-translate-y-1">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-indigo-600">จำนวนออเดอร์</p>
              <h3 class="mt-2 text-3xl font-bold text-gray-900">{{ stats.totalOrders.toLocaleString() }}</h3>
            </div>
            <div class="rounded-lg bg-indigo-100 p-3 text-indigo-600">
              <ShoppingBag class="h-6 w-6" />
            </div>
          </div>
        </div>

        <!-- Transfer Total -->
        <div class="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 shadow-sm transition-transform hover:-translate-y-1">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-emerald-600">ยอดโอน (Transfer)</p>
              <h3 class="mt-2 text-3xl font-bold text-gray-900">฿{{ formatCurrency(stats.totalTransfer) }}</h3>
            </div>
            <div class="rounded-lg bg-emerald-100 p-3 text-emerald-600">
              <ArrowRightLeft class="h-6 w-6" />
            </div>
          </div>
        </div>

        <!-- COD Total -->
        <div class="rounded-2xl border border-orange-100 bg-orange-50/50 p-6 shadow-sm transition-transform hover:-translate-y-1">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-orange-600">เก็บเงินปลายทาง (COD)</p>
              <h3 class="mt-2 text-3xl font-bold text-gray-900">฿{{ formatCurrency(stats.totalCOD) }}</h3>
            </div>
            <div class="rounded-lg bg-orange-100 p-3 text-orange-600">
              <Truck class="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Chart Section -->
      <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 class="mb-6 text-lg font-bold text-gray-800">ยอดขายรายวัน</h3>
        <div class="h-[350px] w-full">
          <Bar v-if="chartData.labels" :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- 3. Recent Transactions -->
      <div class="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div class="border-b border-gray-100 px-6 py-4">
          <h3 class="font-bold text-gray-800">รายการล่าสุด</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">วันที่</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Order No</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ลูกค้า</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ประเภท</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ยอดเงิน</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr v-if="recentTransactions.length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-sm text-gray-400">ไม่มีรายการในเดือนนี้</td>
              </tr>
              <tr 
                v-for="tx in recentTransactions" 
                :key="tx.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ formatDate(tx.dateTime) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ tx.orderNo || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ tx.customerName || 'ไม่ระบุ' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
                    :class="{
                      'bg-orange-100 text-orange-800': tx.type === 'COD',
                      'bg-emerald-100 text-emerald-800': tx.type !== 'COD'
                    }"
                  >
                    {{ tx.type || 'N/A' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                  ฿{{ formatCurrency(tx.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { db } from '../firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { th } from 'date-fns/locale'

// Icons
import { Wallet, ShoppingBag, ArrowRightLeft, Truck } from 'lucide-vue-next'

// Chart.js
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// --- State ---
const loading = ref(false)
const currentDate = new Date()
const selectedMonth = ref(currentDate.getMonth())
const selectedYear = ref(currentDate.getFullYear())

const stats = ref({
  totalSales: 0,
  totalOrders: 0,
  totalTransfer: 0,
  totalCOD: 0
})

const recentTransactions = ref([])
const chartData = ref({})

// Constants
const monthNames = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
]
const yearRange = computed(() => {
  const current = new Date().getFullYear()
  const years = []
  for (let i = current - 4; i <= current + 1; i++) {
    years.push(i)
  }
  return years
})

// --- Logic ---

const fetchData = async () => {
  loading.value = true
  try {
    const start = startOfMonth(new Date(selectedYear.value, selectedMonth.value))
    const end = endOfMonth(new Date(selectedYear.value, selectedMonth.value))

    // Query Firestore
    // Note: Ensure Firestore Composite Index exists for (dateTime ASC) if needed, 
    // but for simple range we use 'date' or 'dateTime'
    const salesRef = collection(db, 'sales')
    const q = query(
      salesRef, 
      where('dateTime', '>=', start),
      where('dateTime', '<=', end),
      orderBy('dateTime', 'desc')
    )

    const snapshot = await getDocs(q)
    
    // Aggregation Variables
    let totalSales = 0
    let totalOrders = 0
    let totalTransfer = 0
    let totalCOD = 0
    
    const dailyData = {} // Key: day (1-31) -> { COD: 0, Transfer: 0 }
    const daysInMonth = end.getDate()

    // Initialize daily map
    for(let i=1; i<=daysInMonth; i++) {
      dailyData[i] = { COD: 0, Transfer: 0 }
    }

    const txs = []

    snapshot.forEach(doc => {
      const data = doc.data()
      const amt = Number(data.amount) || 0
      const type = data.type === 'COD' ? 'COD' : 'Transfer'
      
      // Update Stats
      totalSales += amt
      totalOrders += 1
      if (type === 'COD') totalCOD += amt
      else totalTransfer += amt

      // Update Daily Data for Chart
      // Assuming 'dateTime' is a Timestamp or Date object
      let dateObj = data.dateTime && data.dateTime.toDate ? data.dateTime.toDate() : new Date(data.dateTime)
      
      // Fallback for missing dateTime, use date string
      if (!data.dateTime && data.date) {
        dateObj = new Date(data.date)
      }

      if (dateObj instanceof Date && !isNaN(dateObj)) {
          const day = dateObj.getDate()
          if (dailyData[day]) {
            dailyData[day][type] += amt
          }
           // Add to transactions list (keep all for now, slice later for table)
          txs.push({ id: doc.id, ...data, dateTime: dateObj })
      }
    })

    // Set State
    stats.value = { totalSales, totalOrders, totalTransfer, totalCOD }
    recentTransactions.value = txs.slice(0, 10) // Top 10 recent

    // Prepare Chart Data
    const labels = Object.keys(dailyData) // 1...31
    const dataCOD = labels.map(day => dailyData[day].COD)
    const dataTransfer = labels.map(day => dailyData[day].Transfer)

    chartData.value = {
      labels: labels,
      datasets: [
        {
          label: 'โอนเงิน',
          backgroundColor: '#10b981', // emerald-500
          data: dataTransfer,
          borderRadius: 4,
          stack: 'combined' 
        },
        {
          label: 'COD',
          backgroundColor: '#f97316', // orange-500
          data: dataCOD,
          borderRadius: 4,
          stack: 'combined'
        }
      ]
    }

  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    // Optional: Swal error
  } finally {
    loading.value = false
  }
}

// Watchers
watch([selectedMonth, selectedYear], () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})

// Utilities
const formatCurrency = (val) => new Intl.NumberFormat('th-TH').format(val || 0)

const formatDate = (date) => {
  if (!date) return '-'
  try {
      return format(date, 'd MMM yy HH:mm', { locale: th })
  } catch (e) {
      return '-'
  }
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      stacked: true,
      ticks: {
        callback: (value) => {
           if (value >= 1000) return '฿' + (value/1000).toFixed(1) + 'k'
           return '฿' + value
        }
      }
    },
    x: {
      stacked: true,
      grid: { display: false }
    }
  }
}
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
