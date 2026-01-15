<template>
  <div class="container mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">ข้อมูลลูกค้า (Customers)</h1>
        <p class="text-gray-500">จัดการรายชื่อลูกค้า เบอร์โทร และที่อยู่จัดส่ง</p>
      </div>
      <button 
        @click="openModal()"
        class="flex items-center rounded-lg bg-blue-600 px-4 py-2 font-bold text-white shadow-md hover:bg-blue-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        เพิ่มลูกค้าใหม่
      </button>
    </div>

    <!-- Search & Filter -->
    <div class="mb-6 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      <div class="relative max-w-md">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
          </svg>
        </div>
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="ค้นหาชื่อลูกค้า หรือเบอร์โทร..."
          class="block w-full rounded-lg border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500"
        >
      </div>
    </div>

    <!-- Customer Table -->
    <div class="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อลูกค้า</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เบอร์โทรศัพท์</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ที่อยู่จัดส่ง</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หมายเหตุ</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading">
                <td colspan="5" class="px-6 py-10 text-center text-gray-500">กำลังโหลดข้อมูล...</td>
            </tr>
            <tr v-else-if="filteredCustomers.length === 0">
                <td colspan="5" class="px-6 py-10 text-center text-gray-500">ไม่พบข้อมูลลูกค้า</td>
            </tr>
            <tr v-for="customer in filteredCustomers" :key="customer.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {{ customer.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ customer.name }}</div>
                    <div class="text-xs text-gray-400">อัปเดต: {{ formatDate(customer.lastUpdate) }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ customer.phoneNumber || '-' }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" :title="customer.address">
                {{ customer.address || '-' }}
              </td>
               <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                {{ customer.note || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  @click="openModal(customer)"
                  class="text-blue-600 hover:text-blue-900 mr-4"
                >
                  แก้ไข
                </button>
                <button 
                  @click="deleteCustomer(customer)"
                  class="text-red-600 hover:text-red-900"
                >
                  ลบ
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="closeModal"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <!-- Panel -->
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {{ isEditing ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่' }}
                </h3>
                <div class="mt-4 space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">ชื่อลูกค้า <span class="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        v-model="formData.name" 
                        :disabled="isEditing"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                        placeholder="ระบุชื่อลูกค้า (Unique)"
                    >
                    <p v-if="isEditing" class="text-xs text-gray-400 mt-1">ชื่อลูกค้าไม่สามารถแก้ไขได้ (ใช้เป็น ID)</p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                    <input 
                        type="tel" 
                        v-model="formData.phoneNumber"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="08x-xxx-xxxx"
                    >
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700">ที่อยู่จัดส่ง</label>
                    <textarea 
                        v-model="formData.address"
                        rows="3"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="บ้านเลขที่, ถนน, แขวง/เขต..."
                    ></textarea>
                  </div>

                   <div>
                    <label class="block text-sm font-medium text-gray-700">หมายเหตุ</label>
                    <input 
                        type="text" 
                        v-model="formData.note"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Note เพิ่มเติม"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
                @click="saveCustomer" 
                type="button" 
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              บันทึก
            </button>
            <button 
                @click="closeModal" 
                type="button" 
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore'
import Swal from 'sweetalert2'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

// --- State ---
const customers = ref([])
const loading = ref(true)
const searchQuery = ref('')
const showModal = ref(false)
const isEditing = ref(false)
let unsubscribe = null

const formData = ref({
    name: '',
    phoneNumber: '',
    address: '',
    note: ''
})

// --- Computed ---
const filteredCustomers = computed(() => {
    if (!searchQuery.value) return customers.value
    const lowerQuery = searchQuery.value.toLowerCase()
    return customers.value.filter(c => 
        c.name.toLowerCase().includes(lowerQuery) || 
        (c.phoneNumber && c.phoneNumber.includes(lowerQuery))
    )
})

// --- Fetch Data ---
onMounted(() => {
    const q = collection(db, 'customers')
    unsubscribe = onSnapshot(q, (snapshot) => {
        customers.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
        loading.value = false
    }, (error) => {
        console.error("Error fetching customers:", error)
        loading.value = false
    })
})

onUnmounted(() => {
    if (unsubscribe) unsubscribe()
})

// --- Actions ---

const openModal = (customer = null) => {
    if (customer) {
        // Edit Mode
        isEditing.value = true
        formData.value = {
            name: customer.id, // ID is Name
            phoneNumber: customer.phoneNumber || '',
            address: customer.address || '',
            note: customer.note || ''
        }
    } else {
        // Add Mode
        isEditing.value = false
        formData.value = {
            name: '',
            phoneNumber: '',
            address: '',
            note: ''
        }
    }
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
}

const saveCustomer = async () => {
    if (!formData.value.name.trim()) {
        Swal.fire({ icon: 'warning', title: 'กรุณาระบุชื่อลูกค้า' })
        return
    }

    try {
        const customerId = formData.value.name.trim()
        const customerRef = doc(db, 'customers', customerId)
        
        const payload = {
            name: customerId,
            phoneNumber: formData.value.phoneNumber || '',
            address: formData.value.address || '',
            note: formData.value.note || '',
            lastUpdate: serverTimestamp()
        }

        if (isEditing.value) {
            // Update
            // Don't update name (ID)
            const { name, ...updateData } = payload
            await updateDoc(customerRef, updateData)
            Swal.fire({ icon: 'success', title: 'แก้ไขข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false })
        } else {
            // Add new
            // Check if exists
            const docSnap = await getDoc(customerRef)
            if (docSnap.exists()) {
                Swal.fire({ icon: 'error', title: 'ลูกค้าชื่อนี้มีอยู่แล้ว', text: 'กรุณาใช้ชื่ออื่น' })
                return
            }
            await setDoc(customerRef, payload)
            Swal.fire({ icon: 'success', title: 'เพิ่มลูกค้าสำเร็จ', timer: 1500, showConfirmButton: false })
        }
        
        closeModal()

    } catch (error) {
        console.error("Error saving customer:", error)
        Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: error.message })
    }
}

const deleteCustomer = async (customer) => {
    const result = await Swal.fire({
        title: 'ยืนยันการลบ?',
        text: `ต้องการลบข้อมูลลูกค้า "${customer.name}" หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ลบข้อมูล',
        cancelButtonText: 'ยกเลิก'
    })

    if (result.isConfirmed) {
        try {
            await deleteDoc(doc(db, 'customers', customer.id))
            Swal.fire('ลบสำเร็จ!', 'ข้อมูลลูกค้าถูกลบแล้ว', 'success')
        } catch (error) {
            console.error("Error deleting customer:", error)
            Swal.fire('Error', 'ลบข้อมูลไม่สำเร็จ', 'error')
        }
    }
}

// --- Utils ---
const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const yearBE = date.getFullYear() + 543
    return format(date, `d MMM ${String(yearBE).slice(-2)} HH:mm`, { locale: th })
}
</script>
