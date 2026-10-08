<template>
  <div class="container mx-auto max-w-7xl py-1 md:py-2">
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">
          นำเข้า COD (Preview Mode)
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          อัปโหลดไฟล์ Excel จากขนส่ง ตรวจสอบยอดขาย และระบุจำนวนตัวเพื่อคิดต้นทุนแฝง
        </p>
      </div>
    </div>

    <!-- Upload Section -->
    <div
      class="mb-8 rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-200 text-center"
    >
      <div
        class="mx-auto max-w-xl"
        @dragover.prevent
        @dragenter.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <label
          class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 md:py-10 transition-colors bg-gray-50 hover:bg-gray-100 hover:border-blue-400"
          :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'"
        >
          <div class="flex flex-col items-center justify-center pt-3 pb-4">
            <svg
              class="mb-3 h-10 w-10 text-gray-400"
              :class="{ 'text-blue-500': isDragging }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              ></path>
            </svg>
            <p v-if="!isDragging" class="mb-2 text-sm text-gray-600">
              <span class="font-semibold text-blue-600">คลิกเพื่อเลือกไฟล์</span>
              หรือลากไฟล์มาวางที่นี่
            </p>
            <p v-else class="mb-2 text-sm text-blue-600 font-semibold">
              วางไฟล์ลงที่นี่ได้เลย
            </p>
            <p class="text-xs text-gray-400">
              รองรับไฟล์ .xlsx, .xls (ระบบอ่านวันที่จากคอลัมน์ในไฟล์ หรือชื่อไฟล์ YYYYMMDD_...)
            </p>
          </div>
          <input
            type="file"
            class="hidden"
            multiple
            accept=".xlsx, .xls"
            @change="handleFileUpload"
          />
        </label>
      </div>

      <!-- Processing Status -->
      <div v-if="processing" class="mt-4">
        <p class="text-blue-600 font-medium animate-pulse flex items-center justify-center gap-2">
          <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          กำลังอ่านและคำนวณข้อมูลไฟล์ Excel...
        </p>
      </div>
    </div>

    <!-- Summary Stats (4 Cards) -->
    <div
      v-if="previewItems.length > 0"
      class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <!-- Files -->
      <div class="rounded-xl bg-white p-5 border border-blue-100 shadow-xs">
        <div class="flex items-center justify-between text-blue-800">
          <span class="text-xs font-semibold uppercase tracking-wider">จำนวนไฟล์</span>
          <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">Excel</span>
        </div>
        <p class="mt-2 text-2xl font-black text-blue-900">
          {{ processedFilesCount }} <span class="text-sm font-normal text-blue-700">ไฟล์</span>
        </p>
      </div>

      <!-- Orders -->
      <div class="rounded-xl bg-white p-5 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between text-slate-700">
          <span class="text-xs font-semibold uppercase tracking-wider">จำนวนออเดอร์</span>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">รายการ</span>
        </div>
        <p class="mt-2 text-2xl font-black text-slate-800">
          {{ previewItems.length }} <span class="text-sm font-normal text-slate-500">ออเดอร์</span>
        </p>
      </div>

      <!-- Total Pieces (Items) with Overhead Cost preview -->
      <div class="rounded-xl bg-white p-5 border border-indigo-100 shadow-xs ring-1 ring-indigo-50">
        <div class="flex items-center justify-between text-indigo-800">
          <span class="text-xs font-semibold uppercase tracking-wider">จำนวนตัวรวม (ชิ้น)</span>
          <span class="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
            ปรับเอง {{ manualEditedCount }} / ระบบ {{ autoCount }}
          </span>
        </div>
        <p class="mt-2 text-2xl font-black text-indigo-900 flex items-baseline gap-1">
          {{ totalItemCount.toLocaleString() }} <span class="text-sm font-normal text-indigo-700">ตัว</span>
        </p>
        <div
          v-if="expenseStore.autoOverheadEnabled && expenseStore.autoOverheadRate > 0"
          class="mt-2 inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 border border-rose-100"
        >
          <span>🏷️ ต้นทุนแฝง:</span>
          <span>฿{{ formatCurrency(totalEstimatedOverhead) }}</span>
          <span class="text-[11px] font-normal text-rose-500">(@{{ expenseStore.autoOverheadRate }}฿)</span>
        </div>
      </div>

      <!-- Total Amount -->
      <div class="rounded-xl bg-white p-5 border border-amber-200 shadow-xs">
        <div class="flex items-center justify-between text-amber-800">
          <span class="text-xs font-semibold uppercase tracking-wider">ยอดขายรวมทั้งหมด</span>
          <span class="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">บาท</span>
        </div>
        <p class="mt-2 text-2xl font-black text-amber-900">
          ฿{{ formatCurrency(totalAmount) }}
        </p>
      </div>
    </div>

    <!-- Confirm Action & Top Buttons -->
    <div v-if="previewItems.length > 0" class="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
      <div class="flex items-center gap-2">
        <button
          @click="clearData"
          class="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition-colors cursor-pointer"
        >
          ล้างข้อมูล
        </button>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="confirmImport"
          :disabled="isSaving"
          class="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <svg
            v-if="isSaving"
            class="h-5 w-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span v-if="isSaving">กำลังบันทึกข้อมูล...</span>
          <span v-else>ยืนยันการนำเข้า {{ previewItems.length }} รายการ ({{ totalItemCount }} ตัว)</span>
        </button>
      </div>
    </div>

    <!-- Smart Estimator Toolbar -->
    <div
      v-if="previewItems.length > 0"
      class="mb-6 rounded-xl bg-gradient-to-r from-slate-50 to-indigo-50/40 p-5 border border-indigo-100/80 shadow-xs"
    >
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <!-- Average Price Setting & Presets -->
        <div>
          <div class="flex items-center gap-2">
            <span class="text-base font-bold text-gray-800 flex items-center gap-1.5">
              <span>⚡</span> เครื่องมือคิดจำนวนตัวอัตโนมัติ (Smart Estimator)
            </span>
            <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
              สูตร: ยอดขาย ÷ ราคาเฉลี่ย
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            เลือกราคาเฉลี่ยต่อตัวของร้าน ระบบจะคำนวณจำนวนตัวเริ่มต้นให้ทันที และคุณสามารถคลิกปรับแก้ในตารางได้
          </p>

          <div class="mt-3 flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold text-gray-600">ราคาเฉลี่ยต่อตัว:</span>
            <!-- Price preset buttons (20, 50, 60, 80) -->
            <button
              v-for="price in pricePresets"
              :key="price"
              type="button"
              @click="setAvgPrice(price)"
              class="px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer"
              :class="
                codAvgPrice === price
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              "
            >
              ฿{{ price }} {{ price === 50 ? '(เริ่มต้น)' : '' }}
            </button>

            <!-- Custom price input -->
            <div class="flex items-center gap-1 ml-1">
              <input
                type="number"
                v-model.number="codAvgPrice"
                min="1"
                step="5"
                @change="onCustomAvgPriceChange"
                class="w-16 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-center font-bold text-gray-800 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span class="text-xs text-gray-500">฿/ตัว</span>
            </div>

            <!-- Recalculate Actions -->
            <button
              type="button"
              @click="recalculateUntouched"
              title="คำนวณใหม่เฉพาะรายการที่ยังไม่ได้ปรับเอง"
              class="ml-2 inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
              </svg>
              คำนวณใหม่ (เฉพาะที่ยังไม่แก้)
            </button>

            <button
              type="button"
              @click="recalculateAll"
              title="รีเซ็ตและคำนวณใหม่ทุกรายการ"
              class="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 shadow-2xs hover:bg-gray-100 transition-colors cursor-pointer"
            >
              รีเซ็ตทั้งหมด
            </button>
          </div>
        </div>

        <!-- Color Legend (คำอธิบายสี) -->
        <div class="flex flex-col sm:flex-row lg:flex-col gap-2 rounded-lg bg-white/80 p-3 border border-gray-200/80 text-xs text-gray-600">
          <span class="font-bold text-gray-700">🎨 ความหมายของสี:</span>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-bold text-blue-700 border border-blue-200">
              🤖 สีฟ้า
            </span>
            <span class="text-gray-600">ระบบคำนวณอัตโนมัติ (฿{{ codAvgPrice }}/ตัว)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 border border-emerald-300">
              ✏️ สีเขียว
            </span>
            <span class="text-gray-600">คุณปรับแก้เองแล้ว (เปลี่ยนสีทันที)</span>
          </div>
        </div>
      </div>

      <!-- Quick Filter Tabs -->
      <div class="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-2">
        <span class="text-xs font-semibold text-gray-500 mr-1">แสดงเฉพาะ:</span>
        <button
          type="button"
          @click="activeFilter = 'all'"
          class="px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          :class="
            activeFilter === 'all'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          "
        >
          ทั้งหมด ({{ previewItems.length }})
        </button>
        <button
          type="button"
          @click="activeFilter = 'manual'"
          class="px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          :class="
            activeFilter === 'manual'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
          "
        >
          ✏️ ปรับเองแล้ว ({{ manualEditedCount }})
        </button>
        <button
          type="button"
          @click="activeFilter = 'auto'"
          class="px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          :class="
            activeFilter === 'auto'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
          "
        >
          🤖 ระบบคิดให้ ({{ autoCount }})
        </button>
        <button
          type="button"
          @click="activeFilter = 'highValue'"
          class="px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          :class="
            activeFilter === 'highValue'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
          "
        >
          🔥 ยอดสูง ≥ 150บ. ({{ highValueCount }})
        </button>
      </div>
    </div>

    <!-- Preview Table -->
    <div
      v-if="previewItems.length > 0"
      class="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden"
    >
      <div class="border-b border-gray-200 bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span>ตัวอย่างข้อมูล (Preview)</span>
          <span class="text-xs font-normal text-gray-500">
            (แสดง {{ filteredPreviewItems.length }} จาก {{ previewItems.length }} รายการ)
          </span>
        </h3>
        <p class="text-xs text-gray-500">
          💡 สามารถกดปุ่ม <span class="font-bold text-gray-700">[-]</span>, <span class="font-bold text-gray-700">[+]</span> หรือเลือกเลข <span class="font-bold text-gray-700">[1-5]</span> เพื่อเปลี่ยนจำนวนตัวได้ทันที
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-left">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                #
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                วันที่
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                Order No.
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                ลูกค้า (Customer)
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                เบอร์ / ที่อยู่
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                ยอด COD (Amount)
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider whitespace-nowrap bg-indigo-50/60"
              >
                จำนวนตัว (ชิ้น)
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="item in filteredPreviewItems"
              :key="item.orderNo"
              class="transition-colors"
              :class="item.isManualEdit ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : 'hover:bg-gray-50'"
            >
              <!-- Index Number -->
              <td class="px-4 py-3 whitespace-nowrap text-center text-xs text-gray-400 font-mono">
                {{ previewItems.indexOf(item) + 1 }}
              </td>

              <!-- Date -->
              <td
                class="px-4 py-3 whitespace-nowrap text-xs"
                :class="
                  !item.date || isNaN(new Date(item.date).getTime())
                    ? 'text-red-600 font-bold bg-red-50'
                    : 'text-gray-700'
                "
              >
                {{
                  item.date && !isNaN(new Date(item.date).getTime())
                    ? formatDate(item.date)
                    : 'วันที่ไม่ถูกต้อง'
                }}
              </td>

              <!-- Order No -->
              <td class="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-900 font-mono">
                {{ item.orderNo }}
              </td>

              <!-- Customer Name -->
              <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-medium">
                {{ item.customerName || '-' }}
              </td>

              <!-- Phone / Address -->
              <td class="px-4 py-3 text-xs text-gray-500 max-w-xs">
                <div v-if="item.phoneNumber" class="flex items-center gap-1 font-mono text-gray-700">
                  📞 {{ item.phoneNumber }}
                </div>
                <div
                  v-if="item.address"
                  class="truncate text-gray-400 text-[11px]"
                  :title="item.address"
                >
                  📍 {{ item.address }}
                </div>
              </td>

              <!-- Amount -->
              <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-amber-600">
                ฿{{ formatCurrency(item.amount) }}
              </td>

              <!-- Item Count (Smart Stepper & Quick Pills with Color Indicator) -->
              <td
                class="px-4 py-2.5 whitespace-nowrap"
                :class="item.isManualEdit ? 'bg-emerald-50/50' : 'bg-blue-50/30'"
              >
                <div class="flex flex-col items-center gap-1.5 min-w-[210px]">
                  <!-- Calculation Status Tag & Reset Button -->
                  <div class="flex items-center justify-between w-full px-1">
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md transition-colors"
                      :class="
                        item.isManualEdit
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      "
                    >
                      <span v-if="item.isManualEdit">✏️ ปรับเองแล้ว</span>
                      <span v-else>🤖 คิดตามยอด (฿{{ codAvgPrice }})</span>
                    </span>

                    <!-- Reset button (only when manually edited) -->
                    <button
                      v-if="item.isManualEdit"
                      type="button"
                      @click="resetToAuto(item)"
                      title="คืนค่าเป็นตัวเลขที่ระบบคำนวณ"
                      class="text-[11px] text-gray-500 hover:text-emerald-700 underline font-medium cursor-pointer flex items-center gap-0.5"
                    >
                      ↺ คืนค่า ({{ item.autoCalculatedCount }})
                    </button>
                  </div>

                  <!-- Stepper Controls (Instant Green on Click/Input) -->
                  <div
                    class="flex items-center rounded-lg border transition-all p-0.5 shadow-2xs"
                    :class="
                      item.isManualEdit
                        ? 'bg-white border-emerald-400 ring-2 ring-emerald-200'
                        : 'bg-white border-blue-300'
                    "
                  >
                    <!-- Decrement Button -->
                    <button
                      type="button"
                      @click="decrementItem(item)"
                      :disabled="item.itemCount <= 1"
                      class="flex h-7 w-7 items-center justify-center rounded-md font-bold text-sm transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      :class="
                        item.isManualEdit
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      "
                    >
                      -
                    </button>

                    <!-- Number Input -->
                    <input
                      type="number"
                      min="1"
                      v-model.number="item.itemCount"
                      @input="onManualInput(item)"
                      @change="onManualInput(item)"
                      class="h-7 w-12 text-center text-sm font-black focus:outline-none"
                      :class="
                        item.isManualEdit
                          ? 'text-emerald-950 font-bold'
                          : 'text-blue-900 font-semibold'
                      "
                    />

                    <!-- Increment Button -->
                    <button
                      type="button"
                      @click="incrementItem(item)"
                      class="flex h-7 w-7 items-center justify-center rounded-md font-bold text-sm transition-colors cursor-pointer"
                      :class="
                        item.isManualEdit
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      "
                    >
                      +
                    </button>
                  </div>

                  <!-- Quick Number Pills (1, 2, 3, 4, 5) -->
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] text-gray-400 font-medium">ด่วน:</span>
                    <button
                      v-for="num in [1, 2, 3, 4, 5]"
                      :key="num"
                      type="button"
                      @click="setItemCount(item, num)"
                      class="h-5 w-5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center"
                      :class="
                        item.itemCount === num
                          ? (item.isManualEdit
                              ? 'bg-emerald-600 text-white shadow-2xs font-black ring-1 ring-emerald-300'
                              : 'bg-blue-600 text-white font-black')
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                      "
                    >
                      {{ num }}
                    </button>
                  </div>

                  <!-- Estimated Overhead preview for this row -->
                  <div
                    v-if="expenseStore.autoOverheadEnabled && expenseStore.autoOverheadRate > 0"
                    class="text-[10px] text-rose-600 font-medium"
                  >
                    แฝง: ฿{{ ((Number(item.itemCount) || 1) * expenseStore.autoOverheadRate).toFixed(1) }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import ExcelJS from "exceljs";
import Swal from "sweetalert2";
import { format, parse } from "date-fns";
import { formatThaiDateOptionalTime } from "../utils/dateUtils.js";
import { formatCurrency, sanitizeCustomerId } from "../utils/formatUtils.js";
import { useSalesStore } from "../stores/salesStore.js";
import { useExpenseStore } from "../stores/expenseStore.js";

const router = useRouter();
const salesStore = useSalesStore();
const expenseStore = useExpenseStore();

const processing = ref(false);
const isSaving = ref(false);
const previewItems = ref([]);
const processedFilesCount = ref(0);
const isDragging = ref(false);

// Average price settings (persisted in localStorage)
const savedAvgPrice = Number(localStorage.getItem("salespilot_cod_avg_price"));
const codAvgPrice = ref(savedAvgPrice && savedAvgPrice > 0 ? savedAvgPrice : 50);
const pricePresets = [20, 50, 60, 80];

// Active filter: 'all', 'manual', 'auto', 'highValue'
const activeFilter = ref("all");

// --- ITEM COUNT ESTIMATION & LOGIC ---

/**
 * Calculate estimated item count based on amount and average item price
 */
const calculateItemCountByAmount = (amount, avgPrice = 50) => {
  const val = Number(amount) || 0;
  const price = Number(avgPrice) || 50;
  if (val <= 0) return 1;
  return Math.max(1, Math.round(val / price));
};

/**
 * Handle user clicking decrement button: immediately switch to manual edit
 */
const decrementItem = (item) => {
  if (item.itemCount > 1) {
    item.itemCount--;
    item.isManualEdit = true;
  }
};

/**
 * Handle user clicking increment button: immediately switch to manual edit
 */
const incrementItem = (item) => {
  item.itemCount = (Number(item.itemCount) || 1) + 1;
  item.isManualEdit = true;
};

/**
 * Handle user clicking a quick number pill [1, 2, 3, 4, 5]: immediately switch to manual edit
 */
const setItemCount = (item, count) => {
  item.itemCount = Math.max(1, Math.floor(Number(count) || 1));
  item.isManualEdit = true;
};

/**
 * Handle user typing into number input: immediately switch to manual edit
 */
const onManualInput = (item) => {
  item.itemCount = Math.max(1, Math.floor(Number(item.itemCount) || 1));
  item.isManualEdit = true;
};

/**
 * Reset an item's count back to auto calculation
 */
const resetToAuto = (item) => {
  item.itemCount = item.autoCalculatedCount;
  item.isManualEdit = false;
};

/**
 * Change average price preset and update unedited items
 */
const setAvgPrice = (price) => {
  codAvgPrice.value = price;
  localStorage.setItem("salespilot_cod_avg_price", String(price));
  recalculateUntouched();
};

/**
 * Handle custom average price change
 */
const onCustomAvgPriceChange = () => {
  if (!codAvgPrice.value || codAvgPrice.value <= 0) {
    codAvgPrice.value = 50;
  }
  localStorage.setItem("salespilot_cod_avg_price", String(codAvgPrice.value));
  recalculateUntouched();
};

/**
 * Recalculate only items that were NOT manually touched by user
 */
const recalculateUntouched = () => {
  previewItems.value.forEach((item) => {
    const calculated = calculateItemCountByAmount(item.amount, codAvgPrice.value);
    item.autoCalculatedCount = calculated;
    if (!item.isManualEdit) {
      item.itemCount = calculated;
    }
  });
};

/**
 * Recalculate ALL items (warns user if some were manually modified)
 */
const recalculateAll = async () => {
  if (manualEditedCount.value > 0) {
    const result = await Swal.fire({
      title: "รีเซ็ตและคำนวณใหม่ทั้งหมด?",
      text: `พบ ${manualEditedCount.value} รายการที่คุณปรับเอง จะถูกรีเซ็ตเป็นยอดที่ระบบคำนวณทั้งหมด ยืนยันหรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน รีเซ็ตทั้งหมด",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#f59e0b",
    });
    if (!result.isConfirmed) return;
  }

  previewItems.value.forEach((item) => {
    const calculated = calculateItemCountByAmount(item.amount, codAvgPrice.value);
    item.autoCalculatedCount = calculated;
    item.itemCount = calculated;
    item.isManualEdit = false;
  });
};

// --- FILE UPLOAD & PROCESSING ---

const handleFileUpload = (event) => {
  const files = event.target.files;
  processFiles(files);
  event.target.value = "";
};

const handleDrop = (event) => {
  isDragging.value = false;
  const files = event.dataTransfer.files;
  processFiles(files);
};

const readFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Main Logic: Process Excel with ExcelJS
 */
const processFiles = async (files) => {
  if (!files || !files.length) return;

  processing.value = true;
  processedFilesCount.value = files.length;
  previewItems.value = [];

  try {
    for (const file of files) {
      const workbook = new ExcelJS.Workbook();
      let fileDate = parseDateFromFilename(file.name);

      try {
        const buffer = await readFile(file);
        await workbook.xlsx.load(buffer);

        // Select Sheet (Try 'COD Detail' first, else first sheet)
        let worksheet = workbook.getWorksheet("COD Detail");
        if (!worksheet) {
          worksheet = workbook.worksheets[0];
        }

        if (!worksheet) {
          Swal.fire({
            icon: "error",
            title: "ไม่พบข้อมูล",
            text: `ไฟล์ ${file.name} ไม่พบ Worksheet`,
          });
          continue;
        }

        // Extended Column Map
        let headerRowIndex = -1;
        let colMap = {
          orderNo: -1,
          customerName: -1,
          amount: -1,
          trackingNo: -1,
          phoneNumber: -1,
          address: -1,
          pickedUpDate: -1,
        };

        const newItems = [];

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          // Look for Header (Keywords)
          if (headerRowIndex === -1) {
            row.eachCell((cell, colNumber) => {
              const val = cell.text ? cell.text.toLowerCase().trim() : "";

              if (val.includes("order") && val.includes("no"))
                colMap.orderNo = colNumber;
              if (val.includes("recipient") || val.includes("name")) {
                if (colMap.customerName === -1) colMap.customerName = colNumber;
              }
              if (val.includes("cod") && val.includes("amount"))
                colMap.amount = colNumber;
              if (val.includes("tracking") && val.includes("no"))
                colMap.trackingNo = colNumber;
              if (
                val.includes("phone") ||
                val.includes("tel") ||
                val.includes("mobile") ||
                val.includes("เบอร์")
              )
                colMap.phoneNumber = colNumber;
              if (val.includes("address") || val.includes("ที่อยู่"))
                colMap.address = colNumber;
              if (val.includes("picked") && val.includes("date"))
                colMap.pickedUpDate = colNumber;
            });

            if (
              (colMap.orderNo !== -1 || colMap.trackingNo !== -1) &&
              colMap.amount !== -1
            ) {
              headerRowIndex = rowNumber;
            }
            return;
          }

          // Extract Data Rows
          if (rowNumber > headerRowIndex) {
            const orderCell =
              colMap.orderNo !== -1 ? row.getCell(colMap.orderNo) : null;
            const trackingCell =
              colMap.trackingNo !== -1 ? row.getCell(colMap.trackingNo) : null;
            const nameCell =
              colMap.customerName !== -1
                ? row.getCell(colMap.customerName)
                : null;
            const amountCell = row.getCell(colMap.amount);
            const phoneCell =
              colMap.phoneNumber !== -1
                ? row.getCell(colMap.phoneNumber)
                : null;
            const addressCell =
              colMap.address !== -1 ? row.getCell(colMap.address) : null;
            const dateCell =
              colMap.pickedUpDate !== -1
                ? row.getCell(colMap.pickedUpDate)
                : null;

            let orderNoVal =
              orderCell && orderCell.text ? orderCell.text.trim() : "";
            let trackingNoVal =
              trackingCell && trackingCell.text ? trackingCell.text.trim() : "";

            // Fallback Logic: Use Tracking No if Order No is empty
            let finalOrderNo = orderNoVal;
            if (!finalOrderNo && trackingNoVal) {
              finalOrderNo = trackingNoVal;
            }

            let customerName =
              nameCell && nameCell.text ? nameCell.text.trim() : "";
            let amountStr = amountCell && amountCell.text ? amountCell.text.trim() : "0";

            let phoneNumber =
              phoneCell && phoneCell.text ? phoneCell.text.trim() : "";
            let address =
              addressCell && addressCell.text ? addressCell.text.trim() : "";

            // Extract Date from Column (Priority)
            let itemDate = fileDate;
            if (dateCell && (dateCell.value || dateCell.text)) {
              try {
                if (dateCell.value instanceof Date) {
                  itemDate = dateCell.value;
                } else {
                  const dateStr = dateCell.text.trim();
                  if (dateStr.includes("-")) {
                    const parsed = parse(dateStr, "dd-MM-yy HH:mm", new Date());
                    if (!isNaN(parsed.getTime())) {
                      itemDate = parsed;
                    }
                  }
                }
              } catch (e) {
                console.warn("Date parse error for row " + rowNumber, e);
              }
            }

            if (!finalOrderNo) return;
            if (finalOrderNo.toLowerCase().includes("order no")) return;

            const amountVal = parseFloat(amountStr.replace(/,/g, "")) || 0;
            const initialCount = calculateItemCountByAmount(amountVal, codAvgPrice.value);

            newItems.push({
              orderNo: finalOrderNo,
              customerName,
              amount: amountVal,
              phoneNumber,
              address,
              date: itemDate,
              sourceFile: file.name,
              itemCount: initialCount,
              autoCalculatedCount: initialCount,
              isManualEdit: false,
            });
          }
        });

        console.log(`Extracted ${newItems.length} items from ${file.name}`);
        previewItems.value.push(...newItems);

        if (headerRowIndex === -1) {
          Swal.fire({
            icon: "error",
            title: "ไม่พบหัวตาราง",
            text: `ไม่พบคอลัมน์ Order No / Tracking No และ Amount ในไฟล์ ${file.name}`,
          });
        }
      } catch (err) {
        console.error(`Error processing ${file.name}:`, err);
        Swal.fire({
          icon: "error",
          title: "อ่านไฟล์ล้มเหลว",
          text: `${file.name}: ${err.message}`,
        });
      }
    }
  } catch (error) {
    console.error("Process error:", error);
    Swal.fire({ icon: "error", title: "System Error", text: error.message });
  } finally {
    processing.value = false;
  }
};

// --- SAVE TO FIREBASE ---
const confirmImport = async () => {
  if (previewItems.value.length === 0) return;

  if (hasInvalidDates.value) {
    Swal.fire({
      icon: "error",
      title: "พบข้อมูลวันที่ไม่ถูกต้อง",
      text: "กรุณาตรวจสอบข้อมูลวันที่ในตาราง (ตัวอักษรสีแดง) เนื่องจากไม่สามารถระบุวันที่จากชื่อไฟล์หรือคอลัมน์ในไฟล์ได้",
    });
    return;
  }

  // Confirm Dialog
  const result = await Swal.fire({
    title: "ยืนยันการบันทึก?",
    html: `ต้องการบันทึกยอดขาย COD ทั้งหมด <b>${previewItems.value.length}</b> รายการ<br>รวมจำนวน <b>${totalItemCount.value.toLocaleString()}</b> ตัว และอัปเดตข้อมูลลูกค้า?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "ยืนยัน (Save)",
    cancelButtonText: "ยกเลิก",
    buttonsStyling: false,
    customClass: {
      confirmButton:
        "bg-green-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 mx-2 cursor-pointer",
      cancelButton:
        "bg-red-500 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 mx-2 cursor-pointer",
    },
  });

  if (!result.isConfirmed) return;

  isSaving.value = true;

  Swal.fire({
    title: "กำลังบันทึกข้อมูล...",
    html:
      'ระบบกำลังบันทึกยอดขายและสร้างฐานข้อมูลลูกค้า<br>กรุณารอสักครู่ ห้ามปิดหน้านี้<br><br><span id="batch-progress">Processing: 0 / ' +
      previewItems.value.length +
      "</span>",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    // Prepare sales items with itemCount mapping
    const salesItems = previewItems.value.map((item) => ({
      orderNo: item.orderNo,
      customerName: sanitizeCustomerId(item.customerName),
      amount: Number(item.amount),
      date: item.date,
      phoneNumber: item.phoneNumber,
      address: item.address,
      sourceFile: item.sourceFile,
      itemCount: Math.max(1, Math.floor(Number(item.itemCount) || 1)),
    }));

    // Perform batch import through the store
    await salesStore.importCODSales(salesItems, (completedCount, totalItems) => {
      const progressEl = document.getElementById("batch-progress");
      if (progressEl) {
        progressEl.textContent = `Processing: ${completedCount} / ${totalItems}`;
      }
    });

    // Success & Redirect
    await Swal.fire({
      icon: "success",
      title: "บันทึกสำเร็จ! (COD Import Successful)",
      text: `บันทึกยอดขาย ${previewItems.value.length} รายการ (${totalItemCount.value} ตัว) เรียบร้อยแล้ว`,
      timer: 2000,
      showConfirmButton: false,
    });

    clearData();
    router.push("/");
  } catch (error) {
    console.error("Firebase save error:", error);
    Swal.fire({
      icon: "error",
      title: "บันทึกไม่สำเร็จ",
      text: `เกิดข้อผิดพลาด: ${error.message}`,
    });
  } finally {
    isSaving.value = false;
  }
};

// --- UTILS ---

const parseDateFromFilename = (filename) => {
  const firstPart = filename.split("_")[0];
  if (!firstPart || firstPart.length !== 8 || isNaN(Number(firstPart)))
    return null;

  const year = parseInt(firstPart.substring(0, 4));
  const month = parseInt(firstPart.substring(4, 6)) - 1;
  const day = parseInt(firstPart.substring(6, 8));

  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  return date;
};

const clearData = () => {
  previewItems.value = [];
  processedFilesCount.value = 0;
  activeFilter.value = "all";
};

const formatDate = formatThaiDateOptionalTime;

// --- COMPUTED PROPERTIES ---

const totalAmount = computed(() => {
  return previewItems.value.reduce((sum, item) => sum + (item.amount || 0), 0);
});

const totalItemCount = computed(() => {
  return previewItems.value.reduce(
    (sum, item) => sum + (Number(item.itemCount) || 1),
    0
  );
});

const manualEditedCount = computed(() => {
  return previewItems.value.filter((item) => item.isManualEdit).length;
});

const autoCount = computed(() => {
  return previewItems.value.filter((item) => !item.isManualEdit).length;
});

const highValueCount = computed(() => {
  return previewItems.value.filter((item) => (Number(item.amount) || 0) >= 150).length;
});

const totalEstimatedOverhead = computed(() => {
  if (!expenseStore.autoOverheadEnabled || expenseStore.autoOverheadRate <= 0) return 0;
  return totalItemCount.value * expenseStore.autoOverheadRate;
});

const filteredPreviewItems = computed(() => {
  if (activeFilter.value === "manual") {
    return previewItems.value.filter((i) => i.isManualEdit);
  }
  if (activeFilter.value === "auto") {
    return previewItems.value.filter((i) => !i.isManualEdit);
  }
  if (activeFilter.value === "highValue") {
    return previewItems.value.filter((i) => (Number(i.amount) || 0) >= 150);
  }
  return previewItems.value;
});

const hasInvalidDates = computed(() => {
  return previewItems.value.some(
    (item) => !item.date || isNaN(new Date(item.date).getTime()),
  );
});
</script>
