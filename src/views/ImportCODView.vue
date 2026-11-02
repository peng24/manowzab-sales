<template>
  <div class="container mx-auto max-w-7xl py-1 md:py-2">
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">
          นำเข้า COD (Preview Mode)
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          อัปโหลดไฟล์ Excel จากขนส่ง ตรวจสอบยอดขาย และบันทึกข้อมูลเข้าระบบ (จัดการระบุจำนวนตัวได้ที่หน้าประวัติการขาย)
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
              รองรับไฟล์ .xlsx (ไฟล์ .xls ต้องบันทึกเป็น .xlsx ก่อน) (ระบบอ่านวันที่จากคอลัมน์ในไฟล์ หรือชื่อไฟล์ YYYYMMDD_...)
            </p>
          </div>
          <input
            type="file"
            class="hidden"
            multiple
            accept=".xlsx"
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
          กำลังอ่านข้อมูลไฟล์ Excel...
        </p>
      </div>
    </div>

    <div v-if="importErrors.length" role="alert" class="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-800"><p v-for="message in importErrors" :key="message">{{ message }}</p><p>กรุณาเลือกไฟล์ที่แก้ไขแล้วใหม่ก่อนบันทึก</p></div>
    <p v-if="previewItems.length" class="mb-4 text-sm text-gray-700">พร้อมนำเข้า {{ readyItems.length }} รายการ · รายการซ้ำจะข้าม · รายการขัดแย้งต้องตรวจประวัติก่อน ไม่เขียนทับข้อมูลเดิม</p>
    <p class="mb-4 text-xs text-gray-600">วันที่ขาย COD สำหรับภาษีใช้วันที่รับเงินในรายงาน หรือวันที่โอนในชื่อไฟล์ YYYYMMDD ไม่ใช้วันรับพัสดุ โปรดตรวจว่าเป็นยอดขายก่อนหักค่าบริการขนส่ง</p>
    <!-- Summary Stats (3 Cards) -->
    <div
      v-if="previewItems.length > 0"
      class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
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
    <div
      v-if="previewItems.length > 0"
      class="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs"
    >
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
          :disabled="isSaving || processing || blockedItems || !readyItems.length || importErrors.length > 0"
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
          <span v-else>ยืนยันการนำเข้า {{ readyItems.length }} รายการใหม่ (Confirm Save)</span>
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
            ({{ previewItems.length }} รายการ)
          </span>
        </h3>
        <p class="text-xs text-gray-500">
          💡 สามารถตรวจสอบและแก้ไขจำนวนตัวย้อนหลังได้ที่หน้า <b>ประวัติยอดขายทั้งหมด</b>
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
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="(item, index) in previewItems"
              :key="`${item.orderNo}-${index}`"
              class="hover:bg-gray-50 transition-colors"
            >
              <!-- Index Number -->
              <td class="px-4 py-3 whitespace-nowrap text-center text-xs text-gray-400 font-mono">
                {{ index + 1 }}
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
                <span class="mt-1 block text-xs font-normal" :class="item.importStatus === 'new' ? 'text-emerald-700' : 'text-red-700'">{{ item.importMessage }}</span>
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
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { previewCODSales } from "../services/salesService.js";
import Swal from "sweetalert2";
import { format, parse } from "date-fns";
import { formatThaiDateOptionalTime } from "../utils/dateUtils.js";
import { formatCurrency, sanitizeCustomerId } from "../utils/formatUtils.js";
import { useSalesStore } from "../stores/salesStore.js";

const router = useRouter();
const salesStore = useSalesStore();

