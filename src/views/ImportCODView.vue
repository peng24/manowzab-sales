<template>
  <div class="container mx-auto max-w-7xl px-4 py-8">
    <h1 class="mb-8 text-2xl font-bold text-gray-800">
      นำเข้า COD (Preview Mode)
    </h1>

    <!-- Upload Section -->
    <div
      class="mb-8 rounded-xl bg-white p-8 shadow-md border border-gray-100 text-center"
    >
      <div
        class="mx-auto max-w-xl"
        @dragover.prevent
        @dragenter.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <label
          class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 transition-colors bg-gray-50 hover:bg-gray-100 hover:border-blue-400"
          :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'"
        >
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              class="mb-4 h-10 w-10 text-gray-400"
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
            <p v-if="!isDragging" class="mb-2 text-sm text-gray-500">
              <span class="font-semibold">คลิกเพื่อเลือกไฟล์</span>
              หรือลากไฟล์มาวางที่นี่
            </p>
            <p v-else class="mb-2 text-sm text-blue-600 font-semibold">
              วางไฟล์ลงที่นี่ได้เลย
            </p>
            <p class="text-xs text-gray-500">
              รองรับไฟล์ .xlsx (Filename format: YYYYMMDD_...)
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
        <p class="text-blue-600 animate-pulse">กำลังประมวลผลไฟล์...</p>
      </div>
    </div>

    <!-- Summary Stats -->
    <div
      v-if="previewItems.length > 0"
      class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div class="rounded-xl bg-blue-50 p-6 border border-blue-100">
        <h3 class="text-sm font-medium text-blue-800">จำนวนไฟล์</h3>
        <p class="mt-2 text-3xl font-bold text-blue-900">
          {{ processedFilesCount }} ไฟล์
        </p>
      </div>
      <div class="rounded-xl bg-green-50 p-6 border border-green-100">
        <h3 class="text-sm font-medium text-green-800">จำนวนรายการทั้งหมด</h3>
        <p class="mt-2 text-3xl font-bold text-green-900">
          {{ previewItems.length }} รายการ
        </p>
      </div>
      <div class="rounded-xl bg-purple-50 p-6 border border-purple-100">
        <h3 class="text-sm font-medium text-purple-800">ยอดรวมทั้งหมด</h3>
        <p class="mt-2 text-3xl font-bold text-purple-900">
          ฿{{ formatCurrency(totalAmount) }}
        </p>
      </div>
    </div>

    <!-- Confirm Action -->
    <div v-if="previewItems.length > 0" class="mb-8 flex justify-center gap-4">
      <button
        class="rounded-lg bg-gray-200 px-6 py-3 text-lg font-bold text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
        @click="clearData"
        :disabled="isSaving"
      >
        ล้างข้อมูล
      </button>

      <button
        @click="confirmImport"
        :disabled="isSaving"
        class="bg-green-600 text-white font-bold py-2 px-4 rounded shadow hover:bg-green-700 transition duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          v-if="isSaving"
          class="mr-3 h-6 w-6 animate-spin"
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
        <span v-else>ยืนยันการนำเข้า (Confirm Save)</span>
      </button>
    </div>

    <!-- Preview Table -->
    <div
      v-if="previewItems.length > 0"
      class="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden"
    >
      <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <h3 class="text-lg font-medium text-gray-900">
          ตัวอย่างข้อมูล (Preview)
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                ลำดับ
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                วันที่ (จากไฟล์/ชื่อไฟล์)
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
                Customer Name
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                Phone / Address
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="(item, index) in previewItems"
              :key="index"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ index + 1 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(item.date) }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
              >
                {{ item.orderNo }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.customerName }}
              </td>
              <td class="px-6 py-4 text-xs text-gray-500">
                <div v-if="item.phoneNumber" class="flex items-center gap-1">
                  📞 {{ item.phoneNumber }}
                </div>
                <div
                  v-if="item.address"
                  class="truncate max-w-xs"
                  :title="item.address"
                >
                  📍 {{ item.address }}
                </div>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold"
              >
                ฿{{ formatCurrency(item.amount) }}
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
import { th } from "date-fns/locale";
import { formatThaiDateOptionalTime } from "../utils/dateUtils.js";

