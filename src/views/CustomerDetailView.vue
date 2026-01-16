<template>
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
      <div class="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8 shadow-lg">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <!-- Customer Name -->
          <div>
            <p class="text-sm font-medium text-blue-100 mb-2">ข้อมูลลูกค้า</p>
            <h1 class="text-3xl md:text-4xl font-bold text-white">{{ name }}</h1>
          </div>
          
          <!-- Right Section: Total & Filter -->
          <div class="flex flex-col gap-4 sm:flex-row sm:items-end lg:items-center">
            <!-- Total Spent -->
            <div class="text-left sm:text-right">
              <p class="text-sm font-medium text-blue-100 mb-1">
                ยอดซื้อรวม<span class="text-xs ml-1">({{ dateFilterLabel }})</span>
              </p>
              <h2 class="text-3xl md:text-4xl font-bold text-white">
                ฿{{ formatCurrency(totalSpent) }}
              </h2>
            </div>
            
            <!-- Date Filter Dropdown -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-blue-100">ช่วงเวลา</label>
              <select 
                v-model="selectedFilter"
                class="bg-white/95 border border-white/30 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-white focus:border-white block px-3 py-2.5 shadow-md backdrop-blur-sm min-w-[150px]"
              >
                <option v-for="filter in dateFilters" :key="filter.value" :value="filter.value">
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
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p class="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
      </div>
    </div>

    <!-- Transaction Table -->
    <div v-else class="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
      <div class="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
        <h3 class="text-lg font-bold text-gray-800">
          📋 ประวัติการสั่งซื้อ ({{ filteredTransactions.length }} รายการ)
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
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                วันที่
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Order No.
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                ประเภท
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                ยอดเงิน
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr 
              v-for="sale in paginatedSales" 
              :key="sale.id"
              class="hover:bg-blue-50/50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ formatThaiDateTime(sale.dateTime) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ sale.orderNo || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5"
                  :class="{
                    'bg-orange-100 text-orange-800 border border-orange-200': sale.type === 'COD',
                    'bg-emerald-100 text-emerald-800 border border-emerald-200': sale.type === 'TRANSFER'
                  }"
                >
                  {{ sale.type || 'N/A' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                ฿{{ formatCurrency(sale.amount) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Enhanced Pagination -->
      <div v-if="totalPages > 1" class="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 font-medium">
            หน้า <span class="font-bold text-blue-600">{{ currentPage }}</span> จาก 
            <span class="font-bold text-gray-900">{{ totalPages }}</span>
          </div>
          <div class="flex gap-2">
            <button 
              @click="prevPage"
              :disabled="currentPage === 1"
              class="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 transition-all"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              ก่อนหน้า
            </button>
            <button 
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 transition-all"
            >
              ถัดไป
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { db } from '../firebase'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { format, subDays, startOfMonth, startOfYear } from 'date-fns'
import { th } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-vue-next'

// Props
const props = defineProps({
  name: {
    type: String,
    required: true
  }
})

// State
const loading = ref(true)
const sales = ref([])
const currentPage = ref(1)
const pageSize = 10
const selectedFilter = ref('all')

// Date Filter Options
const dateFilters = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: '7days', label: '7 วันล่าสุด' },
  { value: 'month', label: 'เดือนนี้' },
  { value: 'year', label: 'ปีนี้' }
]

// Computed
const dateFilterLabel = computed(() => {
  const filter = dateFilters.find(f => f.value === selectedFilter.value)
  return filter ? filter.label : 'ทั้งหมด'
})

const filteredTransactions = computed(() => {
  if (selectedFilter.value === 'all') {
    return sales.value
  }

  const now = new Date()
  let cutoffDate

  switch (selectedFilter.value) {
    case '7days':
      cutoffDate = subDays(now, 7)
      break
    case 'month':
      cutoffDate = startOfMonth(now)
      break
    case 'year':
      cutoffDate = startOfYear(now)
      break
    default:
      return sales.value
  }

  return sales.value.filter(sale => {
    const saleDate = sale.dateTime?.toDate ? sale.dateTime.toDate() : new Date(sale.dateTime)
    return saleDate >= cutoffDate
  })
})

const totalSpent = computed(() => {
  return filteredTransactions.value.reduce((sum, sale) => {
    const val = parseFloat(sale.amount)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)
})

const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / pageSize)
})

const paginatedSales = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredTransactions.value.slice(start, end)
})

// Methods
const fetchCustomerSales = async () => {
  loading.value = true
  try {
    const salesRef = collection(db, 'sales')
    const q = query(
      salesRef,
      where('customerName', '==', props.name),
      orderBy('dateTime', 'desc')
    )
    
    const snapshot = await getDocs(q)
    sales.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching customer sales:', error)
  } finally {
    loading.value = false
  }
}

const formatThaiDateTime = (dateField) => {
  if (!dateField) return '-'
  const date = dateField.toDate ? dateField.toDate() : new Date(dateField)
  const dayMonth = format(date, 'd MMM', { locale: th })
  const yearBE = date.getFullYear() + 543
  const yearShort = String(yearBE).slice(-2)
  const time = format(date, 'HH:mm', { locale: th })
  return `${dayMonth} ${yearShort} ${time} น.`
}

const formatCurrency = (amount) => {
  const val = parseFloat(amount)
  return new Intl.NumberFormat('th-TH').format(isNaN(val) ? 0 : val)
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// Watchers
watch(() => props.name, () => {
  currentPage.value = 1 // Reset to first page
  fetchCustomerSales()
})

// Lifecycle
onMounted(() => {
  fetchCustomerSales()
})
</script>
