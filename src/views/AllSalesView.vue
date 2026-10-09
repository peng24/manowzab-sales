<template>
  <div class="container mx-auto max-w-7xl py-1 md:py-2">
    <!-- 1. Header -->
    <div
      class="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center"
    >
      <div class="flex items-center gap-4">
        <!-- Back Button -->
        <button
          @click="router.push('/')"
          aria-label="กลับสู่หน้าหลัก"
          class="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden"
        >
          <ArrowLeft class="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-800">ประวัติยอดขายทั้งหมด</h1>
          <p class="text-gray-500">
            จัดการรายการขาย ตรวจสอบย้อนหลัง และปรับแก้จำนวนตัว (Item Count) เพื่อคิดต้นทุนแฝง
          </p>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center gap-3">
        <button
          v-if="sales.length > 0"
          type="button"
          @click="openBatchModal"
          class="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-indigo-700 hover:to-blue-700 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
          title="คำนวณจำนวนตัวย้อนหลังจากยอดขายอัตโนมัติ"
        >
          <Zap class="h-4 w-4" aria-hidden="true" />
          <span>คำนวณจำนวนตัวย้อนหลัง (Auto-Estimate)</span>
        </button>
      </div>
    </div>

    <!-- 2. The Super Filter Bar -->
    <div class="mb-6 rounded-xl bg-white shadow-sm border border-gray-200 p-4">
      <div class="flex flex-col gap-4">
        <!-- Filter Mode Dropdown -->
        <div
          class="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
        >
          <label for="filter-mode-select" class="text-sm font-medium text-gray-700 sm:w-32"
            >โหมดการกรอง:</label
          >
          <select
            id="filter-mode-select"
            v-model="filterMode"
            @change="onFilterModeChange"
            aria-label="เลือกโหมดการกรองข้อมูล"
            class="flex-1 rounded-lg border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">ทั้งหมด (All Time)</option>
            <option value="custom">กำหนดช่วงวัน (Custom Range)</option>
            <option value="month">รายเดือน (Specific Month)</option>
            <option value="year">รายปี (Specific Year)</option>
          </select>
        </div>

        <!-- Payment Type Filter (COD / Transfer) -->
        <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <label class="text-sm font-medium text-gray-700 sm:w-32">ประเภทรายการ:</label>
          <div class="flex flex-wrap items-center gap-2 flex-1">
            <button
              type="button"
              @click="typeFilter = 'all'"
              class="px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-500"
              :class="typeFilter === 'all' ? 'bg-slate-800 text-white border-slate-800 shadow-xs' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            >
              ทั้งหมด (All)
            </button>
            <button
              type="button"
              @click="typeFilter = 'COD'"
              class="px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-500"
              :class="typeFilter === 'COD' ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-200' : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'"
            >
              <span>📦 เก็บเงินปลายทาง (COD)</span>
              <span v-if="sales.length > 0" class="text-[11px] font-normal opacity-90">({{ codCount }})</span>
            </button>
            <button
              type="button"
              @click="typeFilter = 'Transfer'"
              class="px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-500"
              :class="typeFilter === 'Transfer' ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-200' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'"
            >
              <span>💳 โอนเงิน (Transfer)</span>
              <span v-if="sales.length > 0" class="text-[11px] font-normal opacity-90">({{ transferCount }})</span>
            </button>
          </div>
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
              <div class="relative">
                <input
                  type="date"
                  v-model="customStartDate"
                  aria-label="วันที่เริ่มต้น"
                  class="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-10"
                  @click="
                    $event.target.showPicker ? $event.target.showPicker() : null
                  "
                />
                <div
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm flex items-center justify-between font-medium text-gray-900 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                >
                  <span>{{ formatThaiDateDisplay(customStartDate) }}</span>
                  <Calendar class="h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>
            <div class="flex-1">
              <label class="block text-xs text-gray-500 mb-1"
                >วันที่สิ้นสุด</label
              >
              <div class="relative">
                <input
                  type="date"
                  v-model="customEndDate"
                  aria-label="วันที่สิ้นสุด"
                  class="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-10"
                  @click="
                    $event.target.showPicker ? $event.target.showPicker() : null
                  "
                />
                <div
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm flex items-center justify-between font-medium text-gray-900 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                >
                  <span>{{ formatThaiDateDisplay(customEndDate) }}</span>
                  <Calendar class="h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>

          <!-- Month Selector -->
          <div
            v-if="filterMode === 'month'"
            class="flex-1 flex flex-col sm:flex-row gap-3"
          >
            <select
              v-model="selectedMonth"
              aria-label="เลือกเดือน"
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
              aria-label="เลือกปี พ.ศ."
              class="flex-1 rounded-lg border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option v-for="year in yearRange" :key="year" :value="year">
                พ.ศ. {{ year + 543 }}
              </option>
            </select>
          </div>

          <!-- Year Selector -->
          <div v-if="filterMode === 'year'" class="flex-1">
            <select
              v-model="selectedYear"
              aria-label="เลือกปี พ.ศ."
              class="w-full rounded-lg border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option v-for="year in yearRange" :key="year" :value="year">
                พ.ศ. {{ year + 543 }}
              </option>
            </select>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 justify-end">
          <button
            @click="handleSearch"
            class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden"
          >
            ค้นหา
          </button>
          <button
            @click="handleReset"
            class="px-6 py-2 bg-gray-500 text-white font-medium rounded-lg shadow-sm hover:bg-gray-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:outline-hidden"
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
            <p class="text-3xl font-bold text-violet-600">
              ฿{{ formatCurrency(totalSales) }}
            </p>
          </div>
          <div
            class="h-12 w-12 bg-violet-100 rounded-full flex items-center justify-center"
            aria-hidden="true"
          >
            <Wallet class="h-6 w-6 text-violet-600" />
          </div>
        </div>
      </div>

      <!-- Total Orders & Item Count -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 mb-1">จำนวนออเดอร์ & ตัว</p>
            <div class="flex items-baseline gap-2">
              <p class="text-3xl font-bold text-gray-700">{{ totalOrders }}</p>
              <span class="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {{ totalItems.toLocaleString() }} ตัว
              </span>
            </div>
            <!-- Estimated Overhead Cost -->
            <div
              v-if="expenseStore.autoOverheadEnabled && expenseStore.autoOverheadRate > 0"
              class="mt-2 text-xs font-semibold text-rose-600 flex items-center gap-1"
            >
              <span>🏷️ ต้นทุนแฝง:</span>
              <span>฿{{ formatCurrency(totalItems * expenseStore.autoOverheadRate) }}</span>
              <span class="text-[11px] font-normal text-rose-400">(@฿{{ expenseStore.autoOverheadRate }})</span>
            </div>
          </div>
          <div
            class="h-12 w-12 bg-slate-200 rounded-full flex items-center justify-center"
            aria-hidden="true"
          >
            <ShoppingBag class="h-6 w-6 text-slate-600" />
          </div>
        </div>
      </div>

      <!-- Transfer vs COD -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p class="text-sm font-medium text-gray-500 mb-3">สัดส่วนประเภท</p>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">โอนเงิน:</span>
            <span class="text-sm font-semibold text-blue-600"
              >฿{{ formatCurrency(transferAmount) }}</span
            >
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">COD:</span>
            <span class="text-sm font-semibold text-amber-600"
              >฿{{ formatCurrency(codAmount) }}</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Sales Table Section with Search & Quick Filters -->
    <div
      class="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden"
    >
      <!-- Sub-toolbar: Search & Count filter -->
      <div
        v-if="sales.length > 0"
        class="border-b border-gray-200 bg-gray-50/70 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
      >
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <input
            type="text"
            v-model="searchQuery"
            aria-label="ค้นหา Order No, ชื่อลูกค้า, หรือเบอร์โทร"
            placeholder="ค้นหา Order No, ชื่อลูกค้า, หรือเบอร์โทร..."
            class="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-8 py-2 text-xs shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            aria-label="ล้างคำค้นหา"
            class="absolute right-3 top-2 text-xs text-gray-500 hover:text-gray-700 p-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Filter Groups -->
        <div class="flex flex-wrap items-center gap-2.5 text-xs">
          <!-- Type Filter Group -->
          <div class="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
            <span class="text-gray-600 text-[11px] px-1 font-semibold">ประเภท:</span>
            <button
              type="button"
              @click="typeFilter = 'all'"
              class="px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-500"
              :class="typeFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'"
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              @click="typeFilter = 'COD'"
              class="px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-amber-500"
              :class="typeFilter === 'COD' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-800 hover:bg-amber-50'"
            >
              <span>COD</span>
              <span class="text-[10px] px-1 rounded-full font-bold" :class="typeFilter === 'COD' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'">
                {{ codCount }}
              </span>
            </button>
            <button
              type="button"
              @click="typeFilter = 'Transfer'"
              class="px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-blue-500"
              :class="typeFilter === 'Transfer' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-800 hover:bg-blue-50'"
            >
              <span>โอนเงิน</span>
              <span class="text-[10px] px-1 rounded-full font-bold" :class="typeFilter === 'Transfer' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'">
                {{ transferCount }}
              </span>
            </button>
          </div>

          <!-- Item Count Filter Group -->
          <div class="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
            <span class="text-gray-600 text-[11px] px-1 font-semibold">จำนวน:</span>
            <button
              type="button"
              @click="countFilter = 'all'"
              class="px-2 py-1 rounded-lg font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-500"
              :class="countFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'"
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              @click="countFilter = 'one'"
              class="px-2 py-1 rounded-lg font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
              :class="countFilter === 'one' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700 hover:bg-blue-50'"
            >
              1 ตัว ({{ oneItemCount }})
            </button>
            <button
              type="button"
              @click="countFilter = 'multi'"
              class="px-2 py-1 rounded-lg font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
              :class="countFilter === 'multi' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-700 hover:bg-indigo-50'"
            >
              ≥ 2 ตัว ({{ multiItemCount }})
            </button>
            <button
              type="button"
              @click="countFilter = 'verified'"
              class="px-2 py-1 rounded-lg font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
              :class="countFilter === 'verified' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'"
              title="รายการที่บันทึกยืนยันจำนวนตัวแล้ว"
            >
              ✓ บันทึกแล้ว ({{ verifiedCount }})
            </button>
            <button
              type="button"
              @click="countFilter = 'unverified'"
              class="px-2 py-1 rounded-lg font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
              :class="countFilter === 'unverified' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'"
              title="รายการที่ยังไม่เคยระบุ/ยืนยันจำนวนตัว"
            >
              ⏳ ยังไม่ระบุ ({{ unverifiedCount }})
            </button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                วันที่
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                Order No.
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                ชื่อลูกค้า
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider whitespace-nowrap bg-indigo-50/50"
              >
                จำนวน (ตัว)
                <span class="block text-[10px] font-normal text-indigo-500">
                  คลิก +/- หรือเลขเพื่อแก้
                </span>
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                ยอดเงิน
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                ประเภท
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="7" class="px-6 py-10 text-center text-gray-500">
                กำลังโหลดข้อมูล...
              </td>
            </tr>
            <tr v-else-if="filteredSales.length === 0">
              <td colspan="7" class="px-6 py-10 text-center text-gray-500">
                ไม่พบรายการขายที่ตรงกับเงื่อนไข
              </td>
            </tr>
            <tr
              v-for="sale in paginatedSales"
              :key="sale.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <!-- Date -->
              <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                {{ formatDate(sale.dateTime) }}
              </td>

              <!-- Order No -->
              <td
                class="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-900 font-mono"
              >
                {{ sale.orderNo || "-" }}
              </td>

              <!-- Customer -->
              <td class="px-4 py-3 whitespace-nowrap text-xs">
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
                <span v-else class="text-gray-400">ไม่ระบุ</span>
              </td>

              <!-- Item Count (Interactive Inline Stepper & Click-to-edit) -->
              <td class="px-4 py-2.5 whitespace-nowrap text-center bg-indigo-50/20">
                <div class="inline-flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-2xs">
                  <!-- Decrement button -->
                  <button
                    type="button"
                    @click.stop="quickStepItem(sale, -1)"
                    :disabled="(Number(sale.itemCount) || 1) <= 1 || savingItemIds.has(sale.id)"
                    :aria-label="'ลดจำนวน 1 ตัว สำหรับ Order ' + (sale.orderNo || 'นี้')"
                    class="h-6 w-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                    title="ลดจำนวน 1 ตัว"
                  >
                    -
                  </button>

                  <!-- Number button (click to open quick selection popover/modal) -->
                  <button
                    type="button"
                    @click.stop="openQuickCountModal(sale)"
                    :disabled="savingItemIds.has(sale.id)"
                    :aria-label="'จำนวน ' + (sale.itemCount || 1) + ' ตัว สำหรับ Order ' + (sale.orderNo || 'นี้') + (isItemVerified(sale) ? ' (บันทึกแล้ว คลิกเพื่อแก้ไข)' : ' (ยังไม่ได้ระบุ คลิกเพื่อบันทึก)')"
                    class="px-2.5 py-0.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 group shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                    :class="
                      isItemVerified(sale)
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 ring-1 ring-emerald-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-dashed border-gray-300'
                    "
                    :title="isItemVerified(sale) ? 'บันทึกจำนวนตัวแล้ว (คลิกเพื่อแก้ไข)' : 'ยังไม่ได้ระบุ/ยืนยัน (คลิกเพื่อบันทึก)'"
                  >
                    <span v-if="savingItemIds.has(sale.id)" class="inline-block animate-spin text-[10px]" aria-hidden="true">⌛</span>
                    <span v-else-if="isItemVerified(sale)" class="text-[11px] font-black text-emerald-600" aria-hidden="true">✓</span>
                    <span class="font-black">{{ sale.itemCount || 1 }}</span>
                    <span class="text-[10px] font-normal" :class="isItemVerified(sale) ? 'text-emerald-700' : 'text-gray-500'">ตัว</span>
                  </button>

                  <!-- Increment button -->
                  <button
                    type="button"
                    @click.stop="quickStepItem(sale, 1)"
                    :disabled="savingItemIds.has(sale.id)"
                    :aria-label="'เพิ่มจำนวน 1 ตัว สำหรับ Order ' + (sale.orderNo || 'นี้')"
                    class="h-6 w-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center transition-colors disabled:opacity-25 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                    title="เพิ่มจำนวน 1 ตัว"
                  >
                    +
                  </button>
                </div>
              </td>

              <!-- Amount -->
              <td
                class="px-4 py-3 whitespace-nowrap text-right text-xs font-bold text-gray-900"
              >
                ฿{{ formatCurrency(sale.amount) }}
              </td>

              <!-- Type -->
              <td class="px-4 py-3 whitespace-nowrap text-center">
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  :class="{
                    'bg-amber-100 text-amber-800': sale.type === 'COD',
                    'bg-blue-100 text-blue-800': sale.type !== 'COD',
                  }"
                >
                  {{ sale.type === "COD" ? "COD" : "โอนเงิน" }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-4 py-3 whitespace-nowrap text-right text-xs">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    @click="openEditModal(sale)"
                    :aria-label="'แก้ไขรายการ ' + (sale.orderNo || 'นี้')"
                    class="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-hidden"
                    title="แก้ไขรายการทั้งหมด"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3 w-3 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    แก้ไข
                  </button>
                  <button
                    @click="deleteSale(sale)"
                    :aria-label="'ลบรายการ ' + (sale.orderNo || 'นี้')"
                    class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-hidden"
                    title="ลบรายการ"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3 w-3 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    ลบ
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div
        v-if="filteredSales.length > 0"
        class="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-3"
      >
        <div class="text-xs text-gray-700">
          แสดง {{ filteredSales.length > 0 ? startIndex + 1 : 0 }}-{{ endIndex }} จาก {{ filteredSales.length }} รายการ
          <span v-if="searchQuery || countFilter !== 'all'" class="text-gray-500">
            (กรองจากทั้งหมด {{ sales.length }} รายการ)
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            aria-label="ไปหน้าก่อนหน้า"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden"
          >
            ก่อนหน้า
          </button>
          <div class="px-3 py-1.5 text-xs font-bold text-gray-700" aria-current="page">
            หน้า {{ currentPage }} / {{ totalPages }}
          </div>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            aria-label="ไปหน้าถัดไป"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>

    <!-- 5. Quick Count Modal (คลิกที่เลขจำนวนตัวในตาราง) -->
    <Teleport to="body">
      <div
        v-if="showQuickModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-modal-title"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-xs"
          @click="showQuickModal = false"
          aria-hidden="true"
        ></div>
        <div
          class="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-fade-in-up"
        >
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 id="quick-modal-title" class="text-base font-bold text-gray-800">
                ปรับจำนวนตัว
              </h3>
              <p class="text-xs text-gray-500 font-mono">
                Order: {{ quickModalSale?.orderNo || '-' }}
              </p>
            </div>
            <button
              type="button"
              @click="showQuickModal = false"
              aria-label="ปิดหน้าต่างปรับจำนวนตัว"
              class="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
            >
              ✕
            </button>
          </div>

          <!-- Customer info & amount -->
          <div class="mb-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 flex justify-between items-center">
            <div>
              <span class="text-gray-500">ลูกค้า:</span>
              <span class="font-medium text-gray-800 ml-1">{{ quickModalSale?.customerName || 'ไม่ระบุ' }}</span>
            </div>
            <div class="font-bold text-amber-600">
              ฿{{ formatCurrency(quickModalSale?.amount) }}
            </div>
          </div>

          <form @submit.prevent="saveQuickCountModal">
            <!-- Stepper & Input -->
            <div class="mb-4 flex items-center justify-center gap-3">
              <button
                type="button"
                @click="quickModalCount = Math.max(1, quickModalCount - 1); focusQuickInput()"
                :disabled="quickModalCount <= 1"
                aria-label="ลดจำนวน 1 ตัว"
                class="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-lg flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
              >
                -
              </button>
              <div class="relative w-28">
                <input
                  ref="quickCountInputRef"
                  type="number"
                  min="1"
                  aria-label="ระบุจำนวนตัว"
                  v-model.number="quickModalCount"
                  @keydown.enter.prevent="saveQuickCountModal"
                  class="w-full h-11 text-center text-xl font-black rounded-xl border border-gray-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
                <span class="absolute right-2 top-3 text-xs text-gray-400 pointer-events-none" aria-hidden="true">ตัว</span>
              </div>
              <button
                type="button"
                @click="quickModalCount++; focusQuickInput()"
                aria-label="เพิ่มจำนวน 1 ตัว"
                class="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-lg flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
              >
                +
              </button>
            </div>

            <!-- Quick Pills (1-10) -->
            <div class="mb-4 flex flex-wrap items-center justify-center gap-1.5">
              <button
                v-for="num in [1, 2, 3, 4, 5, 6, 8, 10]"
                :key="num"
                type="button"
                :aria-label="'เลือกจำนวน ' + num + ' ตัว'"
                @click="quickModalCount = num; focusQuickInput()"
                class="h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                :class="
                  quickModalCount === num
                    ? 'bg-indigo-600 text-white shadow-xs font-black ring-2 ring-indigo-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                "
              >
                {{ num }}
              </button>
            </div>

            <!-- Overhead hint -->
            <div
              v-if="expenseStore.autoOverheadEnabled && expenseStore.autoOverheadRate > 0"
              class="mb-5 text-center text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg"
            >
              🏷️ ต้นทุนแฝงออเดอร์นี้: ฿{{ ((quickModalCount || 1) * expenseStore.autoOverheadRate).toFixed(2) }} (฿{{ expenseStore.autoOverheadRate }}/ตัว)
            </div>

            <div class="flex gap-2">
              <button
                type="button"
                @click="showQuickModal = false"
                class="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:outline-hidden"
              >
                ยกเลิก (Esc)
              </button>
              <button
                type="button"
                @click="resetQuickCountModal"
                class="flex-1 rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-hidden"
                title="รีเซ็ตค่ากลับเป็น 1 ตัว และคืนสถานะยังไม่ระบุ"
              >
                <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />
                <span>รีเซ็ตค่า</span>
              </button>
              <button
                type="submit"
                class="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
              >
                <span>บันทึก (Enter)</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- 6. Batch Auto-Estimate Modal (คำนวณย้อนหลังทั้งชุด) -->
    <Teleport to="body">
      <div
        v-if="showBatchModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-modal-title"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-xs"
          @click="showBatchModal = false"
          aria-hidden="true"
        ></div>
        <div
          class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-fade-in-up"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center" aria-hidden="true">
                <Zap class="h-5 w-5" />
              </div>
              <div>
                <h3 id="batch-modal-title" class="text-lg font-bold text-gray-800">คำนวณจำนวนตัวย้อนหลังอัตโนมัติ</h3>
                <p class="text-xs text-gray-500">ช่วยปรับยอดจำนวนตัว (itemCount) จากยอดขาย ÷ ราคาเฉลี่ย</p>
              </div>
            </div>
            <button
              type="button"
              @click="showBatchModal = false"
              aria-label="ปิดหน้าต่างคำนวณย้อนหลัง"
              class="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
            >
              ✕
            </button>
          </div>

          <div class="space-y-4">
            <!-- Price setting -->
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1.5">
                เลือกราคาเฉลี่ยต่อตัวสำหรับคำนวณ:
              </label>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-for="p in [20, 50, 60, 80]"
                  :key="p"
                  type="button"
                  @click="batchAvgPrice = p"
                  class="px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
                  :class="
                    batchAvgPrice === p
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  "
                >
                  ฿{{ p }} {{ p === 50 ? '(เริ่มต้น)' : '' }}
                </button>
                <div class="flex items-center gap-1 ml-1">
                  <input
                    type="number"
                    min="1"
                    aria-label="ระบุราคาเฉลี่ยต่อตัวเอง"
                    v-model.number="batchAvgPrice"
                    class="w-16 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-center font-bold text-gray-800 focus:outline-none focus:border-indigo-500"
                  />
                  <span class="text-xs text-gray-500">฿/ตัว</span>
                </div>
              </div>
            </div>

            <!-- Scope Selection -->
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1.5">
                ขอบเขตรายการที่จะอัปเดต:
              </label>
              <div class="space-y-2">
                <label
                  class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                  :class="batchScope === 'onesOnly' ? 'bg-indigo-50/70 border-indigo-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'"
                >
                  <input
                    type="radio"
                    v-model="batchScope"
                    value="onesOnly"
                    class="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p class="text-xs font-bold text-gray-800">
                      เฉพาะรายการที่มี 1 ตัว หรือยังไม่ระบุ (แนะนำ)
                    </p>
                    <p class="text-[11px] text-gray-500">
                      ปลอดภัย ไม่ทับรายการที่คุณเคยปรับแต่งเองไว้แล้ว
                    </p>
                  </div>
                </label>

                <label
                  class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                  :class="batchScope === 'all' ? 'bg-indigo-50/70 border-indigo-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'"
                >
                  <input
                    type="radio"
                    v-model="batchScope"
                    value="all"
                    class="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p class="text-xs font-bold text-gray-800">
                      คำนวณใหม่ทุกรายการที่แสดงผลอยู่ ({{ sales.length }} รายการ)
                    </p>
                    <p class="text-[11px] text-gray-500">
                      รีเซ็ตและคำนวณใหม่ทั้งหมดตามราคาเฉลี่ย
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Preview Card -->
            <div class="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs space-y-2">
              <div class="flex justify-between items-center text-slate-700">
                <span>รายการที่จะได้รับการปรับปรุง:</span>
                <span class="font-bold text-slate-900">{{ batchTargetItems.length }} รายการ</span>
              </div>
              <div class="flex justify-between items-center text-slate-700">
                <span>ยอดจำนวนตัวเดิม:</span>
                <span class="font-bold text-gray-600">{{ totalItems.toLocaleString() }} ตัว</span>
              </div>
              <div class="flex justify-between items-center text-indigo-800 pt-2 border-t border-slate-200">
                <span class="font-bold">ประมาณการยอดจำนวนตัวใหม่:</span>
                <span class="font-black text-indigo-600 text-sm">~{{ batchPreviewNewTotalItems.toLocaleString() }} ตัว</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                @click="showBatchModal = false"
                class="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:outline-hidden"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                @click="executeBatchCalculation"
                :disabled="isBatchSaving || batchTargetItems.length === 0"
                class="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
              >
                <Zap class="h-4 w-4" aria-hidden="true" />
                <span>ยืนยันและอัปเดตข้อมูล</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 7. Edit Modal (แก้ไขรายการขายเดิม) -->
    <Teleport to="body">
      <div
        v-if="showModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="closeModal"
          aria-hidden="true"
        ></div>
        <div
          class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-fade-in-up"
        >
          <div class="flex items-center justify-between mb-6">
            <h3 id="edit-modal-title" class="text-lg font-bold text-gray-800">แก้ไขรายการขาย</h3>
            <button
              type="button"
              @click="closeModal"
              aria-label="ปิดหน้าต่างแก้ไขรายการขาย"
              class="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveEdit" class="space-y-4">
            <!-- Date & Time (Thai Pickers) -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="block text-sm font-semibold text-gray-700">วันที่</label>
                <ThaiDatePicker v-model="editForm.date" />
              </div>
              <div class="space-y-1">
                <label class="block text-sm font-semibold text-gray-700">เวลา</label>
                <ThaiTimePicker v-model="editForm.time" />
              </div>
            </div>

            <!-- Customer Name -->
            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-700"
                >ชื่อลูกค้า</label
              >
              <input
                type="text"
                v-model="editForm.customerName"
                aria-label="ชื่อลูกค้า"
                required
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>

            <!-- Amount & Item Count -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Amount -->
              <div class="space-y-1">
                <label class="block text-sm font-medium text-gray-700"
                  >ยอดเงิน (บาท)</label
                >
                <input
                  type="number"
                  v-model.number="editForm.amount"
                  aria-label="ยอดเงิน (บาท)"
                  step="0.01"
                  min="0"
                  required
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>

              <!-- Item Count with Stepper & Overhead Hint -->
              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <label class="block text-sm font-medium text-gray-700">
                    จำนวนตัว (ตัว)
                  </label>
                  <span
                    v-if="expenseStore.autoOverheadEnabled && expenseStore.autoOverheadRate > 0"
                    class="text-xs font-semibold text-rose-600"
                  >
                    แฝง: ฿{{ ((Math.max(1, Number(editForm.itemCount) || 1)) * expenseStore.autoOverheadRate).toFixed(2) }}
                  </span>
                </div>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    @click="editForm.itemCount = Math.max(1, (Number(editForm.itemCount) || 1) - 1)"
                    :disabled="editForm.itemCount <= 1"
                    aria-label="ลดจำนวน 1 ตัว"
                    class="h-9 w-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-base flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden"
                  >
                    -
                  </button>
                  <div class="relative flex-1 rounded-md shadow-xs">
                    <input
                      type="number"
                      v-model.number="editForm.itemCount"
                      step="1"
                      min="1"
                      aria-label="จำนวนตัว (ตัว)"
                      required
                      class="w-full rounded-lg border-gray-300 pr-9 shadow-xs focus:border-blue-500 focus:ring-blue-500 text-sm font-bold text-center"
                    />
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                      <span class="text-gray-500 text-xs" aria-hidden="true">ตัว</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="editForm.itemCount = (Number(editForm.itemCount) || 1) + 1"
                    aria-label="เพิ่มจำนวน 1 ตัว"
                    class="h-9 w-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-base flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden"
                  >
                    +
                  </button>
                </div>

                <!-- Quick pills in Edit modal -->
                <div class="flex items-center gap-1 pt-1">
                  <span class="text-[11px] text-gray-500 font-semibold">ด่วน:</span>
                  <button
                    v-for="num in [1, 2, 3, 4, 5, 6]"
                    :key="num"
                    type="button"
                    :aria-label="'เลือกจำนวน ' + num + ' ตัว'"
                    @click="editForm.itemCount = num"
                    class="px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                    :class="editForm.itemCount === num ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                  >
                    {{ num }}
                  </button>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:outline-hidden"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
// Icons
import { Wallet, ShoppingBag, ArrowLeft, Calendar, Search, Zap, RotateCcw } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import Swal from "sweetalert2";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { formatThaiDateTime, formatThaiDate, toDate } from "../utils/dateUtils.js";
import { formatCurrency } from "../utils/formatUtils.js";
import { useSalesStore } from "../stores/salesStore.js";
import { useExpenseStore } from "../stores/expenseStore.js";
import ThaiDatePicker from "../components/ThaiDatePicker.vue";
import ThaiTimePicker from "../components/ThaiTimePicker.vue";

// Services
import {
  getAllSales,
  updateSale,
  deleteSale as deleteSaleService,
} from "../services/salesService.js";

const router = useRouter();
const salesStore = useSalesStore();
const expenseStore = useExpenseStore();

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

// Search & Filter State
const searchQuery = ref("");
const typeFilter = ref("all"); // 'all', 'COD', 'Transfer'
const countFilter = ref("all"); // 'all', 'one', 'multi', 'verified', 'unverified'

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
  itemCount: 1,
});

