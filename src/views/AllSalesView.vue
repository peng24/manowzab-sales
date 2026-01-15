<template>
  <div class="container mx-auto max-w-7xl px-4 py-8">
    
    <!-- 1. Header & Controls -->
    <div class="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div class="flex items-center gap-4">
        <!-- Back Button -->
        <button 
          @click="router.push('/')"
          class="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft class="h-5 w-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-800">ประวัติยอดขายทั้งหมด</h1>
          <p class="text-gray-500">จัดการรายการขายและตรวจสอบย้อนหลัง</p>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center w-full md:w-auto">
        
        <!-- Search -->
        <div class="relative w-full sm:w-64">
           <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
            </svg>
          </div>
          <input 
            type="text" 
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="ค้นหา Order No, ชื่อลูกค้า..."
            class="block w-full rounded-lg border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
          >
        </div>

        <!-- Date Filter -->
        <div class="flex items-center gap-2">
          <select 
            v-model="selectedMonth" 
            @change="resetAndFetch"
            class="rounded-lg border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option v-for="(name, index) in monthNames" :key="index" :value="index">
              {{ name }}
            </option>
          </select>
          <select 
            v-model="selectedYear" 
            @change="resetAndFetch"
            class="rounded-lg border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option v-for="year in yearRange" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>

      </div>
    </div>

    <!-- 2. Sales Table -->
    <div class="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">วันที่</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Order No.</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">ชื่อลูกค้า</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">ยอดเงิน</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">ประเภท</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading && sales.length === 0">
                <td colspan="6" class="px-6 py-10 text-center text-gray-500">กำลังโหลดข้อมูล...</td>
            </tr>
            <tr v-else-if="sales.length === 0">
                <td colspan="6" class="px-6 py-10 text-center text-gray-500">ไม่พบรายการขายในเดือนนี้</td>
            </tr>
            <tr v-for="sale in sales" :key="sale.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(sale.dateTime) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                 {{ sale.orderNo || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <router-link 
                  v-if="sale.customerName" 
                  :to="{ name: 'CustomerDetail', params: { name: sale.customerName } }"
                  class="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  {{ sale.customerName }}
                </router-link>
                <span v-else class="text-gray-600">ไม่ระบุ</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                ฿{{ formatCurrency(sale.amount) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="{
                    'bg-blue-100 text-blue-800': sale.type === 'COD',
                    'bg-green-100 text-green-800': sale.type !== 'COD'
                  }"
                >
                  {{ sale.type === 'COD' ? 'COD' : 'โอนเงิน' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="openEditModal(sale)" class="text-indigo-600 hover:text-indigo-900 mr-4">แก้ไข</button>
                <button @click="deleteSale(sale)" class="text-red-600 hover:text-red-900">ลบ</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Load More -->
      <div v-if="hasMore && !searchQuery && !loading" class="bg-gray-50 px-6 py-4 text-center border-t border-gray-200">
        <button 
          @click="loadMore"
          class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          โหลดเพิ่มเติม...
        </button>
      </div>
       <div v-if="loading && sales.length > 0" class="bg-gray-50 px-6 py-4 text-center border-t border-gray-200">
        <span class="text-sm text-gray-500">กำลังโหลด...</span>
      </div>
    </div>

    <!-- 3. Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="closeModal"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
             <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">แก้ไขรายการขาย</h3>
             <div class="space-y-4">
                <div>
                   <label class="block text-sm font-medium text-gray-700">วันที่</label>
                   <input type="date" v-model="editForm.date" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
                 <div>
                   <label class="block text-sm font-medium text-gray-700">เวลา</label>
                   <input type="time" v-model="editForm.time" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
                <div>
                   <label class="block text-sm font-medium text-gray-700">ชื่อลูกค้า</label>
                   <input type="text" v-model="editForm.customerName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
                <div>
                   <label class="block text-sm font-medium text-gray-700">ยอดเงิน</label>
                   <input type="number" v-model.number="editForm.amount" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
             </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button @click="saveEdit" type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">บันทึก</button>
            <button @click="closeModal" type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">ยกเลิก</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
// Icons
import { Wallet, ShoppingBag, ArrowRightLeft, Truck, ArrowLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
import { ref, computed, onMounted, watch } from 'vue'
import { db } from '../firebase'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  startAfter, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore'
import Swal from 'sweetalert2'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { th } from 'date-fns/locale'

// --- State ---
const loading = ref(false)
const sales = ref([])
const lastVisible = ref(null)
const hasMore = ref(true)

// Filters
const currentDate = new Date()
const selectedMonth = ref(currentDate.getMonth())
const selectedYear = ref(currentDate.getFullYear())
const searchQuery = ref('')
const searchTimeout = ref(null)

// Edit Modal
const showModal = ref(false)
const editingId = ref(null)
const editForm = ref({
    date: '',
    time: '',
    customerName: '',
    amount: 0
})

// Constants
const monthNames = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
]
const yearRange = computed(() => {
  const current = new Date().getFullYear()
  const years = []
  for (let i = current - 2; i <= current + 1; i++) {
    years.push(i)
  }
  return years
})

// --- Logic ---

const resetAndFetch = () => {
    sales.value = []
    lastVisible.value = null
    hasMore.value = true
    fetchSales()
}

const handleSearch = () => {
    // Debounce search
    if (searchTimeout.value) clearTimeout(searchTimeout.value)
    
    // When searching, we reset list
    sales.value = []
    lastVisible.value = null
    
    searchTimeout.value = setTimeout(() => {
        fetchSales()
    }, 500)
}

const fetchSales = async () => {
    loading.value = true
    try {
        const start = startOfMonth(new Date(selectedYear.value, selectedMonth.value))
        const end = endOfMonth(new Date(selectedYear.value, selectedMonth.value))
        const salesRef = collection(db, 'sales')

        let q

        // Condition 1: Searching (Scope by Month + Filter Client Side)
        // Note: For best UX/Perf balance in this constrained request, we fetch ALL/MORE items for the month if searching
        // to ensure we find the match, OR we rely on standard pagination and filter only what's loaded.
        // User Requirement: "Scope by Month".
        if (searchQuery.value) {
            // High limit for search to simplify "scoping"
            q = query(
                salesRef, 
                where('dateTime', '>=', start),
                where('dateTime', '<=', end),
                orderBy('dateTime', 'desc'),
                limit(500) // Assumption: Monthly sales < 500 for search context, or robust enough
            )
        } 
        // Condition 2: Pagination (Load More)
        else {
             let constraints = [
                where('dateTime', '>=', start),
                where('dateTime', '<=', end),
                orderBy('dateTime', 'desc'),
                limit(20)
             ]
             
             if (lastVisible.value) {
                 constraints.push(startAfter(lastVisible.value))
             }
             
             q = query(salesRef, ...constraints)
        }

        const snapshot = await getDocs(q)
        
        if (snapshot.empty) {
            hasMore.value = false
            loading.value = false
            return
        }

        // Check if less than limit returned (for Pagination)
        if (!searchQuery.value && snapshot.docs.length < 20) {
            hasMore.value = false
        }
        
        lastVisible.value = snapshot.docs[snapshot.docs.length - 1]

        const newItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        // Client-Side Search Filter (if search is active)
        if (searchQuery.value) {
            const queryText = searchQuery.value.toLowerCase()
            const filtered = newItems.filter(item => {
                const orderNo = (item.orderNo || '').toLowerCase()
                const name = (item.customerName || '').toLowerCase()
                return orderNo.includes(queryText) || name.includes(queryText)
            })
            // Replace entire list because search implies non-paginated view of matches
            sales.value = filtered
            // Search mode disables "Load More" to simplify logic
        } else {
            // Append for pagination
            sales.value.push(...newItems)
        }

    } catch (error) {
        console.error("Error fetching sales:", error)
        Swal.fire('Error', error.message, 'error')
    } finally {
        loading.value = false
    }
}

const loadMore = () => {
    if (!hasMore.value || loading.value) return
    fetchSales()
}

// --- CRUD ---

const deleteSale = async (item) => {
    const result = await Swal.fire({
        title: 'ยืนยันการลบ?',
        text: `ต้องการลบรายการ ${item.orderNo || ''} นี้หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก'
    })

    if (result.isConfirmed) {
        try {
            await deleteDoc(doc(db, 'sales', item.id))
            // Remove from local list
            sales.value = sales.value.filter(s => s.id !== item.id)
            Swal.fire('Deleted!', 'ลบรายการสำเร็จ', 'success')
        } catch (error) {
            Swal.fire('Error', error.message, 'error')
        }
    }
}

const openEditModal = (item) => {
    editingId.value = item.id
    
    // Parse Date Time
    let d = new Date()
    if (item.dateTime && item.dateTime.toDate) {
        d = item.dateTime.toDate()
    } else if (item.date) {
        d = new Date(item.date)
    }

    editForm.value = {
        date: format(d, 'yyyy-MM-dd'),
        time: format(d, 'HH:mm'),
        customerName: item.customerName || '',
        amount: item.amount || 0
    }
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
    editingId.value = null
}

const saveEdit = async () => {
    try {
        const dateObj = new Date(`${editForm.value.date}T${editForm.value.time}`)
        
        const updateData = {
            dateTime: dateObj,
            // also update legacy date string if needed, or just rely on dateTime
            date: dateObj, // Keep both synced
            customerName: editForm.value.customerName,
            amount: Number(editForm.value.amount)
        }

        await updateDoc(doc(db, 'sales', editingId.value), updateData)
        
        // Update Local
        const index = sales.value.findIndex(s => s.id === editingId.value)
        if (index !== -1) {
            sales.value[index] = { ...sales.value[index], ...updateData }
        }

        Swal.fire({
            icon: 'success',
            title: 'บันทึกสำเร็จ',
            timer: 1500,
            showConfirmButton: false
        })
        closeModal()

    } catch (error) {
        console.error("Update error:", error)
        Swal.fire('Error', 'บันทึกไม่สำเร็จ', 'error')
    }
}

// --- Utils ---
const formatDate = (dateField) => {
  if (!dateField) return '-'
  try {
      const d = dateField.toDate ? dateField.toDate() : new Date(dateField)
      const yearBE = d.getFullYear() + 543
      return format(d, `d MMM ${String(yearBE).slice(-2)} HH:mm`, { locale: th })
  } catch (e) { return '-' }
}

const formatCurrency = (val) => new Intl.NumberFormat('th-TH').format(val || 0)

// Init
onMounted(() => {
    fetchSales()
})

</script>
