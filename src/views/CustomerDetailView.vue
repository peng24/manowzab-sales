<template>
  <div class="container mx-auto max-w-6xl px-4 py-8">
    <!-- Back Button + Header -->
    <div class="mb-8">
      <button 
        @click="$router.back()" 
        class="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium">ย้อนกลับ</span>
      </button>

      <div class="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 md:p-8 shadow-sm">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-sm font-medium text-blue-600 mb-2">ข้อมูลลูกค้า</p>
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900">{{ name }}</h1>
          </div>
          <div class="text-left md:text-right">
            <p class="text-sm font-medium text-gray-600 mb-1">ยอดซื้อรวมทั้งหมด</p>
            <h2 class="text-3xl md:text-4xl font-bold text-green-600">
              ฿{{ formatCurrency(totalSpent) }}
            </h2>
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
    <div v-else class="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <h3 class="text-lg font-bold text-gray-800">
          ประวัติการสั่งซื้อ ({{ sales.length }} รายการ)
        </h3>
      </div>
      
      <div v-if="sales.length === 0" class="px-6 py-12 text-center">
        <p class="text-gray-500">ยังไม่มีรายการสั่งซื้อ</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                วันที่
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order No.
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ประเภท
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ยอดเงิน
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr 
              v-for="sale in paginatedSales" 
              :key="sale.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ formatThaiDateTime(sale.dateTime) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ sale.orderNo || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
                  :class="{
                    'bg-orange-100 text-orange-800': sale.type === 'COD',
                    'bg-emerald-100 text-emerald-800': sale.type === 'TRANSFER'
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

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            หน้า <span class="font-medium">{{ currentPage }}</span> จาก 
            <span class="font-medium">{{ totalPages }}</span>
          </div>
          <div class="flex gap-2">
            <button 
              @click="prevPage"
              :disabled="currentPage === 1"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              ก่อนหน้า
            </button>
            <button 
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '../firebase'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

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

// Computed
const totalSpent = computed(() => {
  return sales.value.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0)
})

const totalPages = computed(() => {
  return Math.ceil(sales.value.length / pageSize)
})

const paginatedSales = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return sales.value.slice(start, end)
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
  return new Intl.NumberFormat('th-TH').format(amount || 0)
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

// Lifecycle
onMounted(() => {
  fetchCustomerSales()
})
</script>