// Quick Count Modal (Single Item)
const showQuickModal = ref(false);
const quickModalSale = ref(null);
const quickModalCount = ref(1);

// Saving state per item id (Set of IDs currently updating)
const savingItemIds = ref(new Set());

// Batch Modal State (Auto-Estimate Retroactive)
const showBatchModal = ref(false);
const batchAvgPrice = ref(50);
const batchScope = ref("onesOnly"); // 'onesOnly' | 'all'
const isBatchSaving = ref(false);

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

// Helper: Check if a sale's item count has been verified / saved
const isItemVerified = (sale) => {
  return sale.isItemCountSet === true || (Number(sale.itemCount) || 1) > 1;
};

// --- Computed Properties ---

// Summary Statistics
const salesStats = computed(() => {
  return sales.value.reduce(
    (acc, sale) => {
      const amt = Number(sale.amount) || 0;
      const items = Number(sale.itemCount) > 0 ? Number(sale.itemCount) : 1;
      acc.totalSales += amt;
      acc.totalOrders += 1;
      acc.totalItems += items;
      if (sale.type === "COD") {
        acc.codAmount += amt;
        acc.codCount += 1;
      } else {
        acc.transferAmount += amt;
        acc.transferCount += 1;
      }
      if (items === 1) {
        acc.oneItemCount += 1;
      } else {
        acc.multiItemCount += 1;
      }
      if (isItemVerified(sale)) {
        acc.verifiedCount += 1;
      } else {
        acc.unverifiedCount += 1;
      }
      return acc;
    },
    {
      totalSales: 0,
      totalOrders: 0,
      totalItems: 0,
      transferAmount: 0,
      codAmount: 0,
      transferCount: 0,
      codCount: 0,
      oneItemCount: 0,
      multiItemCount: 0,
      verifiedCount: 0,
      unverifiedCount: 0,
    }
  );
});

