<template>
  <div class="container mx-auto max-w-5xl px-4 py-8">
    <h1 class="mb-8 text-2xl font-bold text-gray-800">บันทึกยอดโอน (Transfer)</h1>

    <!-- Section 1: Input Form -->
    <div class="mb-10 rounded-xl bg-white p-6 shadow-md border border-gray-100">
      <h2 class="mb-6 text-lg font-semibold text-gray-700 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
        </svg>
        เพิ่มรายการใหม่
      </h2>
      
      <form @submit.prevent="saveTransfer" class="grid gap-6 grid-cols-1 md:grid-cols-2">
        <!-- Date & Time (Thai Format Overlay) -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">วันที่</label>
          <div class="relative">
            <!-- Hidden Native Input -->
            <input 
              type="date" 
              v-model="formData.date"
              required
              class="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-10"
              @click="$event.target.showPicker ? $event.target.showPicker() : null"
            >
            <!-- Custom Display -->
            <div class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 flex items-center justify-between">
              <span class="text-gray-900">{{ formatThaiDateDisplay(formData.date) }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">เวลา</label>
          <div class="relative">
             <!-- Hidden Native Input -->
            <input 
              type="time" 
              v-model="formData.time"
              required
              class="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-10"
              @click="$event.target.showPicker ? $event.target.showPicker() : null"
            >
            <!-- Custom Display -->
             <div class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 flex items-center justify-between">
              <span class="text-gray-900">{{ formData.time }} น.</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Order (Auto-Generated) -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">
            เลขออเดอร์ <span class="text-xs text-gray-400 font-normal">(Auto)</span>
          </label>
          <input 
            type="text" 
            v-model="formData.orderNo"
            readonly
            class="w-full rounded-lg border-gray-200 bg-gray-50 text-gray-500 shadow-sm focus:border-blue-500 focus:ring-blue-500 cursor-not-allowed"
          >
        </div>

        <!-- Customer Name (Autocomplete) -->
        <div class="space-y-1 relative" ref="customerInputRef">
          <label class="block text-sm font-medium text-gray-700">ชื่อลูกค้า</label>
          <input 
            type="text" 
            v-model="formData.customerName"
            @focus="showCustomerSuggestions = true"
            @input="filterCustomers"
            placeholder="พิมพ์เพื่อค้นหา หรือระบุใหม่"
            required
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            autocomplete="off"
          >
          <!-- Suggestions Dropdown -->
          <ul 
            v-if="showCustomerSuggestions && filteredCustomers.length > 0"
            class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
          >
            <li 
              v-for="customer in filteredCustomers" 
              :key="customer.id"
              @click="selectCustomer(customer.name)"
              class="relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-blue-50 transition-colors"
            >
              <div class="flex items-center">
                 <span class="font-normal block truncate">{{ customer.name }}</span>
                 <span v-if="customer.phoneNumber" class="ml-2 text-xs text-gray-400">({{ customer.phoneNumber }})</span>
              </div>
            </li>
          </ul>
        </div>

        <!-- Amount -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">ยอดโอน (บาท)</label>
          <div class="relative rounded-md shadow-sm">
            <input 
              type="number" 
              v-model.number="formData.amount"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
              class="block w-full rounded-lg border-gray-300 pl-4 pr-12 focus:border-blue-500 focus:ring-blue-500"
            >
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span class="text-gray-500 sm:text-sm">฿</span>
            </div>
          </div>
        </div>

        <!-- Slip URL -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">ลิงก์สลิป (URL)</label>
          <input 
            type="url" 
            v-model="formData.slipUrl"
            placeholder="https://..."
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
        </div>

        <!-- Submit Button -->
        <div class="md:col-span-2 lg:col-span-3">
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="isSubmitting" class="flex items-center justify-center">
              <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังบันทึก...
            </span>
            <span v-else>บันทึกข้อมูลการโอน</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Section 2: Recent Transactions Table -->
    <div class="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
      <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <h3 class="text-lg font-medium text-gray-900">รายการยอดโอนล่าสุด (10 รายการ)</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วัน-เวลา</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order No.</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลูกค้า</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดเงิน</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หลักฐาน</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading" class="text-center">
              <td colspan="5" class="py-10 text-gray-500">กำลังโหลดข้อมูล...</td>
            </tr>
            <tr v-else-if="requests.length === 0" class="text-center">
              <td colspan="5" class="py-10 text-gray-500">ไม่พบรายการโอนล่าสุด</td>
            </tr>
            <tr v-for="req in requests" :key="req.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatThaiDateTime(req.dateTime) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ req.orderNo }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <router-link 
                  v-if="req.customerName" 
                  :to="{ name: 'CustomerDetail', params: { name: req.customerName } }"
                  class="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  {{ req.customerName }}
                </router-link>
                <span v-else class="text-gray-600">ไม่ระบุ</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-green-600">
                ฿{{ formatCurrency(req.amount) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <a 
                  v-if="req.slipUrl" 
                  :href="req.slipUrl" 
                  target="_blank" 
                  class="inline-flex items-center text-blue-600 hover:text-blue-900 underline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  ดูสลิป
                </a>
                <span v-else class="text-gray-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { db } from '../firebase'
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  getDocs,
  setDoc,
  doc
} from 'firebase/firestore'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import Swal from 'sweetalert2'

// State
const formData = ref({
  date: format(new Date(), 'yyyy-MM-dd'),
  time: format(new Date(), 'HH:mm'),
  orderNo: '',
  customerName: '',
  amount: '',
  slipUrl: ''
})

const isSubmitting = ref(false)
const loading = ref(true)
const requests = ref([])
let unsubscribe = null

// Autocomplete State
const customerOptions = ref([])
const filteredCustomers = ref([])
const showCustomerSuggestions = ref(false)
const customerInputRef = ref(null)

// --- Auto Generate Order No ---
const generateOrderNo = () => {
    const today = new Date()
    const yymmdd = format(today, 'yyMMdd')
    // Random 4 chars (uppercase letters + numbers)
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    formData.value.orderNo = `ORD-${yymmdd}-${randomSuffix}`
}

// --- Customer Autocomplete ---
const fetchCustomers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'customers'))
        customerOptions.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            phoneNumber: doc.data().phoneNumber || ''
        }))
    } catch (error) {
        console.error("Error fetching customers:", error)
    }
}

