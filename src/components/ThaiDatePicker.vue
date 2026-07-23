<template>
  <div class="relative w-full" ref="containerRef">
    <!-- Trigger Input Box -->
    <button
      type="button"
      @click="togglePicker"
      class="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-xs flex items-center justify-between font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
    >
      <span class="truncate">{{ thaiFormattedDate }}</span>
      <Calendar class="h-5 w-5 text-gray-400 shrink-0" />
    </button>

    <!-- Thai Date Picker Dropdown Popover -->
    <div
      v-if="isOpen"
      class="absolute left-0 top-full mt-2 z-50 w-72 md:w-80 rounded-2xl bg-white p-4 shadow-2xl border border-gray-100 animate-fade-in"
    >
      <!-- Header: Month & Year Selector -->
      <div class="mb-3 flex items-center justify-between gap-1 border-b border-gray-100 pb-3">
        <button
          type="button"
          @click="prevMonth"
          class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          title="เดือนก่อนหน้า"
        >
          <ChevronLeft class="h-5 w-5" />
        </button>

        <div class="flex items-center gap-1.5">
          <!-- Month Select -->
          <select
            v-model="currentMonth"
            class="rounded-lg border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-800 focus:border-blue-500 focus:ring-blue-500 cursor-pointer"
          >
            <option
              v-for="(name, index) in thaiMonthNames"
              :key="index"
              :value="index"
            >
              {{ name }}
            </option>
          </select>

          <!-- Year Select (พ.ศ.) -->
          <select
            v-model="currentYear"
            class="rounded-lg border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-800 focus:border-blue-500 focus:ring-blue-500 cursor-pointer"
          >
            <option v-for="yr in yearRange" :key="yr" :value="yr">
              พ.ศ. {{ yr + 543 }}
            </option>
          </select>
        </div>

        <button
          type="button"
          @click="nextMonth"
          class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          title="เดือนถัดไป"
        >
          <ChevronRight class="h-5 w-5" />
        </button>
      </div>

      <!-- Thai Day of Week Header -->
      <div class="mb-2 grid grid-cols-7 text-center">
        <span
          v-for="(day, idx) in thaiDayHeaders"
          :key="idx"
          class="text-xs font-bold py-1"
          :class="idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-blue-500' : 'text-gray-500'"
        >
          {{ day }}
        </span>
      </div>

      <!-- Calendar Days Grid -->
      <div class="grid grid-cols-7 gap-1 text-center">
        <!-- Empty Days before start of month -->
        <div v-for="empty in paddingDays" :key="'empty-' + empty" class="h-8 md:h-9"></div>

        <!-- Days of current month -->
        <button
          v-for="day in daysInMonth"
          :key="day"
          type="button"
          @click="selectDay(day)"
          class="h-8 md:h-9 w-full rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center justify-center cursor-pointer"
          :class="getDayClass(day)"
        >
          {{ day }}
        </button>
      </div>

      <!-- Footer Action Buttons -->
      <div class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <button
          type="button"
          @click="selectToday"
          class="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
        >
          📍 เลือกวันนี้
        </button>
        <button
          type="button"
          @click="isOpen = false"
          class="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          ปิด
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-vue-next";
import { formatThaiDate } from "../utils/dateUtils.js";

const props = defineProps({
  modelValue: {
    type: String,
    default: "", // Format: YYYY-MM-DD
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const isOpen = ref(false);
const containerRef = ref(null);

const thaiMonthNames = [
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

const thaiDayHeaders = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

// Calendar Navigation State
const today = new Date();
const currentMonth = ref(today.getMonth());
const currentYear = ref(today.getFullYear());

// Year range (current year - 5 to + 2)
const yearRange = computed(() => {
  const cy = today.getFullYear();
  const list = [];
  for (let y = cy - 5; y <= cy + 2; y++) {
    list.push(y);
  }
  return list;
});

// Sync state with modelValue
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      const d = new Date(newVal);
      if (!isNaN(d.getTime())) {
        currentMonth.value = d.getMonth();
        currentYear.value = d.getFullYear();
      }
    }
  },
  { immediate: true }
);

// Computed Display Text
const thaiFormattedDate = computed(() => {
  if (!props.modelValue) return "เลือกวันที่";
  const dateObj = new Date(props.modelValue);
  if (isNaN(dateObj.getTime())) return "เลือกวันที่";
  return formatThaiDate(dateObj);
});

// Days calculations
const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

const paddingDays = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay();
});

// Date selection
const selectDay = (day) => {
  const m = String(currentMonth.value + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  const formattedIso = `${currentYear.value}-${m}-${d}`;
  emit("update:modelValue", formattedIso);
  emit("change", formattedIso);
  isOpen.value = false;
};

const selectToday = () => {
  const now = new Date();
  currentMonth.value = now.getMonth();
  currentYear.value = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const formattedIso = `${now.getFullYear()}-${m}-${d}`;
  emit("update:modelValue", formattedIso);
  emit("change", formattedIso);
  isOpen.value = false;
};

// Navigation helpers
const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

const togglePicker = () => {
  isOpen.value = !isOpen.value;
};

// Click outside handler
const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const getDayClass = (day) => {
  if (!props.modelValue) return "hover:bg-blue-50 text-gray-800";
  const parts = props.modelValue.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]) - 1;
    const d = parseInt(parts[2]);
    if (y === currentYear.value && m === currentMonth.value && d === day) {
      return "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30";
    }
  }
  
  // Check if today
  if (
    today.getFullYear() === currentYear.value &&
    today.getMonth() === currentMonth.value &&
    today.getDate() === day
  ) {
    return "bg-blue-50 text-blue-600 font-bold border border-blue-200";
  }

  return "hover:bg-gray-100 text-gray-800";
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