const totalSales = computed(() => salesStats.value.totalSales);
const totalOrders = computed(() => salesStats.value.totalOrders);
const totalItems = computed(() => salesStats.value.totalItems);
const transferAmount = computed(() => salesStats.value.transferAmount);
const codAmount = computed(() => salesStats.value.codAmount);
const transferCount = computed(() => salesStats.value.transferCount);
const codCount = computed(() => salesStats.value.codCount);
const oneItemCount = computed(() => salesStats.value.oneItemCount);
const multiItemCount = computed(() => salesStats.value.multiItemCount);
const verifiedCount = computed(() => salesStats.value.verifiedCount);
const unverifiedCount = computed(() => salesStats.value.unverifiedCount);

// Filtered sales based on Search, Payment Type, & Item Count Filter
const filteredSales = computed(() => {
  let list = sales.value;

  // Search filter
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter((s) => {
      const name = (s.customerName || "").toLowerCase();
      const order = (s.orderNo || "").toLowerCase();
      const phone = (s.phoneNumber || "").toLowerCase();
      return name.includes(q) || order.includes(q) || phone.includes(q);
    });
  }

  // Payment Type Filter
  if (typeFilter.value === "COD") {
    list = list.filter((s) => s.type === "COD");
  } else if (typeFilter.value === "Transfer") {
    list = list.filter((s) => s.type !== "COD");
  }

  // Item Count Filter
  if (countFilter.value === "one") {
    list = list.filter((s) => (Number(s.itemCount) || 1) === 1);
  } else if (countFilter.value === "multi") {
    list = list.filter((s) => (Number(s.itemCount) || 1) > 1);
  } else if (countFilter.value === "verified") {
    list = list.filter((s) => isItemVerified(s));
  } else if (countFilter.value === "unverified") {
    list = list.filter((s) => !isItemVerified(s));
  } else if (countFilter.value === "cod") {
    list = list.filter((s) => s.type === "COD");
  } else if (countFilter.value === "transfer") {
    list = list.filter((s) => s.type !== "COD");
  }

  return list;
});