// Imports to use Firebase
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";

const router = useRouter();
const processing = ref(false);
const isSaving = ref(false);
const previewItems = ref([]);
const processedFilesCount = ref(0);
const isDragging = ref(false);

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

// --- MAIN LOGIC: Process Excel with ExcelJS & Fallback ---
const processFiles = async (files) => {
  if (!files || !files.length) return;

  processing.value = true;
  processedFilesCount.value = files.length;
  previewItems.value = [];

  try {
    const workbook = new ExcelJS.Workbook();

    for (const file of files) {
      // 1. Parsing Date from Filename (Fallback)
      let fileDate = parseDateFromFilename(file.name);
      // Note: We don't error out here immediately if invalid, because we might find a date column in the file.

      try {
        console.log(`Reading file ${file.name} with ExcelJS...`);
        const buffer = await readFile(file);
        await workbook.xlsx.load(buffer);

        // 2. Select Sheet (Try 'COD Detail' first, else first sheet)
        let worksheet = workbook.getWorksheet("COD Detail");
        if (!worksheet) {
          console.log("Sheet 'COD Detail' not found, using first sheet.");
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

        // 3. Scan for Header & Data
        console.log(`Scanning sheet ${worksheet.name}...`);

        // Extended Column Map
        let headerRowIndex = -1;
        let colMap = {
          orderNo: -1,
          customerName: -1,
          amount: -1,
          trackingNo: -1,
          phoneNumber: -1,
          address: -1,
          pickedUpDate: -1, // New Column
        };

        const newItems = [];
        let hasLoggedFirstItem = false;

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          // A. Look for Header (Keywords)
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
              // Check for Tracking No
              if (val.includes("tracking") && val.includes("no"))
                colMap.trackingNo = colNumber;
              // Check for Phone
              if (
                val.includes("phone") ||
                val.includes("tel") ||
                val.includes("mobile") ||
                val.includes("เบอร์")
              )
                colMap.phoneNumber = colNumber;
              // Check for Address
              if (val.includes("address") || val.includes("ที่อยู่"))
                colMap.address = colNumber;
              // Check for Picked up DATE
              if (val.includes("picked") && val.includes("date"))
                colMap.pickedUpDate = colNumber;
            });

            // Validate Header Found (Must have Order or Tracking AND Amount)
            if (
              (colMap.orderNo !== -1 || colMap.trackingNo !== -1) &&
              colMap.amount !== -1
            ) {
              headerRowIndex = rowNumber;
              console.log(`Header found at row ${rowNumber}`, colMap);
            }
            return; // Continue to next row
          }

          // B. Extract Data
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
            let amountStr = amountCell.text ? amountCell.text.trim() : "0";

            // Extract Phone & Address
            let phoneNumber =
              phoneCell && phoneCell.text ? phoneCell.text.trim() : "";
            let address =
              addressCell && addressCell.text ? addressCell.text.trim() : "";

            // Extract Date from Column (Priority)
            let itemDate = fileDate; // Default to filename date
            if (dateCell && (dateCell.value || dateCell.text)) {
              try {
                // Check if real Date object
                if (dateCell.value instanceof Date) {
                  itemDate = dateCell.value;
                } else {
                  // Try to parse string e.g. "17-09-24 08:32"
                  // Format: dd-MM-yy HH:mm or similar
                  // We use date-fns parse if specific format, or generic parsing
                  const dateStr = dateCell.text.trim();
                  // Simple check for '-' separator
                  if (dateStr.includes("-")) {
                    // Try parsing "dd-MM-yy HH:mm"
                    // Note: 'yy' maps to 20yy
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

            // Cleanup & Validate
            if (!finalOrderNo) return; // Skip if both empty
            if (finalOrderNo.toLowerCase().includes("order no")) return; // Repeated header

            const amountVal = parseFloat(amountStr.replace(/,/g, "")) || 0;

            // Valid Date Check
            if (!itemDate) {
              // If both column date and filename date fail, we might skip or log warning
              // For now, let's just keep as null/invalid so it might show error in UI or just be 1970
            }

            // Debug: Log first valid item found to confirm logic
            if (!hasLoggedFirstItem) {
              console.log(`[${file.name}] First item extracted:`, {
                finalOrderNo,
                customerName,
                amountVal,
                itemDate,
              });
              hasLoggedFirstItem = true;
            }

            newItems.push({
              orderNo: finalOrderNo,
              customerName,
              amount: amountVal,
              phoneNumber,
              address,
              date: itemDate, // Use the extracted item date
              sourceFile: file.name,
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

  // 1. Confirm Dialog
  const result = await Swal.fire({
    title: "ยืนยันการบันทึก?",
    text: `ต้องการบันทึกรายการขาย ${previewItems.value.length} รายการ และอัปเดตข้อมูลลูกค้า?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "ยืนยัน (Save)",
    cancelButtonText: "ยกเลิก",
    buttonsStyling: false,
    customClass: {
      confirmButton:
        "bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 mx-2",
      cancelButton:
        "bg-red-500 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 mx-2",
    },
  });

  if (!result.isConfirmed) return;

  // 2. Loading State
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
    if (!db) {
      throw new Error(
        "Database connection failed (db is undefined). Please check firebase config.",
      );
    }

    // 3. Prepare all operations
    const BATCH_SIZE = 500; // Firestore batch limit
    const allOperations = [];

    // Build operations list
    for (const item of previewItems.value) {
      const dateObj = new Date(item.date);

      // Sales operation
      const salesDocId = `COD_${item.orderNo}`;
      const salesData = {
        type: "COD",
        orderNo: item.orderNo,
        customerName: item.customerName,
        amount: Number(item.amount),
        date: item.date,
        dateTime: dateObj,
        importedAt: serverTimestamp(),
        fileName: item.sourceFile,
      };

      allOperations.push({
        type: "sales",
        id: salesDocId,
        data: salesData,
      });

      // Customer operation (if customer name exists)
      if (item.customerName && item.customerName.trim().length > 0) {
        const customerId = item.customerName.trim();
        const customerData = {
          name: customerId,
          lastUpdate: serverTimestamp(),
        };

        // Add optional fields if they exist
        if (item.phoneNumber) customerData.phoneNumber = item.phoneNumber;
        if (item.address) customerData.address = item.address;

        allOperations.push({
          type: "customer",
          id: customerId,
          data: customerData,
        });
      }
    }

    // 4. Split into chunks and process
    const chunks = [];
    for (let i = 0; i < allOperations.length; i += BATCH_SIZE) {
      chunks.push(allOperations.slice(i, i + BATCH_SIZE));
    }

    console.log(
      `Processing ${allOperations.length} operations in ${chunks.length} batches`,
    );

    let processedCount = 0;

    // Process each chunk
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const { writeBatch } = await import("firebase/firestore");
      const batch = writeBatch(db);

      // Add all operations in this chunk to the batch
      for (const operation of chunk) {
        if (operation.type === "sales") {
          const docRef = doc(db, "sales", operation.id);
          batch.set(docRef, operation.data, { merge: true });
        } else if (operation.type === "customer") {
          const docRef = doc(db, "customers", operation.id);
          batch.set(docRef, operation.data, { merge: true });
        }
      }

      // Commit this batch
      await batch.commit();

      processedCount += chunk.length;

      // Update progress
      const progressEl = document.getElementById("batch-progress");
      if (progressEl) {
        const completedItems = Math.min(
          processedCount / 2,
          previewItems.value.length,
        ); // Rough estimate (sales + customers)
        progressEl.textContent = `Processing: ${Math.floor(completedItems)} / ${previewItems.value.length}`;
      }

      console.log(
        `Batch ${chunkIndex + 1}/${chunks.length} committed (${processedCount}/${allOperations.length} operations)`,
      );
    }

    // 5. Success & Redirect
    await Swal.fire({
      icon: "success",
      title: "บันทึกสำเร็จ!",
      text: `บันทึกยอดขาย ${previewItems.value.length} รายการ และอัปเดตฐานข้อมูลลูกค้าเรียบร้อยแล้ว`,
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
  // Expected format: YYYYMMDD_...
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
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("th-TH").format(amount || 0);
};

const formatDate = formatThaiDateOptionalTime;

const totalAmount = computed(() => {
  return previewItems.value.reduce((sum, item) => sum + (item.amount || 0), 0);
});
</script>
