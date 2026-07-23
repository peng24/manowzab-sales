<template>
  <div class="relative w-full" ref="containerRef">
    <!-- Trigger Input Box -->
    <button
      type="button"
      @click="togglePicker"
      class="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-xs flex items-center justify-between font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
    >
      <span class="truncate">{{ formattedTimeDisplay }}</span>
      <Clock class="h-5 w-5 text-gray-400 shrink-0" />
    </button>

    <!-- Thai Time Picker Dropdown Popover -->
    <div
      v-if="isOpen"
      class="absolute left-0 top-full mt-2 z-50 w-64 md:w-72 rounded-2xl bg-white p-4 shadow-2xl border border-gray-100 animate-fade-in"
    >
      <div class="mb-3 text-center border-b border-gray-100 pb-2">
        <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">
          เลือกเวลา (ระบบ 24 ชั่วโมง)
        </span>
      </div>

      <!-- Time Selectors Grid (24-Hour & Minutes) -->
      <div class="grid grid-cols-2 gap-3 mb-4 text-center">
        <!-- Hour Selection -->
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1">ชั่วโมง (00-23 น.)</label>
          <select
            v-model="selectedHour"
            @change="emitTime"
            class="w-full rounded-xl border-gray-200 bg-gray-50 p-2 text-center text-base font-bold text-gray-800 focus:border-blue-500 focus:ring-blue-500 cursor-pointer"
          >
            <option v-for="h in 24" :key="h - 1" :value="String(h - 1).padStart(2, '0')">
              {{ String(h - 1).padStart(2, '0') }} น.
            </option>
          </select>
        </div>

        <!-- Minute Selection -->
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1">นาที (00-59 น.)</label>
          <select
            v-model="selectedMinute"
            @change="emitTime"
            class="w-full rounded-xl border-gray-200 bg-gray-50 p-2 text-center text-base font-bold text-gray-800 focus:border-blue-500 focus:ring-blue-500 cursor-pointer"
          >
            <option v-for="m in 60" :key="m - 1" :value="String(m - 1).padStart(2, '0')">
              {{ String(m - 1).padStart(2, '0') }} นาที
            </option>
          </select>
        </div>
      </div>

      <!-- Quick Time Presets -->
      <div class="mb-3">
        <span class="block text-xs font-semibold text-gray-400 mb-1.5 text-center">
          เวลาด่วน
        </span>
        <div class="grid grid-cols-3 gap-1.5 text-xs font-semibold">
          <button
            v-for="preset in ['09:00', '12:00', '15:00', '18:00', '21:00']"
            :key="preset"
            type="button"
            @click="setPreset(preset)"
            class="rounded-lg bg-gray-100 py-1.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
          >
            {{ preset }} น.
          </button>
          <button
            type="button"
            @click="setNow"
            class="rounded-lg bg-blue-50 py-1.5 text-blue-600 font-bold hover:bg-blue-100 transition-colors cursor-pointer"
          >
            ปัจจุบัน
          </button>
        </div>
      </div>

      <!-- Footer Action Buttons -->
      <div class="flex items-center justify-end border-t border-gray-100 pt-2.5">
        <button
          type="button"
          @click="isOpen = false"
          class="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
        >
          ตกลง
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { Clock } from "lucide-vue-next";

const props = defineProps({
  modelValue: {
    type: String,
    default: "12:00", // Format: HH:mm (24-hour)
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const isOpen = ref(false);
const containerRef = ref(null);

const selectedHour = ref("12");
const selectedMinute = ref("00");

// Parse HH:mm from modelValue
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && newVal.includes(":")) {
      const parts = newVal.split(":");
      selectedHour.value = parts[0].padStart(2, "0");
      selectedMinute.value = parts[1].padStart(2, "0");
    }
  },
  { immediate: true }
);

const formattedTimeDisplay = computed(() => {
  if (!props.modelValue) return "เลือกเวลา";
  return `${props.modelValue} น.`;
});

const emitTime = () => {
  const timeStr = `${selectedHour.value}:${selectedMinute.value}`;
  emit("update:modelValue", timeStr);
  emit("change", timeStr);
};

const setPreset = (preset) => {
  const parts = preset.split(":");
  selectedHour.value = parts[0];
  selectedMinute.value = parts[1];
  emitTime();
};

const setNow = () => {
  const now = new Date();
  selectedHour.value = String(now.getHours()).padStart(2, "0");
  selectedMinute.value = String(now.getMinutes()).padStart(2, "0");
  emitTime();
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