// Reset page on filter changes
watch([searchQuery, typeFilter, countFilter], () => {
  currentPage.value = 1;
});

// Pagination
const totalPages = computed(
  () => Math.ceil(filteredSales.value.length / itemsPerPage) || 1,
);

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);

const endIndex = computed(() => {
  const end = startIndex.value + itemsPerPage;
  return end > filteredSales.value.length ? filteredSales.value.length : end;
});

const paginatedSales = computed(() => {
  return filteredSales.value.slice(startIndex.value, endIndex.value);
});

// Batch calculation targets & preview
const batchTargetItems = computed(() => {
  if (batchScope.value === "onesOnly") {
    return sales.value.filter(
      (s) => !isItemVerified(s)
    );
  }
  return sales.value;
});

const batchPreviewItems = computed(() => {
  const price = batchAvgPrice.value > 0 ? batchAvgPrice.value : 50;
  return batchTargetItems.value.map((s) => {
    const amt = Number(s.amount) || 0;
    const estCount = Math.max(1, Math.round(amt / price));
    return {
      id: s.id,
      orderNo: s.orderNo,
      amount: amt,
      oldCount: Number(s.itemCount) || 1,
      newCount: estCount,
    };
  });
});

const batchPreviewNewTotalItems = computed(() => {
  const price = batchAvgPrice.value > 0 ? batchAvgPrice.value : 50;
  const targetIds = new Set(batchTargetItems.value.map((s) => s.id));
  return sales.value.reduce((sum, s) => {
    if (targetIds.has(s.id)) {
      const amt = Number(s.amount) || 0;
      const estCount = Math.max(1, Math.round(amt / price));
      return sum + estCount;
    }
    return sum + (Number(s.itemCount) || 1);
  }, 0);
});