const filterCustomers = () => {
    const search = formData.value.customerName.toLowerCase()
    if (!search) {
        filteredCustomers.value = []
        return
    }
    filteredCustomers.value = customerOptions.value
        .filter(c => c.name.toLowerCase().includes(search))
        .slice(0, 5) // Limit to 5 suggestions
}

const selectCustomer = (name) => {
    formData.value.customerName = name
    showCustomerSuggestions.value = false
}

// Global Click listener to close suggestions
const handleClickOutside = (e) => {
    if (customerInputRef.value && !customerInputRef.value.contains(e.target)) {
        showCustomerSuggestions.value = false
    }
}

// --- Save Function ---
const saveTransfer = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    // Combine Date and Time
    const dateObj = new Date(`${formData.value.date}T${formData.value.time}`)

    // 1. Save Sales Data
    const payload = {
      type: 'TRANSFER',
      dateTime: dateObj,
      orderNo: formData.value.orderNo,
      customerName: formData.value.customerName,
      amount: Number(formData.value.amount),
      slipUrl: formData.value.slipUrl || null,
      timestamp: serverTimestamp()
    }

    const salesRef = collection(db, 'sales')
    await addDoc(salesRef, payload)

    // 2. Upsert Customer Data
    if (formData.value.customerName) {
        const customerId = formData.value.customerName.trim()
        const customerRef = doc(db, 'customers', customerId)
        await setDoc(customerRef, {
            name: customerId,
            lastUpdate: serverTimestamp()
        }, { merge: true })
    }

    // Reset Form
    formData.value = {
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      orderNo: '',
      customerName: '',
      amount: '',
      slipUrl: ''
    }
    
    // Regenerate Order No for next item
    generateOrderNo()

    Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: 'บันทึกยอดโอนเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
    })

  } catch (error) {
    console.error('Error saving transfer:', error)
    Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message
    })
  } finally {
    isSubmitting.value = false
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

const formatThaiDateDisplay = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const dayMonth = format(date, 'd MMMM', { locale: th }) 
  const yearBE = date.getFullYear() + 543
  return `${dayMonth} ${yearBE}`
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('th-TH').format(amount)
}

// Lifecycle
onMounted(() => {
  generateOrderNo()
  fetchCustomers()
  document.addEventListener('click', handleClickOutside)

  // Real-time listener
  const q = query(
    collection(db, 'sales'),
    where('type', '==', 'TRANSFER'),
    orderBy('dateTime', 'desc'),
    limit(10)
  )

  unsubscribe = onSnapshot(q, (snapshot) => {
    requests.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    loading.value = false
  }, (error) => {
    console.error("Error fetching transfers:", error)
    loading.value = false
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  document.removeEventListener('click', handleClickOutside)
})
</script>