const processing = ref(false);
const importErrors = ref([]);
const readyItems = computed(() => previewItems.value.filter(i => i.importStatus === "new"));
const blockedItems = computed(() => previewItems.value.some(i => ["invalid", "conflict"].includes(i.importStatus)));
const isSaving = ref(false);
const previewItems = ref([]);
const processedFilesCount = ref(0);
const isDragging = ref(false);

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
  if (!files || !files.length || processing.value || isSaving.value) return;

  processing.value = true;
  processedFilesCount.value = files.length;
  previewItems.value = [];
  importErrors.value = [];

  try {
    const { default: ExcelJS } = await import("exceljs");
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".xlsx")) { importErrors.value.push(`${file.name}: กรุณาบันทึกเป็น .xlsx ก่อน`); continue; }
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
          importErrors.value.push(`${file.name}: ไม่พบ Worksheet`);
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
          paymentDate: -1,
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
              if ((val.includes("transfer") || val.includes("paid") || val.includes("settlement") || val.includes("remittance")) && val.includes("date"))
                colMap.paymentDate = colNumber;
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
              colMap.paymentDate !== -1
                ? row.getCell(colMap.paymentDate)
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

            const amountVal = Number(amountStr.replace(/,/g, ""));

            newItems.push({
              orderNo: finalOrderNo,
              trackingNo: trackingNoVal,
              carrier: "Flash",
              customerName,
              amount: amountVal,
              phoneNumber,
              address,
              date: itemDate,
              sourceFile: file.name,
            });
          }
        });

        console.log(`Extracted ${newItems.length} items from ${file.name}`);
        previewItems.value.push(...newItems);

        if (headerRowIndex === -1) {
          importErrors.value.push(`${file.name}: ไม่พบหัวตาราง`);
          Swal.fire({
            icon: "error",
            title: "ไม่พบหัวตาราง",
            text: `ไม่พบคอลัมน์ Order No / Tracking No และ Amount ในไฟล์ ${file.name}`,
          });
        }
      } catch (err) {
        importErrors.value.push(`${file.name}: ${err.message}`);
        console.error(`Error processing ${file.name}:`, err);
        Swal.fire({
          icon: "error",
          title: "อ่านไฟล์ล้มเหลว",
          text: `${file.name}: ${err.message}`,
        });
      }
    }
    previewItems.value = await previewCODSales(previewItems.value);
  } catch (error) {
    importErrors.value.push(error.message);
    console.error("Process error:", error);
    Swal.fire({ icon: "error", title: "System Error", text: error.message });
  } finally {
    processing.value = false;
  }
};

// --- SAVE TO FIREBASE ---
const confirmImport = async () => {
  if (isSaving.value || processing.value || previewItems.value.length === 0 || importErrors.value.length) return;
  isSaving.value = true;
  try { previewItems.value = await previewCODSales(previewItems.value); }
  catch (error) { await Swal.fire({icon: "error", title: "ตรวจรายการซ้ำไม่สำเร็จ", text: error.message}); return; }
  finally { isSaving.value = false; }
  if (blockedItems.value || !readyItems.value.length) {
    await Swal.fire({icon: "warning", title: "ยังไม่มีรายการพร้อมนำเข้า", text: "รายการซ้ำจะถูกข้าม รายการขัดแย้งหรือผิดต้องตรวจแก้ก่อนนำเข้า"});
    return;
  }

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
    html: `ต้องการบันทึกยอดขาย COD ทั้งหมด <b>${readyItems.value.length}</b> รายการใหม่<br>รวมเป็นเงิน <b>฿${formatCurrency(totalAmount.value)}</b> และอัปเดตข้อมูลลูกค้า?`,
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
    // Prepare sales items (default itemCount: 1, isItemCountSet: false so they can be edited in AllSalesView)
    const salesItems = readyItems.value.map((item) => ({
      orderNo: item.orderNo,
      trackingNo: item.trackingNo || "",
      carrier: item.carrier || "Flash",
      customerName: sanitizeCustomerId(item.customerName),
      amount: Number(item.amount),
      date: item.date,
      phoneNumber: item.phoneNumber,
      address: item.address,
      sourceFile: item.sourceFile,
      itemCount: 1,
      isItemCountSet: false,
    }));

    // Perform batch import through the store
    const saved = await salesStore.importCODSales(salesItems, (completedCount, totalItems) => {
      const progressEl = document.getElementById("batch-progress");
      if (progressEl) {
        progressEl.textContent = `Processing: ${completedCount} / ${totalItems}`;
      }
    });

    // Success & Redirect
    await Swal.fire({
      icon: "success",
      title: "บันทึกสำเร็จ! (COD Import Successful)",
      text: `บันทึกใหม่ ${saved.inserted} รายการ ข้ามรายการซ้ำระหว่างบันทึก ${saved.skipped} รายการ`,
      timer: 2000,
      showConfirmButton: false,
    });

    isSaving.value = false;
    clearData();
    router.push("/all-sales");
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
  if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
};

const clearData = () => {
  if (processing.value || isSaving.value) return;
  importErrors.value = [];
  previewItems.value = [];
  processedFilesCount.value = 0;
};

onUnmounted(() => {
  clearData();
});

const formatDate = formatThaiDateOptionalTime;

// --- COMPUTED PROPERTIES ---

const totalAmount = computed(() => {
  return readyItems.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
});

const hasInvalidDates = computed(() => {
  return previewItems.value.some(
    (item) => !item.date || isNaN(new Date(item.date).getTime()),
  );
});
</script>