// --- Methods ---

const onFilterModeChange = () => {
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
  searchQuery.value = "";
  typeFilter.value = "all";
  countFilter.value = "all";
  currentPage.value = 1;
  fetchSales();
};

const fetchSales = async () => {
  loading.value = true;
  sales.value = [];

  try {
    if (filterMode.value === "custom") {
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

    sales.value = await getAllSales({
      mode: filterMode.value,
      startDate: customStartDate.value ? new Date(customStartDate.value) : null,
      endDate: customEndDate.value ? new Date(customEndDate.value) : null,
      month: selectedMonth.value,
      year: selectedYear.value,
      limitCount: filterMode.value === "all" ? null : 300,
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

// --- INLINE ITEM COUNT STEPPER & QUICK EDIT ---

// (isItemVerified is defined above in helper section)

/**
 * Step item count directly from table cell (- or +)
 */
const quickStepItem = async (sale, step) => {
  const current = Number(sale.itemCount) || 1;
  const newCount = Math.max(1, current + step);
  if (newCount === current && sale.isItemCountSet) return;

  savingItemIds.value.add(sale.id);
  const originalCount = sale.itemCount;
  const originalSet = sale.isItemCountSet;
  sale.itemCount = newCount; // Optimistic update
  sale.isItemCountSet = true;

  try {
    await updateSale(sale.id, {
      itemCount: newCount,
      isItemCountSet: true,
    });
    salesStore.invalidateCache();

    // Show lightweight Toast
    const Toast = Swal.mixin({
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: false,
    });
    Toast.fire({
      icon: "success",
      title: `บันทึกเป็น ${newCount} ตัวเรียบร้อย`,
    });
  } catch (error) {
    console.error("Quick step error:", error);
    sale.itemCount = originalCount; // Rollback
    sale.isItemCountSet = originalSet;
    Swal.fire({
      icon: "error",
      title: "บันทึกไม่สำเร็จ",
      text: error.message,
    });
  } finally {
    savingItemIds.value.delete(sale.id);
  }
};

const quickCountInputRef = ref(null);

/**
 * Focus and highlight/select input text so user can immediately type a number
 */
const focusQuickInput = () => {
  nextTick(() => {
    if (quickCountInputRef.value) {
      quickCountInputRef.value.focus();
      quickCountInputRef.value.select();
    }
  });
};

/**
 * Open Quick Count selection modal for a specific sale
 */
const openQuickCountModal = (sale) => {
  quickModalSale.value = sale;
  quickModalCount.value = Number(sale.itemCount) || 1;
  showQuickModal.value = true;
  focusQuickInput();
};

/**
 * Save quick count from modal
 */
const saveQuickCountModal = async () => {
  if (!quickModalSale.value) return;
  const targetSale = quickModalSale.value;
  const newCount = Math.max(1, Math.floor(Number(quickModalCount.value) || 1));
  const originalCount = targetSale.itemCount;
  const originalSet = targetSale.isItemCountSet;

  showQuickModal.value = false;

  // Don't save only if it's already verified and the count didn't change
  if (newCount === (Number(targetSale.itemCount) || 1) && targetSale.isItemCountSet === true) {
    return;
  }

  savingItemIds.value.add(targetSale.id);
  targetSale.itemCount = newCount;
  targetSale.isItemCountSet = true; // Mark as verified/saved!

  try {
    await updateSale(targetSale.id, {
      itemCount: newCount,
      isItemCountSet: true,
    });
    salesStore.invalidateCache();

    const Toast = Swal.mixin({
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 1500,
    });
    Toast.fire({
      icon: "success",
      title: `บันทึก ${newCount} ตัวเรียบร้อย`,
    });
  } catch (error) {
    console.error("Quick count modal error:", error);
    targetSale.itemCount = originalCount;
    targetSale.isItemCountSet = originalSet;
    Swal.fire({
      icon: "error",
      title: "บันทึกไม่สำเร็จ",
      text: error.message,
    });
  } finally {
    savingItemIds.value.delete(targetSale.id);
  }
};

/**
 * Reset an item's count back to initial state (1 piece, unverified)
 */
const resetQuickCountModal = async () => {
  if (!quickModalSale.value) return;
  const targetSale = quickModalSale.value;
  showQuickModal.value = false;

  savingItemIds.value.add(targetSale.id);
  const originalCount = targetSale.itemCount;
  const originalSet = targetSale.isItemCountSet;

  // Optimistically reset
  targetSale.itemCount = 1;
  targetSale.isItemCountSet = false;

  try {
    await updateSale(targetSale.id, {
      itemCount: 1,
      isItemCountSet: false,
    });
    salesStore.invalidateCache();

    const Toast = Swal.mixin({
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 1500,
    });
    Toast.fire({
      icon: "info",
      title: "รีเซ็ตค่ากลับเป็น 1 ตัว (ยังไม่ระบุ) เรียบร้อย",
    });
  } catch (error) {
    console.error("Reset quick count modal error:", error);
    targetSale.itemCount = originalCount;
    targetSale.isItemCountSet = originalSet;
    Swal.fire({
      icon: "error",
      title: "รีเซ็ตไม่สำเร็จ",
      text: error.message,
    });
  } finally {
    savingItemIds.value.delete(targetSale.id);
  }
};

// --- BATCH AUTO-ESTIMATE (คำนวณย้อนหลังทั้งชุด) ---

const openBatchModal = () => {
  showBatchModal.value = true;
};

const executeBatchCalculation = async () => {
  const updates = batchPreviewItems.value.map((item) => ({
    id: item.id,
    itemCount: item.newCount,
  }));

  if (updates.length === 0) {
    Swal.fire({
      icon: "info",
      title: "ไม่มีรายการที่ต้องอัปเดต",
      text: "ไม่พบรายการที่ตรงกับเงื่อนไขที่เลือก",
    });
    return;
  }

  const confirmRes = await Swal.fire({
    title: "ยืนยันการคำนวณย้อนหลัง?",
    html: `ระบบจะอัปเดตจำนวนตัวของ <b>${updates.length}</b> รายการขาย<br>โดยคำนวณจากราคาเฉลี่ย <b>฿${batchAvgPrice.value}/ตัว</b> ยืนยันหรือไม่?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "ยืนยันและอัปเดต",
    cancelButtonText: "ยกเลิก",
    buttonsStyling: false,
    customClass: {
      confirmButton:
        "bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:bg-indigo-700 mx-2 cursor-pointer",
      cancelButton:
        "bg-gray-500 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:bg-gray-600 mx-2 cursor-pointer",
    },
  });

  if (!confirmRes.isConfirmed) return;

  isBatchSaving.value = true;

  Swal.fire({
    title: "กำลังอัปเดตข้อมูลย้อนหลัง...",
    html: `กำลังบันทึกจำนวนตัว ${updates.length} รายการ กรุณารอสักครู่...`,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    await salesStore.batchUpdateItemCounts(updates);

    // Update local sales state
    const updateMap = new Map(updates.map((u) => [u.id, u.itemCount]));
    sales.value.forEach((s) => {
      if (updateMap.has(s.id)) {
        s.itemCount = updateMap.get(s.id);
        s.isItemCountSet = true;
      }
    });

    showBatchModal.value = false;
    await Swal.fire({
      icon: "success",
      title: "อัปเดตข้อมูลย้อนหลังสำเร็จ!",
      text: `อัปเดตจำนวนตัวเรียบร้อยแล้วทั้งหมด ${updates.length} รายการ`,
      timer: 2000,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Batch update error:", error);
    Swal.fire({
      icon: "error",
      title: "อัปเดตไม่สำเร็จ",
      text: error.message,
    });
  } finally {
    isBatchSaving.value = false;
  }
};

// --- FULL EDIT MODAL CRUD ---

const deleteSale = async (item) => {
  const result = await Swal.fire({
    icon: "warning",
    title: "ยืนยันการลบ",
    html: `ต้องการลบรายการ <b>${item.orderNo || ""}</b><br>ลูกค้า: <b>${item.customerName || "ไม่ระบุ"}</b> ยอด ฿${formatCurrency(item.amount)}?`,
    showCancelButton: true,
    showDenyButton: false,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "ลบรายการ",
    cancelButtonText: "ยกเลิก",
  });

  if (result.isConfirmed) {
    try {
      await deleteSaleService(item.id);
      salesStore.invalidateCache();
      sales.value = sales.value.filter((s) => s.id !== item.id);
      Swal.fire({
        icon: "success",
        title: "ลบสำเร็จ",
        text: "ลบรายการเรียบร้อยแล้ว",
        timer: 1500,
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

const openEditModal = (item) => {
  editingId.value = item.id;

  let d = toDate(item.dateTime || item.date) || new Date();

  editForm.value = {
    date: format(d, "yyyy-MM-dd"),
    time: format(d, "HH:mm"),
    customerName: item.customerName || "",
    amount: item.amount || 0,
    itemCount: Number(item.itemCount) || 1,
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingId.value = null;
};

const saveEdit = async () => {
  try {
    const dateObj = parseISO(`${editForm.value.date}T${editForm.value.time}`);

    const updateData = {
      dateTime: dateObj,
      date: dateObj,
      customerName: editForm.value.customerName,
      amount: Number(editForm.value.amount),
      itemCount: Math.max(1, Math.floor(Number(editForm.value.itemCount) || 1)),
      isItemCountSet: true,
    };

    await updateSale(editingId.value, updateData);
    salesStore.invalidateCache();

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
const formatDate = formatThaiDateTime;
const formatThaiDateDisplay = (dateStr) => {
  if (!dateStr) return "เลือกวันที่";
  return formatThaiDate(new Date(dateStr));
};

// Keyboard accessibility: dismiss open modal on Escape key
const handleKeydown = (e) => {
  if (e.key === "Escape") {
    if (showQuickModal.value) {
      showQuickModal.value = false;
    } else if (showBatchModal.value) {
      showBatchModal.value = false;
    } else if (showModal.value) {
      closeModal();
    }
  }
};

// Init
onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  fetchSales();
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>
