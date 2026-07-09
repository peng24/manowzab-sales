<template>
  <div class="container mx-auto max-w-7xl px-4 py-8">
    <div
      class="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-800">
          ข้อมูลลูกค้า (Customers)
        </h1>
        <p class="text-gray-500">
          จัดการรายชื่อลูกค้า เบอร์โทร และที่อยู่จัดส่ง
        </p>
      </div>
      <div class="flex flex-wrap gap-2 w-full md:w-auto">
        <button
          @click="openMergeModal()"
          class="flex items-center rounded-lg bg-gray-150 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-200 border border-gray-300 transition-colors shadow-sm text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-1.5 text-gray-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"
            />
          </svg>
          รวมชื่อลูกค้า (Merge)
        </button>
        <button
          @click="openModal()"
          class="flex items-center rounded-lg bg-blue-600 px-4 py-2 font-bold text-white shadow-md hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-1.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clip-rule="evenodd"
            />
          </svg>
          เพิ่มลูกค้าใหม่
        </button>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="mb-6 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      <div class="relative max-w-md">
        <div
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="ค้นหาชื่อลูกค้า หรือเบอร์โทร..."
          class="block w-full rounded-lg border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>

    <!-- Customer Table -->
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
                ชื่อลูกค้า
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                เบอร์โทรศัพท์
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                ที่อยู่จัดส่ง
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                หมายเหตุ
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
              <td colspan="5" class="px-6 py-10 text-center text-gray-500">
                กำลังโหลดข้อมูล...
              </td>
            </tr>
            <tr v-else-if="filteredCustomers.length === 0">
              <td colspan="5" class="px-6 py-10 text-center text-gray-500">
                ไม่พบข้อมูลลูกค้า
              </td>
            </tr>
            <tr
              v-for="customer in filteredCustomers"
              :key="customer.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div
                    class="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold"
                  >
                    {{ customer.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="ml-4">
                    <router-link
                      :to="{
                        name: 'CustomerDetail',
                        params: { name: customer.name },
                      }"
                      class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {{ customer.name }}
                    </router-link>
                    <div class="text-xs text-gray-400">
                      อัปเดต: {{ formatDate(customer.lastUpdate) }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ customer.phoneNumber || "-" }}
              </td>
              <td
                class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate"
                :title="customer.address"
              >
                {{ customer.address || "-" }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                {{ customer.note || "-" }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openModal(customer)"
                    class="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                    title="แก้ไข"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3.5 w-3.5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
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
                    @click="deleteCustomer(customer)"
                    data-testid="delete-customer-btn"
                    :data-customer-id="customer.id"
                    class="inline-flex items-center rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                    title="ลบ"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3.5 w-3.5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    ลบ
                  </button>
                  <button
                    @click="openMergeModal(customer)"
                    class="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                    title="รวมชื่อ"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3.5 w-3.5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M8 7h12m0 0l-4-4m4 4l-4 4"
                      />
                    </svg>
                    รวมชื่อ
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Load More Button -->
      <div v-if="!searchQuery.trim() && customerStore.hasMore" class="mt-6 flex justify-center">
        <button
          @click="loadMoreCustomers"
          :disabled="loading"
          class="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <span v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></span>
          โหลดเพิ่มเติม (Load More)
        </button>
      </div>
    </div>

    <!-- Modal Form -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="closeModal"
        ></div>
        <div
          class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-fade-in-up"
        >
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-gray-800">
              {{ isEditing ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้าใหม่" }}
            </h3>
            <button
              @click="closeModal"
              class="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveCustomer" class="space-y-4">
            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-700"
                >ชื่อลูกค้า <span class="text-red-500">*</span></label
              >
              <input
                type="text"
                v-model="formData.name"
                :disabled="isEditing"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="ระบุชื่อลูกค้า (Unique)"
              />
              <p v-if="isEditing" class="text-xs text-gray-400">
                ชื่อลูกค้าไม่สามารถแก้ไขได้ (ใช้เป็น ID)
              </p>
            </div>

            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-700"
                >เบอร์โทรศัพท์</label
              >
              <input
                type="tel"
                v-model="formData.phoneNumber"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                placeholder="08x-xxx-xxxx"
              />
            </div>

            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-700"
                >ที่อยู่จัดส่ง</label
              >
              <textarea
                v-model="formData.address"
                rows="3"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                placeholder="บ้านเลขที่, ถนน, แขวง/เขต..."
              ></textarea>
            </div>

            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-700"
                >หมายเหตุ</label
              >
              <input
                type="text"
                v-model="formData.note"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                placeholder="Note เพิ่มเติม"
              />
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                @click="closeModal"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
              >
                {{ isEditing ? "บันทึกการแก้ไข" : "เพิ่มลูกค้า" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Merge Modal Form -->
    <Teleport to="body">
      <div
        v-if="showMergeModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="closeMergeModal"
        ></div>
        <div
          class="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl animate-fade-in-up"
        >
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-gray-800">
              รวมชื่อลูกค้า (Merge Customers)
            </h3>
            <button
              @click="closeMergeModal"
              class="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div class="space-y-6">
            <!-- Explain block -->
            <div class="rounded-lg bg-blue-50 p-4 border border-blue-200 text-sm text-blue-700">
              ระบบนี้ใช้รวมลูกค้าที่เป็นบุคคลเดียวกัน แต่บันทึกผิดชื่อเป็นหลายรายการ โดย
              <b class="text-blue-900">ลูกค้าต้นทาง (Source)</b> จะถูกลบออก และ
              <b class="text-blue-900">ประวัติการสั่งซื้อทั้งหมดจะถูกย้าย</b>
              ไปยังลูกค้าปลายทาง (Target) ข้อมูลการติดต่อของลูกค้าปลายทางจะได้รับการอัปเดตอัตโนมัติหากยังไม่มีข้อมูล
            </div>

            <!-- Merge Selection Controls -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <!-- Source Customer Dropdown Search -->
              <div class="space-y-1 relative">
                <label class="block text-sm font-semibold text-gray-700">
                  ลูกค้าต้นทาง (ย้ายและลบ) <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    type="text"
                    v-model="sourceSearch"
                    @focus="showSourceDropdown = true"
                    placeholder="ค้นหาชื่อลูกค้าต้นทาง..."
                    class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                  <!-- Dropdown options -->
                  <div
                    v-if="showSourceDropdown && filteredSourceOptions.length > 0"
                    class="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1"
                  >
                    <button
                      v-for="c in filteredSourceOptions"
                      :key="'src-' + c.id"
                      type="button"
                      @click="selectSource(c.name)"
                      class="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 text-gray-700 transition-colors block text-left"
                    >
                      {{ c.name }} <span class="text-xs text-gray-400" v-if="c.phoneNumber">({{ c.phoneNumber }})</span>
                    </button>
                  </div>
                  <div
                    v-else-if="showSourceDropdown"
                    class="absolute z-50 left-0 right-0 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg p-3 text-center text-sm text-gray-500"
                  >
                    ไม่พบข้อมูลลูกค้า
                  </div>
                </div>
                <div v-if="sourceProfile" class="mt-2 text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-200 space-y-1">
                  <div><b>เบอร์โทร:</b> {{ sourceProfile.phoneNumber || '-' }}</div>
                  <div class="truncate"><b>ที่อยู่:</b> {{ sourceProfile.address || '-' }}</div>
                  <div class="text-amber-600 font-medium">
                    <span v-if="loadingSalesCount">กำลังนับจำนวนรายการขาย...</span>
                    <span v-else>ตรวจพบรายการขายทั้งหมด: {{ sourceSalesCount }} รายการ</span>
                  </div>
                </div>
              </div>

              <!-- Target Customer Dropdown Search -->
              <div class="space-y-1 relative">
                <label class="block text-sm font-semibold text-gray-700">
                  ลูกค้าปลายทาง (เก็บไว้เป็นหลัก) <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    type="text"
                    v-model="targetSearch"
                    @focus="showTargetDropdown = true"
                    placeholder="ค้นหาชื่อลูกค้าปลายทาง..."
                    class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                  <!-- Dropdown options -->
                  <div
                    v-if="showTargetDropdown && filteredTargetOptions.length > 0"
                    class="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1"
                  >
                    <button
                      v-for="c in filteredTargetOptions"
                      :key="'tgt-' + c.id"
                      type="button"
                      @click="selectTarget(c.name)"
                      class="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 text-gray-700 transition-colors block text-left"
                    >
                      {{ c.name }} <span class="text-xs text-gray-400" v-if="c.phoneNumber">({{ c.phoneNumber }})</span>
                    </button>
                  </div>
                  <div
                    v-else-if="showTargetDropdown"
                    class="absolute z-50 left-0 right-0 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg p-3 text-center text-sm text-gray-500"
                  >
                    ไม่พบข้อมูลลูกค้า
                  </div>
                </div>
                <div v-if="targetProfile" class="mt-2 text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-200 space-y-1">
                  <div><b>เบอร์โทร:</b> {{ targetProfile.phoneNumber || '-' }}</div>
                  <div class="truncate"><b>ที่อยู่:</b> {{ targetProfile.address || '-' }}</div>
                  <div class="text-blue-600 font-medium">ข้อมูลลูกค้าที่จะคงไว้</div>
                </div>
              </div>
            </div>

            <!-- Click Outside Overlay logic to close dropdowns -->
            <div
              v-if="showSourceDropdown || showTargetDropdown"
              class="fixed inset-0 z-40 bg-transparent"
              @click="showSourceDropdown = false; showTargetDropdown = false;"
            ></div>

            <!-- Merged Preview Block -->
            <div v-if="sourceProfile && targetProfile" class="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
              <h4 class="text-sm font-bold text-gray-700 border-b border-gray-200 pb-2">
                ตัวอย่างข้อมูลหลังรวมสำเร็จ (Merged Preview)
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div class="space-y-1 bg-white p-3 rounded-lg border border-gray-150">
                  <div class="text-gray-400 font-medium">ชื่อลูกค้าหลักที่จะคงไว้:</div>
                  <div class="font-bold text-gray-800 text-sm">{{ targetProfile.name }}</div>
                  <div class="text-gray-400 font-medium mt-2">เบอร์โทรศัพท์:</div>
                  <div class="font-medium text-gray-800">{{ mergedTargetPreview.phoneNumber }}</div>
                </div>
                <div class="space-y-1 bg-white p-3 rounded-lg border border-gray-150">
                  <div class="text-gray-400 font-medium">ที่อยู่จัดส่ง:</div>
                  <div class="font-medium text-gray-800 leading-relaxed">{{ mergedTargetPreview.address }}</div>
                  <div class="text-gray-400 font-medium mt-2">หมายเหตุ:</div>
                  <div class="font-medium text-gray-800 truncate" :title="mergedTargetPreview.note">
                    {{ mergedTargetPreview.note }}
                  </div>
                </div>
              </div>
              <p class="text-xs text-red-500 font-medium">
                * ระบบจะลบประวัติของ "{{ mergeSource }}" ออกหลังทำการรวมประวัติสำเร็จ
              </p>
            </div>

            <!-- Warning and Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-150">
              <button
                type="button"
                @click="closeMergeModal"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                :disabled="isMerging"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                @click="handleMergeSubmit"
                class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center"
                :disabled="isMerging || !mergeSource || !mergeTarget || loadingSalesCount"
              >
                <span v-if="isMerging" class="mr-2">
                  <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </span>
                {{ isMerging ? "กำลังรวมข้อมูล..." : "ดำเนินการรวมชื่อลูกค้า" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import Swal from "sweetalert2";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { formatThaiDateTime } from "../utils/dateUtils.js";
import { sanitizeCustomerId } from "../utils/formatUtils.js";
import { useSalesStore } from "../stores/salesStore.js";

// --- State ---
import { useCustomerStore } from "../stores/customerStore.js";

const customerStore = useCustomerStore();
const customers = computed(() => customerStore.customers);
const loading = computed(() => customerStore.loading);
const searchQuery = ref("");
const showModal = ref(false);
const isEditing = ref(false);

const formData = ref({
  name: "",
  phoneNumber: "",
  address: "",
  note: "",
});

// --- Store ---
const salesStore = useSalesStore();

// --- Merge Customers State ---
const showMergeModal = ref(false);
const isMerging = ref(false);
const mergeSource = ref("");
const mergeTarget = ref("");

const sourceSearch = ref("");
const targetSearch = ref("");
const showSourceDropdown = ref(false);
const showTargetDropdown = ref(false);

const sourceSalesCount = ref(0);
const loadingSalesCount = ref(false);

// --- Computed ---
const filteredCustomers = computed(() => {
  if (!searchQuery.value.trim()) return customers.value;
  return customerStore.searchResults;
});

const filteredSourceOptions = computed(() => {
  const queryVal = sourceSearch.value.trim().toLowerCase();
  if (!queryVal) return customers.value;
  return customers.value.filter(c => c.name.toLowerCase().includes(queryVal));
});

const filteredTargetOptions = computed(() => {
  const queryVal = targetSearch.value.trim().toLowerCase();
  const baseList = customers.value.filter(c => c.name !== mergeSource.value);
  if (!queryVal) return baseList;
  return baseList.filter(c => c.name.toLowerCase().includes(queryVal));
});

const sourceProfile = computed(() => {
  return customers.value.find(c => c.name === mergeSource.value) || null;
});

const targetProfile = computed(() => {
  return customers.value.find(c => c.name === mergeTarget.value) || null;
});

const mergedTargetPreview = computed(() => {
  const src = sourceProfile.value;
  const tgt = targetProfile.value;
  if (!tgt) return null;
  if (!src) return tgt;

  const phone = tgt.phoneNumber || src.phoneNumber || "-";
  const address = tgt.address || src.address || "-";
  
  let note = tgt.note || "-";
  if (src.note) {
    if (!tgt.note) {
      note = src.note;
    } else if (tgt.note !== src.note && !tgt.note.includes(src.note)) {
      note = `${tgt.note} | ${src.note}`;
    }
  }

  return {
    phoneNumber: phone,
    address: address,
    note: note
  };
});

// --- Watcher for Search Query with Debounce ---
let searchTimeout = null;
watch(searchQuery, (newVal) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  const cleaned = newVal.trim();
  if (!cleaned) {
    customerStore.clearSearchResults();
    return;
  }
  searchTimeout = setTimeout(() => {
    customerStore.searchCustomers(cleaned);
  }, 300);
});

// --- Watcher for Sales Count ---
watch(mergeSource, async (newVal) => {
  if (!newVal) {
    sourceSalesCount.value = 0;
    return;
  }
  loadingSalesCount.value = true;
  try {
    const salesRef = collection(db, "sales");
    const q = query(salesRef, where("customerName", "==", newVal));
    const snap = await getDocs(q);
    sourceSalesCount.value = snap.docs.length;
  } catch (error) {
    console.error("Error getting sales count:", error);
    sourceSalesCount.value = 0;
  } finally {
    loadingSalesCount.value = false;
  }
});

// --- Fetch Data ---
onMounted(() => {
  if (customerStore.customers.length === 0) {
    customerStore.fetchCustomers(true);
  }
});

const loadMoreCustomers = () => {
  customerStore.fetchCustomers(false);
};

// --- Actions ---

const openModal = (customer = null) => {
  if (customer) {
    // Edit Mode
    isEditing.value = true;
    formData.value = {
      name: customer.id, // ID is Name
      phoneNumber: customer.phoneNumber || "",
      address: customer.address || "",
      note: customer.note || "",
    };
  } else {
    // Add Mode
    isEditing.value = false;
    formData.value = {
      name: "",
      phoneNumber: "",
      address: "",
      note: "",
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveCustomer = async () => {
  if (!formData.value.name.trim()) {
    Swal.fire({ icon: "warning", title: "กรุณาระบุชื่อลูกค้า" });
    return;
  }

  try {
    const customerId = sanitizeCustomerId(formData.value.name);
    const customerRef = doc(db, "customers", customerId);

    const payload = {
      name: customerId,
      phoneNumber: formData.value.phoneNumber || "",
      address: formData.value.address || "",
      note: formData.value.note || "",
      lastUpdate: serverTimestamp(),
    };

    if (isEditing.value) {
      // Update
      // Don't update name (ID)
      const { name, ...updateData } = payload;
      await updateDoc(customerRef, updateData);
      Swal.fire({
        icon: "success",
        title: "แก้ไขข้อมูลสำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      // Add new
      // Check if exists
      const docSnap = await getDoc(customerRef);
      if (docSnap.exists()) {
        Swal.fire({
          icon: "error",
          title: "ลูกค้าชื่อนี้มีอยู่แล้ว",
          text: "กรุณาใช้ชื่ออื่น",
        });
        return;
      }
      await setDoc(customerRef, payload);
      Swal.fire({
        icon: "success",
        title: "เพิ่มลูกค้าสำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });
    }

    closeModal();
    await customerStore.fetchCustomers(true); // Refresh customer list
  } catch (error) {
    console.error("Error saving customer:", error);
    Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: error.message });
  }
};

const deleteCustomer = async (customer) => {
  // Prevent multiple simultaneous deletes
  if (loading.value) return;

  try {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบ",
      html: `ต้องการลบข้อมูลลูกค้า <b>"${customer.name}"</b> หรือไม่?`,
      showCancelButton: true,
      showDenyButton: false,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ลบข้อมูล",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "customers", customer.id));
        await customerStore.fetchCustomers(true); // Refresh customer list
        await Swal.fire({
          icon: "success",
          title: "ลบสำเร็จ! (Customer deleted successfully)",
          text: "ข้อมูลลูกค้าถูกลบแล้ว (Customer deleted successfully)",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error deleting customer:", error);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "ลบข้อมูลไม่สำเร็จ: " + error.message,
        });
      }
    }
  } catch (error) {
    console.error("Unexpected error in deleteCustomer:", error);
  }
};

// --- Merge Actions ---
const openMergeModal = (customer = null) => {
  if (customer) {
    mergeSource.value = customer.name;
    sourceSearch.value = customer.name;
  } else {
    mergeSource.value = "";
    sourceSearch.value = "";
  }
  mergeTarget.value = "";
  targetSearch.value = "";
  showSourceDropdown.value = false;
  showTargetDropdown.value = false;
  sourceSalesCount.value = 0;
  showMergeModal.value = true;
};

const closeMergeModal = () => {
  showMergeModal.value = false;
};

const selectSource = (customerName) => {
  mergeSource.value = customerName;
  sourceSearch.value = customerName;
  showSourceDropdown.value = false;
  if (mergeTarget.value === customerName) {
    mergeTarget.value = "";
    targetSearch.value = "";
  }
};

const selectTarget = (customerName) => {
  mergeTarget.value = customerName;
  targetSearch.value = customerName;
  showTargetDropdown.value = false;
};

const handleMergeSubmit = async () => {
  if (!mergeSource.value || !mergeTarget.value) {
    Swal.fire({ icon: "warning", title: "กรุณาเลือกลูกค้าต้นทางและปลายทาง" });
    return;
  }

  const result = await Swal.fire({
    icon: "warning",
    title: "ยืนยันการรวมข้อมูล",
    html: `คุณกำลังจะรวมข้อมูลลูกค้า <b>"${mergeSource.value}"</b> เข้ากับ <b>"${mergeTarget.value}"</b><br><br>` +
      `<p class="text-sm text-red-500 font-semibold">⚠️ ข้อมูลประวัติการสั่งซื้อของ "${mergeSource.value}" ทั้งหมดจะถูกย้าย และบัญชีจะถูกลบถาวร การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>`,
    showCancelButton: true,
    confirmButtonColor: "#3b82f6",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "ยืนยันการรวมข้อมูล",
    cancelButtonText: "ยกเลิก",
  });

  if (!result.isConfirmed) return;

  isMerging.value = true;
  try {
    const res = await salesStore.mergeCustomers(mergeSource.value, mergeTarget.value);
    await customerStore.fetchCustomers(true); // Refresh customer list
    await Swal.fire({
      icon: "success",
      title: "รวมข้อมูลลูกค้าสำเร็จ",
      text: `ย้ายข้อมูลการขายเรียบร้อย ทั้งหมด ${res.salesCount} รายการ`,
      timer: 2000,
      showConfirmButton: false,
    });
    closeMergeModal();
  } catch (error) {
    console.error("Error in handleMergeSubmit:", error);
    await Swal.fire({
      icon: "error",
      title: "รวมข้อมูลไม่สำเร็จ",
      text: error.message,
    });
  } finally {
    isMerging.value = false;
  }
};

// --- Utils ---
const formatDate = formatThaiDateTime;
</script>
