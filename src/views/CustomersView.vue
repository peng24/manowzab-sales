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
      <button
        @click="openModal()"
        class="flex items-center rounded-lg bg-blue-600 px-4 py-2 font-bold text-white shadow-md hover:bg-blue-700 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
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
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
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
} from "firebase/firestore";
import Swal from "sweetalert2";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { formatThaiDateTime } from "../utils/dateUtils.js";

// --- State ---
const customers = ref([]);
const loading = ref(true);
const searchQuery = ref("");
const showModal = ref(false);
const isEditing = ref(false);
let unsubscribe = null;

const formData = ref({
  name: "",
  phoneNumber: "",
  address: "",
  note: "",
});

// --- Computed ---
const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value;
  const lowerQuery = searchQuery.value.toLowerCase();
  return customers.value.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      (c.phoneNumber && c.phoneNumber.includes(lowerQuery)),
  );
});

// --- Fetch Data ---
onMounted(() => {
  const q = collection(db, "customers");
  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      customers.value = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      loading.value = false;
    },
    (error) => {
      console.error("Error fetching customers:", error);
      loading.value = false;
    },
  );
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

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
    const customerId = formData.value.name.trim();
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
      loading.value = true;
      try {
        await deleteDoc(doc(db, "customers", customer.id));
        await Swal.fire({
          icon: "success",
          title: "ลบสำเร็จ!",
          text: "ข้อมูลลูกค้าถูกลบแล้ว",
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
      } finally {
        loading.value = false;
      }
    }
  } catch (error) {
    console.error("Unexpected error in deleteCustomer:", error);
    loading.value = false;
  }
};

// --- Utils ---
const formatDate = formatThaiDateTime;
</script>
