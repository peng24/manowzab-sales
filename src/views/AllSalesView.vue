<template>
  <div class="container mx-auto max-w-7xl px-4 py-8">
    <!-- 1. Header -->
    <div
      class="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center"
    >
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
    </div>

    <!-- 2. The Super Filter Bar -->
    <div class="mb-6 rounded-xl bg-white shadow-sm border border-gray-200 p-4">
      <div class="flex flex-col gap-4">
        <!-- Filter Mode Dropdown -->
        <div
          class="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
        >
          <label class="text-sm font-medium text-gray-700 sm:w-32"
            >โหมดการกรอง:</label
          >
          <select
            v-model="filterMode"
            @change="onFilterModeChange"
            class="flex-1 rounded-lg border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">ทั้งหมด (All Time)</option>
            <option value="custom">กำหนดช่วงวัน (Custom Range)</option>
            <option value="month">รายเดือน (Specific Month)</option>
            <option value="year">รายปี (Specific Year)</option>
          </select>
        </div>

        <!-- Dynamic Inputs Based on Mode -->
        <div
          class="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
          v-if="filterMode !== 'all'"
        >
          <label class="text-sm font-medium text-gray-700 sm:w-32"
            >ช่วงเวลา:</label
          >

          <!-- Custom Date Range -->
          <div
            v-if="filterMode === 'custom'"
            class="flex-1 flex flex-col sm:flex-row gap-3"
          >
            <div class="flex-1">
              <label class="block text-xs text-gray-500 mb-1"
                >วันที่เริ่มต้น</label
              >
              <input
                type="date"
                v-model="customStartDate"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div class="flex-1">
              <label class="block text-xs text-gray-500 mb-1"
                >วันที่สิ้นสุด</label
              >
              <input
                type="date"
                v-model="customEndDate"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Month Selector -->
          <div
            v-if="filterMode === 'month'"
            class="flex-1 flex flex-col sm:flex-row gap-3"
          >
            <select
              v-model="selectedMonth"
              class="flex-1 rounded-lg border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option
                v-for="(name, index) in monthNames"
                :key="index"
                :value="index"
              >
                {{ name }}
              </option>
            </select>
            <select
              v-model="selectedYear"
              class="flex-1 rounded-lg border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option v-for="year in yearRange" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>

          <!-- Year Selector -->
          <div v-if="filterMode === 'year'" class="flex-1">
            <select
              v-model="selectedYear"
              class="w-full rounded-lg border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option v-for="year in yearRange" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 justify-end">
          <button
            @click="handleSearch"
            class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
          >
            ค้นหา
          </button>
          <button
            @click="handleReset"
            class="px-6 py-2 bg-gray-500 text-white font-medium rounded-lg shadow-sm hover:bg-gray-600 transition-colors"
          >
            รีเซ็ต
          </button>
        </div>
      </div>
    </div>

    <!-- 3. Summary Section -->
    <div
      v-if="sales.length > 0"
      class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      <!-- Total Sales -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 mb-1">ยอดรวมทั้งหมด</p>
            <p class="text-3xl font-bold text-green-600">
              ฿{{ formatCurrency(totalSales) }}
            </p>
          </div>
          <div
            class="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center"
          >
            <Wallet class="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      <!-- Total Orders -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 mb-1">จำนวนออเดอร์</p>
            <p class="text-3xl font-bold text-gray-700">{{ totalOrders }}</p>
          </div>
          <div
            class="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center"
          >
            <ShoppingBag class="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      <!-- Transfer vs COD -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p class="text-sm font-medium text-gray-500 mb-3">สัดส่วนประเภท</p>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">โอนเงิน:</span>
            <span class="text-sm font-semibold text-green-600"
              >฿{{ formatCurrency(transferAmount) }}</span
            >
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">COD:</span>
            <span class="text-sm font-semibold text-blue-600"
              >฿{{ formatCurrency(codAmount) }}</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Sales Table -->
    <div
      class="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                วันที่
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                Order No.
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                ชื่อลูกค้า
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                ยอดเงิน
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                ประเภท
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-10 text-center text-gray-500">
                กำลังโหลดข้อมูล...
              </td>
            </tr>
            <tr v-else-if="paginatedSales.length === 0">
              <td colspan="6" class="px-6 py-10 text-center text-gray-500">
                ไม่พบรายการขายในช่วงเวลาที่เลือก
              </td>
            </tr>
            <tr
              v-for="sale in paginatedSales"
              :key="sale.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(sale.dateTime) }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
              >
                {{ sale.orderNo || "-" }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <router-link
                  v-if="sale.customerName"
                  :to="{
                    name: 'CustomerDetail',
                    params: { name: sale.customerName },
                  }"
                  class="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  {{ sale.customerName }}
                </router-link>
                <span v-else class="text-gray-600">ไม่ระบุ</span>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900"
              >
                ฿{{ formatCurrency(sale.amount) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="{
                    'bg-blue-100 text-blue-800': sale.type === 'COD',
                    'bg-green-100 text-green-800': sale.type !== 'COD',
                  }"
                >
                  {{ sale.type === "COD" ? "COD" : "โอนเงิน" }}
                </span>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <button
                  @click="openEditModal(sale)"
                  class="text-indigo-600 hover:text-indigo-900 mr-4"
                >
                  แก้ไข
                </button>
                <button
                  @click="deleteSale(sale)"
                  class="text-red-600 hover:text-red-900"
                >
                  ลบ
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div
        v-if="sales.length > 0"
        class="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200"
      >
        <div class="text-sm text-gray-700">
          แสดง {{ startIndex + 1 }}-{{ endIndex }} จาก {{ sales.length }} รายการ
        </div>
        <div class="flex gap-2">
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ก่อนหน้า
          </button>
          <div class="px-4 py-2 text-sm font-medium text-gray-700">
            หน้า {{ currentPage }} / {{ totalPages }}
          </div>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>

    <!-- 5. Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
      >
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          @click="closeModal"
        ></div>
        <span
          class="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
          >&#8203;</span
        >

        <div
          class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        >
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3
              class="text-lg leading-6 font-medium text-gray-900 mb-4"
              id="modal-title"
            >
              แก้ไขรายการขาย
            </h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700"
                  >วันที่</label
                >
                <input
                  type="date"
                  v-model="editForm.date"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700"
                  >เวลา</label
                >
                <input
                  type="time"
                  v-model="editForm.time"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700"
                  >ชื่อลูกค้า</label
                >
                <input
                  type="text"
                  v-model="editForm.customerName"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700"
                  >ยอดเงิน</label
                >
                <input
                  type="number"
                  v-model.number="editForm.amount"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              @click="saveEdit"
              type="button"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
            >
              บันทึก
            </button>
            <button
              @click="closeModal"
              type="button"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
// Icons
import { Wallet, ShoppingBag, ArrowLeft } from "lucide-vue-next";
import { useRouter } from "vue-router";

const router = useRouter();
import { ref, computed, onMounted } from "vue";
import Swal from "sweetalert2";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// Services
import {
  getAllSales,
  updateSale,
  deleteSale as deleteSaleService,
} from "../services/salesService.js";

// --- State ---
const loading = ref(false);
const sales = ref([]);

// Filter State
const filterMode = ref("month"); // 'custom', 'month', 'year', 'all'
const customStartDate = ref("");
const customEndDate = ref("");
const currentDate = new Date();
const selectedMonth = ref(currentDate.getMonth());
const selectedYear = ref(currentDate.getFullYear());

// Pagination State
const currentPage = ref(1);
const itemsPerPage = 20;

// Edit Modal
const showModal = ref(false);
const editingId = ref(null);
const editForm = ref({
  date: "",
  time: "",
  customerName: "",
  amount: 0,
});

// Constants
const monthNames = [
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
const yearRange = computed(() => {
  const current = new Date().getFullYear();
  const years = [];
  for (let i = current - 5; i <= current + 1; i++) {
    years.push(i);
  }
  return years;
});

// --- Computed Properties ---

// Summary Statistics
const totalSales = computed(() => {
  return sales.value.reduce((sum, sale) => sum + (sale.amount || 0), 0);
});

const totalOrders = computed(() => sales.value.length);

const transferAmount = computed(() => {
  return sales.value
    .filter((sale) => sale.type !== "COD")
    .reduce((sum, sale) => sum + (sale.amount || 0), 0);
});

const codAmount = computed(() => {
  return sales.value
    .filter((sale) => sale.type === "COD")
    .reduce((sum, sale) => sum + (sale.amount || 0), 0);
});

// Pagination
const totalPages = computed(
  () => Math.ceil(sales.value.length / itemsPerPage) || 1,
);

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);

const endIndex = computed(() => {
  const end = startIndex.value + itemsPerPage;
  return end > sales.value.length ? sales.value.length : end;
});

const paginatedSales = computed(() => {
  return sales.value.slice(startIndex.value, endIndex.value);
});

// --- Methods ---

const onFilterModeChange = () => {
  // Reset page when changing filter mode
  currentPage.value = 1;
};

const handleSearch = async () => {
  currentPage.value = 1;
  await fetchSales();
};

const handleReset = () => {
  filterMode.value = "month";
  const now = new Date();
  selectedMonth.value = now.getMonth();
  selectedYear.value = now.getFullYear();
  customStartDate.value = "";
  customEndDate.value = "";
  currentPage.value = 1;
  fetchSales();
};

const fetchSales = async () => {
  loading.value = true;
  sales.value = [];

  try {
    if (filterMode.value === "custom") {
      // Validate custom dates
      if (!customStartDate.value || !customEndDate.value) {
        Swal.fire({
          icon: "warning",
          title: "กรุณาเลือกวันที่",
          text: "กรุณาระบุวันที่เริ่มต้นและสิ้นสุด",
        });
        loading.value = false;
        return;
      }
    }

    // Use the service to fetch sales
    sales.value = await getAllSales({
      mode: filterMode.value,
      startDate: customStartDate.value ? new Date(customStartDate.value) : null,
      endDate: customEndDate.value ? new Date(customEndDate.value) : null,
      month: selectedMonth.value,
      year: selectedYear.value,
      limitCount: 200,
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    Swal.fire("Error", error.message, "error");
  } finally {
    loading.value = false;
  }
};

// Pagination Controls
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

// --- CRUD ---

const deleteSale = async (item) => {
  const result = await Swal.fire({
    title: "ยืนยันการลบ?",
    text: `ต้องการลบรายการ ${item.orderNo || ""} นี้หรือไม่?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "ลบ",
    cancelButtonText: "ยกเลิก",
  });

  if (result.isConfirmed) {
    try {
      await deleteSaleService(item.id);
      // Remove from local list
      sales.value = sales.value.filter((s) => s.id !== item.id);
      Swal.fire("Deleted!", "ลบรายการสำเร็จ", "success");
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  }
};

const openEditModal = (item) => {
  editingId.value = item.id;

  // Parse Date Time
  let d = new Date();
  if (item.dateTime && item.dateTime.toDate) {
    d = item.dateTime.toDate();
  } else if (item.date) {
    d = new Date(item.date);
  }

  editForm.value = {
    date: format(d, "yyyy-MM-dd"),
    time: format(d, "HH:mm"),
    customerName: item.customerName || "",
    amount: item.amount || 0,
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingId.value = null;
};

const saveEdit = async () => {
  try {
    const dateObj = new Date(`${editForm.value.date}T${editForm.value.time}`);

    const updateData = {
      dateTime: dateObj,
      date: dateObj,
      customerName: editForm.value.customerName,
      amount: Number(editForm.value.amount),
    };

    await updateSale(editingId.value, updateData);

    // Update Local
    const index = sales.value.findIndex((s) => s.id === editingId.value);
    if (index !== -1) {
      sales.value[index] = { ...sales.value[index], ...updateData };
    }

    Swal.fire({
      icon: "success",
      title: "บันทึกสำเร็จ",
      timer: 1500,
      showConfirmButton: false,
    });
    closeModal();
  } catch (error) {
    console.error("Update error:", error);
    Swal.fire("Error", "บันทึกไม่สำเร็จ", "error");
  }
};

// --- Utils ---
const formatDate = (dateField) => {
  if (!dateField) return "-";
  try {
    const d = dateField.toDate ? dateField.toDate() : new Date(dateField);
    const yearBE = d.getFullYear() + 543;
    return format(d, `d MMM ${String(yearBE).slice(-2)} HH:mm`, { locale: th });
  } catch (e) {
    return "-";
  }
};

const formatCurrency = (val) => new Intl.NumberFormat("th-TH").format(val || 0);

// Init
onMounted(() => {
  fetchSales();
});
</script>
