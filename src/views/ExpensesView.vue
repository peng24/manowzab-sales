<template>
  <div class="container mx-auto max-w-6xl px-4 py-8">
    <!-- Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <component :is="Receipt" class="h-7 w-7 text-rose-500" />
          บันทึกรายจ่าย (Expenses)
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          บันทึกและติดตามรายจ่ายแยกตามหมวดหมู่ เพื่อการบริหารต้นทุนที่แม่นยำ
        </p>
      </div>

      <button
        @click="showCategoryModal = true"
        class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <component :is="FolderPlus" class="mr-2 h-4 w-4 text-purple-600" />
        จัดการหมวดหมู่รายจ่าย
      </button>
    </div>

    <!-- Section 1: Form Add/Edit Expense -->
    <div class="mb-8 rounded-xl bg-white p-6 shadow-md border border-gray-100">
      <h2 class="mb-6 text-lg font-semibold text-gray-700 flex items-center justify-between">
        <span class="flex items-center">
          <component :is="isEditing ? Edit3 : PlusCircle" class="h-5 w-5 mr-2 text-rose-500" />
          {{ isEditing ? "แก้ไขรายการรายจ่าย" : "บันทึกรายจ่ายใหม่" }}
        </span>
        <button
          v-if="isEditing"
          @click="resetForm"
          class="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          ยกเลิกการแก้ไข
        </button>
      </h2>

      <form @submit.prevent="handleSaveExpense" class="grid gap-6 grid-cols-1 md:grid-cols-3">
        <!-- Date -->
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
            />
            <!-- Custom Thai Display -->
            <div
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm flex items-center justify-between font-medium text-gray-900 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500"
            >
              <span>{{ formatThaiDateDisplay(formData.date) }}</span>
              <component :is="Calendar" class="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <!-- Category -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">หมวดหมู่รายจ่าย</label>
          <select
            v-model="formData.category"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            <option value="" disabled>-- เลือกหมวดหมู่ --</option>
            <option
              v-for="cat in expenseStore.categories"
              :key="cat.id"
              :value="cat.name"
            >
              {{ cat.name }}
            </option>
          </select>
        </div>

        <!-- Amount -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">จำนวนเงิน (บาท)</label>
          <div class="relative">
            <input
              type="number"
              step="0.01"
              min="0.01"
              v-model.number="formData.amount"
              placeholder="0.00"
              required
              class="w-full rounded-lg border border-gray-300 pl-3 pr-8 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
            />
            <span class="absolute right-3 top-2 text-sm text-gray-400">฿</span>
          </div>
        </div>

        <!-- Title / Description -->
        <div class="space-y-1 md:col-span-2">
          <label class="block text-sm font-medium text-gray-700">รายละเอียด / ชื่อรายการ</label>
          <input
            type="text"
            v-model="formData.title"
            placeholder="เช่น ค่าโฆษณา Facebook, ซื้อกล่องพัสดุ 100 ใบ"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <!-- Payment Method -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">ช่องทางการชำระ</label>
          <select
            v-model="formData.paymentMethod"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            <option value="Transfer">โอนเงิน (Transfer)</option>
            <option value="Cash">เงินสด (Cash)</option>
            <option value="CreditCard">บัตรเครดิต (Credit Card)</option>
            <option value="Other">อื่นๆ</option>
          </select>
        </div>

        <!-- Note -->
        <div class="space-y-1 md:col-span-3">
          <label class="block text-sm font-medium text-gray-700">หมายเหตุ (ถ้ามี)</label>
          <input
            type="text"
            v-model="formData.note"
            placeholder="หมายเหตุเพิ่มเติม..."
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <!-- Submit Button -->
        <div class="md:col-span-3 flex justify-end gap-3 mt-2">
          <button
            v-if="isEditing"
            type="button"
            @click="resetForm"
            class="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="inline-flex items-center justify-center rounded-lg bg-rose-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-sm"
          >
            <component
              :is="submitting ? Loader2 : (isEditing ? CheckCircle : Save)"
              class="mr-2 h-4 w-4"
              :class="{ 'animate-spin': submitting }"
            />
            {{ isEditing ? "บันทึกการแก้ไข" : "บันทึกรายจ่าย" }}
          </button>
        </div>
      </form>
    </div>

    <!-- Section 2: Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="rounded-xl bg-gradient-to-br from-rose-500 to-red-600 p-5 text-white shadow-md">
        <p class="text-xs uppercase font-medium tracking-wider text-rose-100">รายจ่ายรวม (ช่วงเวลาที่เลือก)</p>
        <h3 class="text-3xl font-bold mt-1">฿{{ formatCurrency(expenseStore.totalExpenses) }}</h3>
        <p class="text-xs text-rose-100 mt-2">จำนวน {{ expenseStore.totalCount }} รายการ</p>
      </div>

      <div class="rounded-xl bg-white p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
        <p class="text-xs uppercase font-medium text-gray-400">หมวดหมู่ที่มีรายจ่ายสูงสุด</p>
        <div>
          <h4 class="text-xl font-bold text-gray-800 mt-1">
            {{ topCategory ? topCategory.category : '-' }}
          </h4>
          <p class="text-sm font-semibold text-rose-600 mt-1">
            {{ topCategory ? `฿${formatCurrency(topCategory.total)} (${topCategory.percentage.toFixed(1)}%)` : 'ไม่มีข้อมูล' }}
          </p>
        </div>
      </div>

      <div class="rounded-xl bg-white p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
        <p class="text-xs uppercase font-medium text-gray-400">หมวดหมู่ทั้งหมดที่มีการบันทึก</p>
        <div>
          <h4 class="text-xl font-bold text-gray-800 mt-1">
            {{ expenseStore.expensesByCategory.length }} หมวดหมู่
          </h4>
          <p class="text-xs text-gray-500 mt-1">
            แบ่งสัดส่วนเรียบร้อย
          </p>
        </div>
      </div>
    </div>

    <!-- Section 3: Filters & Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      <!-- Breakdown by Category (Left 1 col) -->
      <div class="rounded-xl bg-white p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 class="font-semibold text-gray-800 flex items-center gap-2">
          <component :is="PieChart" class="h-5 w-5 text-rose-500" />
          สัดส่วนรายจ่ายตามหมวดหมู่
        </h3>

        <div v-if="expenseStore.expensesByCategory.length === 0" class="text-center py-6 text-gray-400 text-sm">
          ไม่มีข้อมูลรายจ่ายในโหมดที่เลือก
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in expenseStore.expensesByCategory"
            :key="item.category"
            class="space-y-1 cursor-pointer p-2 rounded-lg hover:bg-rose-50/50 transition-colors"
            @click="setCategoryFilter(item.category)"
          >
            <div class="flex justify-between text-sm">
              <span class="font-medium text-gray-700 flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                {{ item.category }}
              </span>
              <span class="font-semibold text-gray-900">
                ฿{{ formatCurrency(item.total) }}
                <span class="text-xs font-normal text-gray-400 ml-1">({{ item.percentage.toFixed(1) }}%)</span>
              </span>
            </div>
            <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-rose-500 rounded-full transition-all duration-500"
                :style="{ width: `${item.percentage}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Expense List & Filters (Right 2 cols) -->
      <div class="lg:col-span-2 rounded-xl bg-white p-6 border border-gray-100 shadow-sm space-y-6">
        <!-- Filter Bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <!-- Time Filter Mode Buttons -->
          <div class="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
            <button
              v-for="m in filterModes"
              :key="m.value"
              @click="setFilterMode(m.value)"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
              :class="expenseStore.filters.mode === m.value ? 'bg-white text-rose-600 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'"
            >
              {{ m.label }}
            </button>
          </div>

          <!-- Category Filter Dropdown -->
          <div class="flex items-center gap-2">
            <label class="text-xs text-gray-500 font-medium">หมวดหมู่:</label>
            <select
              v-model="selectedCategoryFilter"
              @change="onCategoryFilterChange"
              class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium focus:border-rose-500 focus:outline-none"
            >
              <option value="all">ทั้งหมด</option>
              <option
                v-for="cat in expenseStore.categories"
                :key="cat.id"
                :value="cat.name"
              >
                {{ cat.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Search input -->
        <div class="relative">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="ค้นหาชื่อรายการ หรือ หมายเหตุ..."
            class="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm focus:border-rose-500 focus:outline-none"
          />
          <component :is="Search" class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>

        <!-- Loading State -->
        <div v-if="expenseStore.loading" class="flex justify-center items-center py-12 text-rose-500">
          <component :is="Loader2" class="h-8 w-8 animate-spin mr-2" />
          <span class="text-sm font-medium">กำลังโหลดข้อมูลรายจ่าย...</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredExpenses.length === 0" class="text-center py-12 text-gray-400">
          <component :is="FileQuestion" class="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p class="text-sm font-medium">ไม่พบรายการรายจ่ายตามเงื่อนไขที่เลือก</p>
        </div>

        <!-- Expenses Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm text-gray-600">
            <thead class="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b">
              <tr>
                <th class="px-4 py-3">วัน-เวลา</th>
                <th class="px-4 py-3">หมวดหมู่</th>
                <th class="px-4 py-3">รายการ / หมายเหตุ</th>
                <th class="px-4 py-3 text-right">จำนวนเงิน</th>
                <th class="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="item in filteredExpenses"
                :key="item.id"
                class="hover:bg-gray-50/80 transition-colors"
              >
                <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                  {{ formatThaiDateTime(item.dateTime) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span class="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 border border-rose-100">
                    {{ item.category }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">{{ item.title }}</div>
                  <div v-if="item.note" class="text-xs text-gray-400 mt-0.5">{{ item.note }}</div>
                </td>
                <td class="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                  ฿{{ formatCurrency(item.amount) }}
                </td>
                <td class="px-4 py-3 text-center whitespace-nowrap">
                  <div class="flex items-center justify-center space-x-2">
                    <button
                      @click="startEdit(item)"
                      class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                      title="แก้ไข"
                    >
                      <component :is="Edit3" class="h-4 w-4" />
                    </button>
                    <button
                      @click="confirmDelete(item)"
                      class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                      title="ลบ"
                    >
                      <component :is="Trash2" class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Category Management Modal -->
    <div
      v-if="showCategoryModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-gray-100 space-y-5">
        <div class="flex items-center justify-between border-b pb-3">
          <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <component :is="FolderPlus" class="h-5 w-5 text-purple-600" />
            จัดการหมวดหมู่รายจ่าย
          </h3>
          <button @click="showCategoryModal = false" class="text-gray-400 hover:text-gray-600">
            <component :is="X" class="h-5 w-5" />
          </button>
        </div>

        <!-- Add Category Form -->
        <form @submit.prevent="handleAddCategory" class="flex gap-2">
          <input
            type="text"
            v-model="newCategoryName"
            placeholder="ชื่อหมวดหมู่ใหม่..."
            required
            class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <button
            type="submit"
            :disabled="addingCategory"
            class="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            <component :is="addingCategory ? Loader2 : Plus" class="mr-1 h-4 w-4" :class="{ 'animate-spin': addingCategory }" />
            เพิ่ม
          </button>
        </form>

        <!-- Existing Categories List -->
        <div class="space-y-2 max-h-60 overflow-y-auto pt-2">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">หมวดหมู่ทั้งหมด</p>
          <div
            v-for="(cat, index) in expenseStore.categories"
            :key="cat.id"
            class="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm hover:bg-gray-100/80 transition-colors"
          >
            <span class="font-medium text-gray-700">{{ cat.name }}</span>
            <div class="flex items-center space-x-1">
              <!-- Reorder Up -->
              <button
                @click="moveCategory(index, 'up')"
                :disabled="index === 0"
                class="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-200/60 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                title="เลื่อนขึ้น"
              >
                <component :is="ChevronUp" class="h-4 w-4" />
              </button>

              <!-- Reorder Down -->
              <button
                @click="moveCategory(index, 'down')"
                :disabled="index === expenseStore.categories.length - 1"
                class="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-200/60 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                title="เลื่อนลง"
              >
                <component :is="ChevronDown" class="h-4 w-4" />
              </button>

              <!-- Edit -->
              <button
                @click="handleEditCategory(cat)"
                class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                title="แก้ไขชื่อหมวดหมู่"
              >
                <component :is="Edit3" class="h-4 w-4" />
              </button>

              <!-- Delete -->
              <button
                @click="handleDeleteCategory(cat)"
                class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                title="ลบหมวดหมู่"
              >
                <component :is="Trash2" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="pt-2 text-right">
          <button
            @click="showCategoryModal = false"
            class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useExpenseStore } from "../stores/expenseStore";
import { formatThaiDateTime, formatThaiDate, toDate } from "../utils/dateUtils";
import Swal from "sweetalert2";
import {
  Receipt,
  PlusCircle,
  Edit3,
  CheckCircle,
  Save,
  Loader2,
  FolderPlus,
  PieChart,
  Search,
  FileQuestion,
  Trash2,
  X,
  Plus,
  ChevronUp,
  ChevronDown,
  Calendar,
} from "lucide-vue-next";

const expenseStore = useExpenseStore();

const todayStr = new Date().toISOString().split("T")[0];

const formData = reactive({
  id: null,
  date: todayStr,
  title: "",
  category: "",
  amount: null,
  paymentMethod: "Transfer",
  note: "",
});

const isEditing = computed(() => !!formData.id);
const submitting = ref(false);
const searchQuery = ref("");
const selectedCategoryFilter = ref("all");

// Category Modal states
const showCategoryModal = ref(false);
const newCategoryName = ref("");
const addingCategory = ref(false);

const filterModes = [
  { value: "thisMonth", label: "เดือนนี้" },
  { value: "today", label: "วันนี้" },
  { value: "thisWeek", label: "สัปดาห์นี้" },
  { value: "thisYear", label: "ปีนี้" },
  { value: "all", label: "ทั้งหมด" },
];

const topCategory = computed(() => {
  return expenseStore.expensesByCategory.length > 0
    ? expenseStore.expensesByCategory[0]
    : null;
});

const filteredExpenses = computed(() => {
  let list = expenseStore.expenses;

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter(
      (item) =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.note && item.note.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
    );
  }

  return list;
});

const formatThaiDateDisplay = (dateStr) => {
  if (!dateStr) return "-";
  return formatThaiDate(new Date(dateStr));
};

const formatCurrency = (val) => {
  return (Number(val) || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const resetForm = () => {
  formData.id = null;
  formData.date = new Date().toISOString().split("T")[0];
  formData.title = "";
  formData.category = expenseStore.categories.length > 0 ? expenseStore.categories[0].name : "";
  formData.amount = null;
  formData.paymentMethod = "Transfer";
  formData.note = "";
};

const startEdit = (item) => {
  formData.id = item.id;
  const d = toDate(item.dateTime);
  formData.date = d ? d.toISOString().split("T")[0] : todayStr;
  formData.title = item.title || "";
  formData.category = item.category || "";
  formData.amount = item.amount;
  formData.paymentMethod = item.paymentMethod || "Transfer";
  formData.note = item.note || "";
};

const handleSaveExpense = async () => {
  submitting.value = true;
  try {
    const expenseData = {
      dateTime: new Date(formData.date),
      title: formData.title,
      category: formData.category,
      amount: formData.amount,
      paymentMethod: formData.paymentMethod,
      note: formData.note,
    };

    if (isEditing.value) {
      await expenseStore.editExpense(formData.id, expenseData);
      Swal.fire({
        icon: "success",
        title: "แก้ไขสำเร็จ",
        text: "อัปเดตรายการรายจ่ายเรียบร้อยแล้ว",
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      await expenseStore.createExpense(expenseData);
      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: "เพิ่มรายการรายจ่ายเรียบร้อยแล้ว",
        timer: 1500,
        showConfirmButton: false,
      });
    }

    resetForm();
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "เกิดข้อผิดพลาด",
      text: error.message || "ไม่สามารถบันทึกข้อมูลได้",
    });
  } finally {
    submitting.value = false;
  }
};

const confirmDelete = async (item) => {
  const result = await Swal.fire({
    title: "ยืนยันการลบ?",
    text: `ต้องการลบรายการ "${item.title}" จำนวน ฿${formatCurrency(item.amount)} ใช่หรือไม่?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "ลบรายการ",
    cancelButtonText: "ยกเลิก",
  });

  if (result.isConfirmed) {
    try {
      await expenseStore.removeExpense(item.id);
      Swal.fire({
        icon: "success",
        title: "ลบสำเร็จ",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถลบรายการได้",
      });
    }
  }
};

const setFilterMode = async (mode) => {
  await expenseStore.setFilter({ mode });
};

const onCategoryFilterChange = async () => {
  await expenseStore.setCategoryFilter(selectedCategoryFilter.value);
};

const setCategoryFilter = async (categoryName) => {
  selectedCategoryFilter.value = categoryName;
  await expenseStore.setCategoryFilter(categoryName);
};

const moveCategory = async (index, direction) => {
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= expenseStore.categories.length) return;

  const list = [...expenseStore.categories];
  const [movedItem] = list.splice(index, 1);
  list.splice(targetIndex, 0, movedItem);

  await expenseStore.reorderCategories(list);
};

const handleAddCategory = async () => {
  if (!newCategoryName.value.trim()) return;
  addingCategory.value = true;
  try {
    await expenseStore.createCategory(newCategoryName.value);
    newCategoryName.value = "";
    Swal.fire({
      icon: "success",
      title: "เพิ่มหมวดหมู่สำเร็จ",
      timer: 1200,
      showConfirmButton: false,
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "เกิดข้อผิดพลาด",
      text: error.message || "ไม่สามารถเพิ่มหมวดหมู่ได้",
    });
  } finally {
    addingCategory.value = false;
  }
};

const handleEditCategory = async (cat) => {
  const { value: newName } = await Swal.fire({
    title: "แก้ไขชื่อหมวดหมู่",
    input: "text",
    inputLabel: "ระบุชื่อหมวดหมู่ใหม่",
    inputValue: cat.name,
    showCancelButton: true,
    confirmButtonText: "บันทึกการแก้ไข",
    cancelButtonText: "ยกเลิก",
    inputValidator: (val) => {
      if (!val || !val.trim()) {
        return "กรุณาระบุชื่อหมวดหมู่";
      }
    },
  });

  if (newName && newName.trim() !== cat.name) {
    try {
      await expenseStore.editCategory(cat.id, newName.trim(), cat.name);
      Swal.fire({
        icon: "success",
        title: "แก้ไขหมวดหมู่สำเร็จ",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถแก้ไขหมวดหมู่ได้",
      });
    }
  }
};

const handleDeleteCategory = async (cat) => {
  const result = await Swal.fire({
    title: "ยืนยันการลบหมวดหมู่?",
    text: `ต้องการลบหมวดหมู่ "${cat.name}" ใช่หรือไม่?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    confirmButtonText: "ลบหมวดหมู่",
    cancelButtonText: "ยกเลิก",
  });

  if (result.isConfirmed) {
    try {
      await expenseStore.removeCategory(cat.id, cat.name);
      Swal.fire({
        icon: "success",
        title: "ลบหมวดหมู่สำเร็จ",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message,
      });
    }
  }
};

onMounted(async () => {
  await expenseStore.fetchCategories();
  if (expenseStore.categories.length > 0 && !formData.category) {
    formData.category = expenseStore.categories[0].name;
  }
  await expenseStore.fetchExpenses();
});
</script>
