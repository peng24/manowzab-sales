<template>
  <div class="container mx-auto max-w-7xl py-1 md:py-2 space-y-4">
    <!-- 1. Header & Tax Form Selector Card -->
    <div
      class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm"
    >
      <div class="flex items-center gap-3.5">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 shrink-0"
        >
          <Calculator class="h-6 w-6" />
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              กรมสรรพากร (Revenue Dept.)
            </span>
            <span class="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
              มาตรา 40(8) พาณิชยกรรม
            </span>
            <span class="text-xs text-gray-400">บุคคลธรรมดา</span>
          </div>
          <h1 class="text-xl md:text-2xl font-black text-gray-900 leading-tight mt-1">
            ระบบคำนวณและวางแผนภาษีสรรพากร
          </h1>
          <p class="text-xs text-gray-500 mt-0.5">
            คำนวณตามสูตรและประมวลรัษฎากร 100% พร้อมตารางตัวเลขสำหรับนำไปยื่น e-Filing (rd.go.th)
          </p>
        </div>
      </div>

      <!-- Controls: Form Selector & Year Selector -->
      <div class="flex flex-wrap items-center gap-2.5">
        <!-- Form Type Toggle: P.N.D.90 vs P.N.D.94 -->
        <div class="flex rounded-xl bg-gray-100 p-1 text-xs font-bold">
          <button
            @click="selectedForm = 'pnd90'"
            class="rounded-lg px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1"
            :class="selectedForm === 'pnd90' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'"
          >
            <span>📜 ภ.ง.ด. 90</span>
            <span class="text-[10px] font-normal text-gray-400">(สิ้นปี)</span>
          </button>
          <button
            @click="selectedForm = 'pnd94'"
            class="rounded-lg px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1"
            :class="selectedForm === 'pnd94' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'"
          >
            <span>📄 ภ.ง.ด. 94</span>
            <span class="text-[10px] font-normal text-gray-400">(ครึ่งปี)</span>
          </button>
        </div>

        <!-- Year Selector -->
        <div class="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl p-1 px-2.5">
          <Calendar class="h-4 w-4 text-gray-500" />
          <span class="text-xs font-semibold text-gray-600">ปีภาษี:</span>
          <select
            v-model="selectedYear"
            class="rounded-lg border-0 bg-transparent py-1 pr-6 pl-1 text-xs font-black text-gray-900 focus:ring-0 cursor-pointer"
          >
            <option v-for="yr in yearOptions" :key="yr" :value="yr">
              พ.ศ. {{ yr + 543 }}
            </option>
          </select>
        </div>

        <button
          @click="loadData"
          :disabled="loading"
          class="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': loading }" />
          <span>{{ loading ? 'โหลด...' : 'รีเฟรช' }}</span>
        </button>
      </div>
    </div>

    <!-- Active Form Description Banner -->
    <div
      class="rounded-xl p-3 text-xs font-medium flex items-center justify-between gap-2 border"
      :class="selectedForm === 'pnd94' ? 'bg-indigo-50/70 border-indigo-100 text-indigo-900' : 'bg-emerald-50/70 border-emerald-100 text-emerald-900'"
    >
      <div class="flex items-center gap-2">
        <span class="text-base">{{ selectedForm === 'pnd94' ? '📄' : '📜' }}</span>
        <span>
          <strong>กำลังดู: {{ selectedForm === 'pnd94' ? 'แบบ ภ.ง.ด. 94 (ภาษีเงินได้บุคคลธรรมดาครึ่งปี)' : 'แบบ ภ.ง.ด. 90 (ภาษีเงินได้บุคคลธรรมดาประจำปี)' }}</strong>
          — {{ selectedForm === 'pnd94' ? 'สรุปรายได้และรายจ่ายช่วง 6 เดือนแรก (1 ม.ค. – 30 มิ.ย.) หักค่าลดหย่อนกึ่งหนึ่ง ยื่น ก.ค. - ก.ย.' : 'สรุปรายได้และรายจ่ายทั้งปี (1 ม.ค. – 31 ธ.ค.) ยื่น ม.ค. - มี.ค. ของปีถัดไป' }}
        </span>
      </div>
      <span class="hidden sm:inline-block rounded-full bg-white px-2 py-0.5 text-[11px] font-bold shadow-xs border">
        พ.ศ. {{ selectedYear + 543 }}
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex h-64 w-full items-center justify-center">
      <div class="flex flex-col items-center gap-2">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        <p class="text-sm text-gray-500">กำลังดึงข้อมูลและคำนวณตามเกณฑ์สรรพากร...</p>
      </div>
    </div>

    <div v-else class="space-y-4 animate-fade-in-up">
      <!-- 2. Legal Thresholds & Warning Trackers (VAT 1.8M & e-Payment) -->
      <div class="grid gap-3.5 grid-cols-1 md:grid-cols-2">
        <!-- VAT 1.8 Million Threshold Tracker -->
        <div
          class="rounded-2xl border bg-white p-4 md:p-5 shadow-sm transition-all relative overflow-hidden"
          :class="vatProgressPercent >= 100 ? 'border-rose-300 bg-rose-50/20' : (vatProgressPercent >= 80 ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200')"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span
                  class="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  :class="vatProgressPercent >= 100 ? 'bg-rose-100 text-rose-700' : (vatProgressPercent >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')"
                >
                  ภาษีมูลค่าเพิ่ม (VAT 7%)
                </span>
                <span class="text-xs font-semibold text-gray-500">เกณฑ์ 1.8 ล้านบาท/ปี</span>
              </div>
              <h3 class="text-lg font-black text-gray-900 mt-1.5">
                ฿{{ formatCurrency(fullYearRevenue) }}
                <span class="text-xs font-normal text-gray-500">/ ฿1,800,000</span>
              </h3>
            </div>
            <div
              class="rounded-xl p-2.5"
              :class="vatProgressPercent >= 100 ? 'bg-rose-100 text-rose-600' : (vatProgressPercent >= 80 ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600')"
            >
              <ShieldAlert v-if="vatProgressPercent >= 80" class="h-6 w-6" />
              <ShieldCheck v-else class="h-6 w-6" />
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mt-3">
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span :class="vatProgressPercent >= 100 ? 'text-rose-600 font-bold' : (vatProgressPercent >= 80 ? 'text-amber-600 font-bold' : 'text-gray-600')">
                {{ vatProgressPercent >= 100 ? '⚠️ เกินเกณฑ์ 1.8 ล้านแล้ว' : (vatProgressPercent >= 80 ? '⚡ ใกล้ถึงเกณฑ์ 1.8 ล้าน' : '✅ ปลอดภัย ยังไม่ถึงเกณฑ์') }}
              </span>
              <span class="font-bold text-gray-800">{{ vatProgressPercent }}%</span>
            </div>
            <div class="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                class="h-full transition-all duration-500 rounded-full"
                :class="vatProgressPercent >= 100 ? 'bg-rose-500' : (vatProgressPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500')"
                :style="{ width: `${Math.min(vatProgressPercent, 100)}%` }"
              ></div>
            </div>
          </div>

          <!-- Notice / Details -->
          <div class="mt-3 pt-2.5 border-t border-gray-100 text-xs text-gray-600">
            <p v-if="vatProgressPercent >= 100" class="text-rose-700 font-semibold flex items-center gap-1">
              <AlertTriangle class="h-4 w-4 shrink-0" />
              ต้องยื่นจดทะเบียนภาษีมูลค่าเพิ่ม (ภ.พ.01) ภายใน 30 วันนับแต่วันที่ยอดขายเกิน 1.8 ล้านบาท
            </p>
            <p v-else-if="vatProgressPercent >= 80" class="text-amber-700">
              ยอดขายทั้งปีเหลืออีก <strong class="font-bold">฿{{ formatCurrency(Math.max(0, 1800000 - fullYearRevenue)) }}</strong> จะถึงเกณฑ์ 1.8 ล้าน ควรเตรียมวางแผนภาษีและระบบออกใบกำกับภาษี
            </p>
            <p v-else class="text-gray-500">
              ยอดขายทั้งปีห่างจากเพดาน <strong>฿{{ formatCurrency(Math.max(0, 1800000 - fullYearRevenue)) }}</strong> ยังไม่ต้องจดทะเบียนภาษีมูลค่าเพิ่ม
            </p>
          </div>
        </div>

        <!-- e-Payment Bank Reporting Threshold Tracker -->
        <div class="rounded-2xl border bg-white p-4 md:p-5 shadow-sm transition-all border-gray-200">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  กฎหมาย e-Payment
                </span>
                <span class="text-xs font-semibold text-gray-500">เกณฑ์ส่งข้อมูลให้สรรพากร</span>
              </div>
              <h3 class="text-lg font-black text-gray-900 mt-1.5">
                {{ fullYearTransferCount }} รายการโอน
                <span class="text-xs font-normal text-gray-500">/ ฿{{ formatCurrency(fullYearTransferAmount) }}</span>
              </h3>
            </div>
            <div class="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
              <CreditCard class="h-6 w-6" />
            </div>
          </div>

          <!-- Conditions Checklist -->
          <div class="mt-3 space-y-2 text-xs">
            <!-- Condition 1: 3,000 transactions -->
            <div class="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full" :class="fullYearTransferCount >= 3000 ? 'bg-amber-500' : 'bg-emerald-500'"></div>
                <span class="font-medium text-gray-700">เงื่อนไข 1: รับโอน 3,000 ครั้งขึ้นไป</span>
              </div>
              <span class="font-bold" :class="fullYearTransferCount >= 3000 ? 'text-amber-600' : 'text-gray-600'">
                {{ fullYearTransferCount }} / 3,000 ครั้ง
              </span>
            </div>

            <!-- Condition 2: 400 transactions & 2M THB -->
            <div class="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full" :class="(fullYearTransferCount >= 400 && fullYearTransferAmount >= 2000000) ? 'bg-amber-500' : 'bg-emerald-500'"></div>
                <span class="font-medium text-gray-700">เงื่อนไข 2: รับโอน 400 ครั้ง + ยอด 2 ล้านบาท</span>
              </div>
              <span class="font-bold" :class="(fullYearTransferCount >= 400 && fullYearTransferAmount >= 2000000) ? 'text-amber-600' : 'text-gray-600'">
                {{ fullYearTransferCount >= 400 ? '✅ 400+ ครั้ง' : `${fullYearTransferCount}/400 ครั้ง` }} | ฿{{ formatCurrency(fullYearTransferAmount) }}
              </span>
            </div>
          </div>

          <p class="mt-2.5 text-[11px] text-gray-400 leading-normal">
            * สถาบันการเงินส่งเฉพาะยอดเงินเข้า (ฝาก/โอน) การส่งข้อมูลไม่ได้หมายความว่าต้องเสียภาษีเพิ่ม หากมีการยื่นแบบภาษีถูกต้อง
          </p>
        </div>
      </div>

      <!-- 3. Tax Calculation Hero & Deduction Method Comparison -->
      <div class="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {{ selectedForm === 'pnd94' ? 'แบบ ภ.ง.ด. 94 (ครึ่งปี)' : 'แบบ ภ.ง.ด. 90 (ประจำปี)' }}
              </span>
              <h2 class="text-lg font-black text-gray-900">
                สรุปการคำนวณภาษีเงินได้บุคคลธรรมดา
              </h2>
            </div>
            <p class="text-xs text-gray-500 mt-0.5">
              เปรียบเทียบการหักค่าใช้จ่าย 2 รูปแบบตามมาตรา 40(8) เพื่อเลือกวิธีที่ประหยัดภาษีที่สุด
            </p>
          </div>

          <!-- Deduction Method Switcher -->
          <div class="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold">
            <button
              @click="expenseDeductionMethod = 'flat'"
              class="rounded-lg px-3 py-1.5 transition-all cursor-pointer"
              :class="expenseDeductionMethod === 'flat' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-gray-600 hover:text-gray-900'"
            >
              หักแบบเหมา 60%
            </button>
            <button
              @click="expenseDeductionMethod = 'actual'"
              class="rounded-lg px-3 py-1.5 transition-all cursor-pointer"
              :class="expenseDeductionMethod === 'actual' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-gray-600 hover:text-gray-900'"
            >
              หักค่าใช้จ่ายตามจริง
            </button>
          </div>
        </div>

        <!-- Recommendation Banner -->
        <div
          class="my-4 rounded-xl p-3.5 text-xs font-medium flex items-center justify-between gap-3 flex-wrap"
          :class="recommendedMethod === 'actual' ? 'bg-indigo-50 border border-indigo-100 text-indigo-900' : 'bg-emerald-50 border border-emerald-100 text-emerald-900'"
        >
          <div class="flex items-center gap-2">
            <span class="text-base">💡</span>
            <span>
              <strong>คำแนะนำจากระบบ:</strong>
              วิธี <strong>{{ recommendedMethod === 'actual' ? 'หักค่าใช้จ่ายตามจริง' : 'หักแบบเหมา 60%' }}</strong>
              ช่วยประหยัดภาษีได้มากกว่าอีกวิธี 
              <strong class="text-emerald-700 font-bold text-sm underline ml-1">฿{{ formatCurrency(taxSavingsDifference) }}</strong>
            </span>
          </div>

          <button
            v-if="expenseDeductionMethod !== recommendedMethod"
            @click="expenseDeductionMethod = recommendedMethod"
            class="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
          >
            สลับเป็นวิธีที่ประหยัดกว่า
          </button>
        </div>

        <!-- 3-Column Summary Cards -->
        <div class="grid gap-3 grid-cols-1 sm:grid-cols-3 my-4">
          <!-- Total Revenue Card -->
          <div class="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
            <span class="text-[11px] font-bold text-gray-500 uppercase">
              1. เงินได้พึงประเมิน 40(8) ({{ selectedForm === 'pnd94' ? '6 เดือนแรก' : 'ทั้งปี' }})
            </span>
            <p class="text-xl md:text-2xl font-black text-gray-900 mt-1">
              ฿{{ formatCurrency(formRevenue) }}
            </p>
            <p class="text-[11px] text-gray-400 mt-1">รวมยอดโอน และ COD</p>
          </div>

          <!-- Net Taxable Income Card -->
          <div class="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
            <span class="text-[11px] font-bold text-gray-500 uppercase">2. เงินได้สุทธิ (Net Taxable Income)</span>
            <p class="text-xl md:text-2xl font-black text-gray-900 mt-1">
              ฿{{ formatCurrency(activeCalculation.netTaxableIncome) }}
            </p>
            <p class="text-[11px] text-gray-400 mt-1">
              หลังหักค่าใช้จ่าย & ค่าลดหย่อน{{ selectedForm === 'pnd94' ? ' (กึ่งหนึ่ง)' : '' }}
            </p>
          </div>

          <!-- Tax Payable Hero Card -->
          <div
            class="rounded-xl p-3.5 text-white shadow-sm"
            :class="activeCalculation.finalBalance >= 0 ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 shadow-emerald-700/20' : 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-blue-700/20'"
          >
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                {{ activeCalculation.finalBalance >= 0 ? '3. ภาษีที่ต้องชำระ (Tax Payable)' : '3. ภาษีที่ชำระไว้เกิน (Refund)' }}
              </span>
              <span class="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                ฐานสูงสุด {{ activeCalculation.highestBracketPercent }}%
              </span>
            </div>
            <p class="text-2xl md:text-3xl font-black mt-1">
              ฿{{ formatCurrency(Math.abs(activeCalculation.finalBalance)) }}
            </p>
            <p class="text-[11px] text-white/90 mt-1">
              {{ activeCalculation.finalBalance >= 0 ? (activeCalculation.usedFlat05PercentRule ? '(คิดจากภาษีเหมา 0.5% ม.48(2))' : '(คำนวณตามอัตราก้าวหน้า)') : '✅ ได้รับสิทธิขอคืนภาษี' }}
            </p>
          </div>
        </div>

        <!-- Official Revenue Department Breakdown Formula Table -->
        <div class="overflow-x-auto rounded-xl border border-gray-100 bg-slate-50/50 p-3.5 text-xs">
          <h4 class="font-bold text-gray-700 mb-2.5 flex items-center gap-1.5">
            <FileText class="h-4 w-4 text-emerald-600" />
            ตารางแสดงขั้นตอนการคำนวณภาษีตามแบบสรรพากร (Tax Breakdown)
          </h4>
          <div class="space-y-2">
            <div class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium">
              <span class="text-gray-600">
                1. เงินได้พึงประเมินมาตรา 40(8) ({{ selectedForm === 'pnd94' ? '1 ม.ค. – 30 มิ.ย.' : '1 ม.ค. – 31 ธ.ค.' }})
              </span>
              <span class="font-bold text-gray-900">฿{{ formatCurrency(formRevenue) }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium text-rose-600">
              <span>
                2. หัก: ค่าใช้จ่าย ({{ expenseDeductionMethod === 'flat' ? 'เหมา 60%' : 'ตามจริงจากระบบ' }})
              </span>
              <span class="font-bold">- ฿{{ formatCurrency(activeCalculation.deductedExpenseAmount) }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium">
              <span class="text-gray-600">3. คงเหลือ: เงินได้หลังหักค่าใช้จ่าย</span>
              <span class="font-bold text-gray-900">฿{{ formatCurrency(activeCalculation.incomeAfterExpense) }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium text-rose-600">
              <span>4. หัก: ค่าลดหย่อนรวม{{ selectedForm === 'pnd94' ? ' (หักกึ่งหนึ่งตามกฎหมาย)' : '' }}</span>
              <span class="font-bold">- ฿{{ formatCurrency(activeAllowancesTotal) }}</span>
            </div>
            <div v-if="activeCalculation.donationsDeduction > 0" class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium text-rose-600">
              <span>5. หัก: เงินบริจาค (ไม่เกิน 10% ของเงินได้หลังหักลดหย่อน)</span>
              <span class="font-bold">- ฿{{ formatCurrency(activeCalculation.donationsDeduction) }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-300 font-bold bg-white px-2 rounded-lg text-emerald-800">
              <span>6. เงินได้สุทธิ (Net Taxable Income)</span>
              <span class="text-sm">฿{{ formatCurrency(activeCalculation.netTaxableIncome) }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium">
              <span class="text-gray-600">7. ภาษีคำนวณวิธีที่ 1: อัตราภาษีแบบก้าวหน้า (0% - 35%)</span>
              <span class="font-bold text-gray-900">฿{{ formatCurrency(activeCalculation.progressiveTax) }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium text-gray-600">
              <span>
                8. ภาษีคำนวณวิธีที่ 2: แบบเหมา 0.5% (เงินได้ × 0.005 ตาม ม.48(2))
              </span>
              <span class="font-bold">
                {{ activeCalculation.method2Waived ? '฿' + formatCurrency(formRevenue * 0.005) + ' (ยกเว้น: ไม่เกิน 5,000 บ.)' : '฿' + formatCurrency(formRevenue * 0.005) }}
              </span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-gray-200/60 font-bold text-gray-800 bg-gray-50 px-2 rounded">
              <span>9. ภาษีที่คำนวณได้ก่อนหักเครดิต (วิธีที่สูงกว่า)</span>
              <span>฿{{ formatCurrency(activeCalculation.taxBeforeCredits) }}</span>
            </div>
            <div v-if="withholdingTax > 0" class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium text-emerald-600">
              <span>10. หัก: ภาษีถูกหัก ณ ที่จ่าย (Withholding Tax / 50 ทวิ)</span>
              <span class="font-bold">- ฿{{ formatCurrency(withholdingTax) }}</span>
            </div>
            <div v-if="selectedForm === 'pnd90' && paidPnd94Tax > 0" class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium text-emerald-600">
              <span>11. หัก: ภาษีที่ชำระไว้ตามแบบ ภ.ง.ด. 94 (ภาษีครึ่งปี)</span>
              <span class="font-bold">- ฿{{ formatCurrency(paidPnd94Tax) }}</span>
            </div>
            <div class="flex items-center justify-between pt-2 font-black text-sm text-gray-900">
              <span>{{ activeCalculation.finalBalance >= 0 ? 'สรุป: ภาษีที่ต้องชำระเพิ่มเติม' : 'สรุป: ภาษีที่ชำระไว้เกิน (ขอคืนได้)' }}</span>
              <span class="text-base" :class="activeCalculation.finalBalance >= 0 ? 'text-emerald-600' : 'text-blue-600'">
                ฿{{ formatCurrency(Math.abs(activeCalculation.finalBalance)) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. e-Filing Copy-Paste Box (พร้อมกรอกระบบกรมสรรพากร) -->
      <div class="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-4 md:p-5 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-3 mb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="rounded bg-emerald-600 text-white px-2 py-0.5 text-xs font-bold">e-Filing Helper</span>
              <h3 class="text-base font-black text-gray-900">
                ตัวเลขสำหรับกรอกระบบ e-Filing กรมสรรพากร (rd.go.th)
              </h3>
            </div>
            <p class="text-xs text-gray-600 mt-0.5">
              นำตัวเลขในช่องเหล่านี้ไปกรอกในระบบ e-Filing {{ selectedForm === 'pnd94' ? 'แบบ ภ.ง.ด. 94' : 'แบบ ภ.ง.ด. 90' }} ได้ทันที
            </p>
          </div>
          <a
            href="https://efiling.rd.go.th"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-white border border-emerald-300 rounded-lg px-3 py-1.5 shadow-xs hover:bg-emerald-50"
          >
            <span>ไปที่ e-Filing กรมสรรพากร</span>
            <ExternalLink class="h-3.5 w-3.5" />
          </a>
        </div>

        <div class="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div
            v-for="item in eFilingFields"
            :key="item.label"
            class="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-xs flex flex-col justify-between"
          >
            <div>
              <span class="text-[10px] font-bold text-gray-400 uppercase">{{ item.step }}</span>
              <p class="font-bold text-gray-800 text-[11px] leading-snug mt-0.5">{{ item.label }}</p>
            </div>
            <div class="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
              <span class="font-black text-sm text-emerald-800">฿{{ formatCurrency(item.value) }}</span>
              <button
                @click="copyToClipboard(item.value, item.label)"
                class="rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 p-1 px-2 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="คัดลอกตัวเลข"
              >
                <Copy class="h-3 w-3" />
                <span>คัดลอก</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Complete Interactive Tax Allowances & Deductions Form (ตามเกณฑ์สรรพากรฉบับเต็ม) -->
      <div class="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 mb-4 gap-2">
          <div>
            <h3 class="text-base font-black text-gray-900 flex items-center gap-2">
              <BadgePercent class="h-5 w-5 text-emerald-600" />
              รายการลดหย่อนภาษีตามกฎหมาย (Tax Allowances & Deductions)
            </h3>
            <p class="text-xs text-gray-500">
              {{ selectedForm === 'pnd94' ? 'ระบบคำนวณหักกึ่งหนึ่ง (1/2) ให้อัตโนมัติตามเกณฑ์ ภ.ง.ด. 94' : 'คำนวณตามเกณฑ์สรรพากรฉบับเต็มสำหรับ ภ.ง.ด. 90' }}
            </p>
          </div>
          <div class="text-right">
            <span class="text-xs text-gray-400">ค่าลดหย่อนที่ใช้ได้จริง</span>
            <p class="text-base font-black text-emerald-700">฿{{ formatCurrency(activeAllowancesTotal) }}</p>
          </div>
        </div>

        <!-- Allowances Grid -->
        <div class="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <!-- 1. Personal Allowance -->
          <div class="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">1. ผู้มีเงินได้ (ส่วนตัว)</label>
              <span class="text-[10px] text-gray-400 font-semibold">{{ selectedForm === 'pnd94' ? 'กึ่งหนึ่ง 30,000' : 'เต็มจำนวน 60,000' }}</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-sm font-black text-gray-700 bg-white p-2 rounded-lg border border-gray-200">
              <span>฿{{ formatCurrency(selectedForm === 'pnd94' ? 30000 : 60000) }}</span>
              <CheckCircle2 class="h-4 w-4 text-emerald-600" />
            </div>
            <p class="text-[10px] text-gray-400 mt-1">ได้รับสิทธิ์ทุกคนตามกฎหมาย</p>
          </div>

          <!-- 2. Spouse Allowance -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">2. คู่สมรส (ไม่มีเงินได้)</label>
              <input type="checkbox" v-model="hasSpouseAllowance" class="rounded text-emerald-600 h-4 w-4 cursor-pointer" />
            </div>
            <div class="mt-2 text-sm font-bold text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">
              {{ hasSpouseAllowance ? '฿' + formatCurrency(selectedForm === 'pnd94' ? 30000 : 60000) : '฿0' }}
            </div>
            <p class="text-[10px] text-gray-400 mt-1">จดทะเบียนสมรสและไม่มีรายได้</p>
          </div>

          <!-- 3. First Child (30,000 / child) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">3. บุตรคนแรก ({{ selectedForm === 'pnd94' ? '15,000' : '30,000' }} บ./คน)</label>
              <span class="font-bold text-emerald-700">฿{{ formatCurrency(firstChildCount * (selectedForm === 'pnd94' ? 15000 : 30000)) }}</span>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="10"
                v-model.number="firstChildCount"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
              />
              <span class="text-gray-500 shrink-0">คน</span>
            </div>
          </div>

          <!-- 4. Second Child Born 2018+ (60,000 / child) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">4. บุตรคนที่ 2 ขึ้นไป (เกิดปี 61+)</label>
              <span class="font-bold text-emerald-700">฿{{ formatCurrency(secondChildCount * (selectedForm === 'pnd94' ? 30000 : 60000)) }}</span>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="10"
                v-model.number="secondChildCount"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
              />
              <span class="text-gray-500 shrink-0">คน</span>
            </div>
          </div>

          <!-- 5. Parents Care (30,000 / parent, max 4) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">5. อุปการะบิดามารดา (อายุ 60+)</label>
              <span class="font-bold text-emerald-700">฿{{ formatCurrency(parentsCareCount * (selectedForm === 'pnd94' ? 15000 : 30000)) }}</span>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="4"
                v-model.number="parentsCareCount"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
              />
              <span class="text-gray-500 shrink-0">คน (สูงสุด 4)</span>
            </div>
          </div>

          <!-- 6. Social Security (max 9,000) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">6. ประกันสังคม (ม.33/39/40)</label>
              <span class="text-[10px] text-gray-400">สูงสุด {{ selectedForm === 'pnd94' ? '4,500' : '9,000' }}</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                :max="selectedForm === 'pnd94' ? 4500 : 9000"
                step="500"
                v-model.number="socialSecurity"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="ตามจ่ายจริง"
              />
            </div>
          </div>

          <!-- 7. Life & Health Insurance (max 100,000) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">7. ประกันชีวิต + สุขภาพตนเอง</label>
              <span class="text-[10px] text-gray-400">สูงสุด 100,000</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                max="100000"
                step="1000"
                v-model.number="lifeInsurance"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="ตามจ่ายจริง"
              />
            </div>
          </div>

          <!-- 8. Parents Health Insurance (max 15,000) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">8. ประกันสุขภาพบิดามารดา</label>
              <span class="text-[10px] text-gray-400">สูงสุด 15,000</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                max="15000"
                step="500"
                v-model.number="parentHealthInsurance"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="ตามจ่ายจริง"
              />
            </div>
          </div>

          <!-- 9. Retirement Funds SSF / RMF / Pension -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">9. กองทุนเกษียณ (SSF/RMF/บำนาญ)</label>
              <span class="text-[10px] text-gray-400">รวมไม่เกิน 500k</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                max="500000"
                step="5000"
                v-model.number="retirementFunds"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="ยอดซื้อกองทุน"
              />
            </div>
          </div>

          <!-- 10. Thai ESG Funds (max 300,000) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">10. กองทุน Thai ESG</label>
              <span class="text-[10px] text-gray-400">สูงสุด 300,000</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                max="300000"
                step="5000"
                v-model.number="thaiESGFunds"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="วงเงินพิเศษ Thai ESG"
              />
            </div>
          </div>

          <!-- 11. Home Loan Interest (max 100,000) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">11. ดอกเบี้ยกู้ยืมซื้อบ้าน</label>
              <span class="text-[10px] text-gray-400">สูงสุด 100,000</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                max="100000"
                step="1000"
                v-model.number="homeLoanInterest"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="ตามหนังสือรับรอง"
              />
            </div>
          </div>

          <!-- 12. Donations 2x (e-Donation) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">12. บริจาคการศึกษา/รพ.รัฐ (2 เท่า)</label>
              <span class="text-[10px] text-gray-400">หักได้ 2 เท่า</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                step="500"
                v-model.number="educationDonations"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="ยอดเงินบริจาคจริง"
              />
            </div>
          </div>

          <!-- 13. General Donations -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">13. เงินบริจาคทั่วไป</label>
              <span class="text-[10px] text-gray-400">ตามจริง</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                step="500"
                v-model.number="generalDonations"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="ตามใบเสร็จ"
              />
            </div>
          </div>

          <!-- 14. Withholding Tax Credit (50 ทวิ) -->
          <div class="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40">
            <div class="flex items-center justify-between">
              <label class="font-bold text-emerald-900">14. ภาษีถูกหัก ณ ที่จ่าย (50 ทวิ)</label>
              <span class="text-[10px] text-emerald-700 font-bold">เครดิตภาษี</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                step="500"
                v-model.number="withholdingTax"
                class="w-full rounded-lg border-emerald-300 py-1 px-2.5 text-xs font-bold text-emerald-900 bg-white"
                placeholder="ตามหนังสือรับรอง 50 ทวิ"
              />
            </div>
          </div>

          <!-- 15. Paid P.N.D.94 Mid-Year Tax (Only for P.N.D.90) -->
          <div v-if="selectedForm === 'pnd90'" class="p-3 rounded-xl border border-blue-200 bg-blue-50/40">
            <div class="flex items-center justify-between">
              <label class="font-bold text-blue-900">15. ภาษีที่จ่ายตาม ภ.ง.ด. 94 แล้ว</label>
              <span class="text-[10px] text-blue-700 font-bold">หักภาษีสิ้นปี</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                step="500"
                v-model.number="paidPnd94Tax"
                class="w-full rounded-lg border-blue-300 py-1 px-2.5 text-xs font-bold text-blue-900 bg-white"
                placeholder="ยอดภาษีครึ่งปีที่จ่ายแล้ว"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 6. Progressive Tax Brackets Table -->
      <div class="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <h3 class="text-base font-black text-gray-900 mb-1">
          ตารางอัตราภาษีเงินได้บุคคลธรรมดาแบบขั้นบันได (มาตรา 48(1))
        </h3>
        <p class="text-xs text-gray-500 mb-3.5">
          แถบสีเขียวแสดงขั้นบันไดที่ครอบคลุมเงินได้สุทธิของคุณ (฿{{ formatCurrency(activeCalculation.netTaxableIncome) }})
        </p>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-xs">
            <thead class="bg-gray-50 text-gray-600 font-bold">
              <tr>
                <th class="py-2.5 px-3 text-left">ช่วงเงินได้สุทธิ (บาท)</th>
                <th class="py-2.5 px-3 text-center">อัตราภาษี</th>
                <th class="py-2.5 px-3 text-right">ภาษีในแต่ละขั้น (บาท)</th>
                <th class="py-2.5 px-3 text-right">ภาษีสะสมสูงสุด (บาท)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 font-medium">
              <tr
                v-for="b in bracketsDisplay"
                :key="b.range"
                :class="b.isCurrent ? 'bg-emerald-50/80 font-bold text-emerald-950 border-l-4 border-l-emerald-600' : 'hover:bg-gray-50'"
              >
                <td class="py-2.5 px-3">
                  {{ b.range }}
                  <span v-if="b.isCurrent" class="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white">
                    ฐานของคุณ
                  </span>
                </td>
                <td class="py-2.5 px-3 text-center">{{ b.rate }}</td>
                <td class="py-2.5 px-3 text-right">{{ b.taxInStep }}</td>
                <td class="py-2.5 px-3 text-right">{{ b.accumTax }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 7. Tax Filing Calendar & Corporate Transition Guide -->
      <div class="grid gap-3.5 grid-cols-1 md:grid-cols-2">
        <!-- Filing Calendar Card -->
        <div class="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <Calendar class="h-5 w-5 text-indigo-600" />
            <h3 class="text-sm font-black text-gray-900">กำหนดเวลายื่นแบบภาษีเงินได้บุคคลธรรมดา</h3>
          </div>
          <div class="space-y-3 text-xs">
            <div class="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <div class="flex items-center justify-between font-bold text-indigo-900">
                <span>1. แบบ ภ.ง.ด. 94 (ภาษีครึ่งปี)</span>
                <span class="rounded bg-indigo-200/80 px-2 py-0.5 text-[10px]">1 ก.ค. - 30 ก.ย.</span>
              </div>
              <p class="text-indigo-800/90 mt-1 text-[11px]">
                สำหรับผู้มีเงินได้ 40(5) – 40(8) ที่ได้รับระหว่าง 1 ม.ค. – 30 มิ.ย. ยื่นภายใน 1 ก.ค. – 30 ก.ย. (ออนไลน์ได้ถึงต้น ต.ค.)
              </p>
            </div>

            <div class="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div class="flex items-center justify-between font-bold text-emerald-900">
                <span>2. แบบ ภ.ง.ด. 90 (ภาษีประจำปี)</span>
                <span class="rounded bg-emerald-200/80 px-2 py-0.5 text-[10px]">1 ม.ค. - 31 มี.ค.</span>
              </div>
              <p class="text-emerald-800/90 mt-1 text-[11px]">
                สำหรับเงินได้ทุกประเภทตลอดทั้งปี 1 ม.ค. – 31 ธ.ค. ยื่นภายในเดือน ม.ค. – มี.ค. ของปีถัดไป (ออนไลน์ได้ถึง 8 เม.ย.) โดยนำภาษีครึ่งปีที่ชำระแล้วมาหักกลบลบหนี้ได้
              </p>
            </div>
          </div>
        </div>

        <!-- Corporate Transition Advice -->
        <div class="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <TrendingUp class="h-5 w-5 text-blue-600" />
            <h3 class="text-sm font-black text-gray-900">คำแนะนำ: เมื่อไหร่ควรจดนิติบุคคล (บริษัท/หจก.)?</h3>
          </div>
          <div class="text-xs text-gray-600 space-y-2 leading-relaxed">
            <p>
              📌 <strong>เกณฑ์กำไร:</strong> เมื่อมีกำไรสุทธิเกิน <span class="font-bold text-blue-700">750,000 – 1,000,000 บาท/ปี</span> บุคคลธรรมดาจะเริ่มเสียภาษีที่ฐาน 20-25% ขณะที่นิติบุคคล (SME) เสียภาษีเพียง 15% (กำไร 300,001-3,000,000 บาท) และ 300,000 บาทแรกได้รับการยกเว้นภาษี
            </p>
            <p>
              📌 <strong>ความน่าเชื่อถือ:</strong> การเป็นนิติบุคคลช่วยสร้างเครดิตในการขอกู้สินเชื่อธุรกิจ และสามารถหักค่าใช้จ่ายตามจริงได้ครอบคลุมกว่า
            </p>
            <p class="text-[11px] text-gray-400 pt-1 border-t border-gray-100">
              * ควรคำนึงถึงค่าทำบัญชีและค่าสอบบัญชีรายปี (ประมาณ 15,000 - 30,000 บาท/ปี) ร่วมด้วย
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import Swal from "sweetalert2";
import { formatCurrency } from "../utils/formatUtils.js";
import { useSalesStore } from "../stores/salesStore.js";
import { useExpenseStore } from "../stores/expenseStore.js";
import {
  Calculator,
  Calendar,
  RefreshCw,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  BadgePercent,
  CheckCircle2,
  TrendingUp,
  ExternalLink,
  Copy,
} from "lucide-vue-next";

const salesStore = useSalesStore();
const expenseStore = useExpenseStore();

const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const selectedForm = ref("pnd90"); // 'pnd90' (Full year) or 'pnd94' (Mid year)
const loading = ref(false);

const yearOptions = computed(() => {
  const years = [];
  for (let y = currentYear - 3; y <= currentYear + 1; y++) {
    years.push(y);
  }
  return years;
});

// Deduction Method State: 'flat' (60%) or 'actual'
const expenseDeductionMethod = ref("flat");

// --- Allowances Form State ---
const hasSpouseAllowance = ref(false);
const firstChildCount = ref(0);
const secondChildCount = ref(0);
const parentsCareCount = ref(0);
const socialSecurity = ref(0);
const lifeInsurance = ref(0);
const parentHealthInsurance = ref(0);
const retirementFunds = ref(0);
const thaiESGFunds = ref(0);
const homeLoanInterest = ref(0);
const educationDonations = ref(0);
const generalDonations = ref(0);
const withholdingTax = ref(0);
const paidPnd94Tax = ref(0);

// --- Data Fetching ---
const loadData = async () => {
  loading.value = true;
  try {
    let filter = {};

    if (selectedForm.value === "pnd94") {
      // Mid-Year: Jan 1 to Jun 30
      const startDate = new Date(selectedYear.value, 0, 1);
      const endDate = new Date(selectedYear.value, 5, 30, 23, 59, 59, 999);
      filter = {
        mode: "custom",
        startDate,
        endDate,
      };
    } else {
      // Full Year: Jan 1 to Dec 31
      filter = {
        mode: "selectYear",
        year: selectedYear.value,
      };
    }

    await Promise.all([
      salesStore.fetchSales(filter),
      expenseStore.setFilter(filter),
    ]);
  } catch (error) {
    console.error("Error loading tax data:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

watch([selectedYear, selectedForm], () => {
  loadData();
});

// --- Sales & Expense Aggregations ---
const formRevenue = computed(() => {
  return salesStore.sales.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
});

const formActualExpenses = computed(() => {
  return expenseStore.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
});

// Full year aggregations for VAT & e-Payment warnings
const fullYearRevenue = computed(() => {
  if (selectedForm.value === "pnd90") return formRevenue.value;
  // If in P.N.D.94 mode, formRevenue is 6 months; we calculate VAT tracking proportionally or based on loaded
  return formRevenue.value;
});

const transferSales = computed(() => {
  return salesStore.sales.filter((s) => s.type !== "COD");
});

const fullYearTransferCount = computed(() => transferSales.value.length);

const fullYearTransferAmount = computed(() => {
  return transferSales.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
});

// VAT 1.8M Progress
const vatProgressPercent = computed(() => {
  if (fullYearRevenue.value <= 0) return 0;
  return Math.min(Math.round((fullYearRevenue.value / 1800000) * 100), 999);
});

// --- Active Allowances Total (Considering PND90 vs PND94 Half-Rule) ---
const activeAllowancesTotal = computed(() => {
  const isHalf = selectedForm.value === "pnd94";
  const factor = isHalf ? 0.5 : 1.0;

  let sum = 60000 * factor; // Personal allowance
  if (hasSpouseAllowance.value) sum += 60000 * factor;
  sum += (Number(firstChildCount.value) || 0) * 30000 * factor;
  sum += (Number(secondChildCount.value) || 0) * 60000 * factor;
  sum += (Number(parentsCareCount.value) || 0) * 30000 * factor;

  const ssCap = isHalf ? 4500 : 9000;
  sum += Math.min(Number(socialSecurity.value) || 0, ssCap);

  const lifeCap = isHalf ? 50000 : 100000;
  sum += Math.min(Number(lifeInsurance.value) || 0, lifeCap);

  const parentHealthCap = isHalf ? 7500 : 15000;
  sum += Math.min(Number(parentHealthInsurance.value) || 0, parentHealthCap);

  // Retirement funds capped at 500,000
  sum += Math.min(Number(retirementFunds.value) || 0, 500000);

  // Thai ESG capped at 300,000
  sum += Math.min(Number(thaiESGFunds.value) || 0, 300000);

  const homeCap = isHalf ? 50000 : 100000;
  sum += Math.min(Number(homeLoanInterest.value) || 0, homeCap);

  return Math.round(sum);
});

// --- Official RD Tax Calculations Helper Function ---
const calculateTaxForMethod = (deductionType) => {
  const revenue = formRevenue.value;
  let deductedExpense = 0;

  if (deductionType === "flat") {
    // 60% flat rate for Section 40(8) commerce
    deductedExpense = revenue * 0.6;
  } else {
    // Actual recorded business expenses
    deductedExpense = formActualExpenses.value;
  }

  const incomeAfterExpense = Math.max(0, revenue - deductedExpense);
  const incomeAfterAllowances = Math.max(0, incomeAfterExpense - activeAllowancesTotal.value);

  // Donations deduction: max 10% of income after allowances
  const maxDonationsAllowed = incomeAfterAllowances * 0.10;
  const rawDonationsDeduction =
    (Number(educationDonations.value) || 0) * 2 + (Number(generalDonations.value) || 0);
  const donationsDeduction = Math.min(rawDonationsDeduction, maxDonationsAllowed);

  const netTaxableIncome = Math.max(0, incomeAfterAllowances - donationsDeduction);

  // Progressive Tax Calculation (0 - 35%)
  let progressiveTax = 0;
  let highestRate = 0;

  if (netTaxableIncome > 0) {
    let remaining = netTaxableIncome;

    // 0 - 150,000 @ 0%
    const step1 = Math.min(remaining, 150000);
    remaining -= step1;
    if (step1 > 0) highestRate = 0;

    // 150,001 - 300,000 @ 5% (max 150,000)
    if (remaining > 0) {
      const step2 = Math.min(remaining, 150000);
      progressiveTax += step2 * 0.05;
      remaining -= step2;
      highestRate = 5;
    }

    // 300,001 - 500,000 @ 10% (max 200,000)
    if (remaining > 0) {
      const step3 = Math.min(remaining, 200000);
      progressiveTax += step3 * 0.10;
      remaining -= step3;
      highestRate = 10;
    }

    // 500,001 - 750,000 @ 15% (max 250,000)
    if (remaining > 0) {
      const step4 = Math.min(remaining, 250000);
      progressiveTax += step4 * 0.15;
      remaining -= step4;
      highestRate = 15;
    }

    // 750,001 - 1,000,000 @ 20% (max 250,000)
    if (remaining > 0) {
      const step5 = Math.min(remaining, 250000);
      progressiveTax += step5 * 0.20;
      remaining -= step5;
      highestRate = 20;
    }

    // 1,000,001 - 2,000,000 @ 25% (max 1,000,000)
    if (remaining > 0) {
      const step6 = Math.min(remaining, 1000000);
      progressiveTax += step6 * 0.25;
      remaining -= step6;
      highestRate = 25;
    }

    // 2,000,001 - 5,000,000 @ 30% (max 3,000,000)
    if (remaining > 0) {
      const step7 = Math.min(remaining, 3000000);
      progressiveTax += step7 * 0.30;
      remaining -= step7;
      highestRate = 30;
    }

    // > 5,000,000 @ 35%
    if (remaining > 0) {
      progressiveTax += remaining * 0.35;
      highestRate = 35;
    }
  }

  // Method 2: 0.5% flat minimum tax rule under Section 48(2)
  // Law rule: If Method 2 <= 5,000 THB, it is exempt by law!
  const rawMethod2Tax = revenue * 0.005;
  const method2Waived = rawMethod2Tax <= 5000;
  const effectiveMethod2Tax = method2Waived ? 0 : rawMethod2Tax;

  const usedFlat05PercentRule = effectiveMethod2Tax > progressiveTax;
  const taxBeforeCredits = usedFlat05PercentRule ? effectiveMethod2Tax : progressiveTax;

  // Subtract Tax Credits: Withholding Tax (50 ทวิ) + Paid PND94 Tax
  const totalCredits = (Number(withholdingTax.value) || 0) + (selectedForm.value === "pnd90" ? (Number(paidPnd94Tax.value) || 0) : 0);
  const finalBalance = Math.round(taxBeforeCredits - totalCredits);

  return {
    deductedExpenseAmount: Math.round(deductedExpense),
    incomeAfterExpense: Math.round(incomeAfterExpense),
    donationsDeduction: Math.round(donationsDeduction),
    netTaxableIncome: Math.round(netTaxableIncome),
    progressiveTax: Math.round(progressiveTax),
    rawMethod2Tax: Math.round(rawMethod2Tax),
    method2Waived,
    highestBracketPercent: highestRate,
    usedFlat05PercentRule,
    taxBeforeCredits: Math.round(taxBeforeCredits),
    finalBalance,
  };
};

const flatCalculation = computed(() => calculateTaxForMethod("flat"));
const actualCalculation = computed(() => calculateTaxForMethod("actual"));

const activeCalculation = computed(() => {
  return expenseDeductionMethod.value === "flat"
    ? flatCalculation.value
    : actualCalculation.value;
});

// Determine which method saves more tax
const recommendedMethod = computed(() => {
  return actualCalculation.value.finalBalance < flatCalculation.value.finalBalance
    ? "actual"
    : "flat";
});

const taxSavingsDifference = computed(() => {
  return Math.abs(flatCalculation.value.finalBalance - actualCalculation.value.finalBalance);
});

// e-Filing Line-by-Line Copy Fields
const eFilingFields = computed(() => {
  const calc = activeCalculation.value;
  const list = [
    { step: "ช่อง 1", label: "เงินได้พึงประเมิน 40(8)", value: formRevenue.value },
    { step: "ช่อง 2", label: `หักค่าใช้จ่าย (${expenseDeductionMethod.value === 'flat' ? 'เหมา 60%' : 'ตามจริง'})`, value: calc.deductedExpenseAmount },
    { step: "ช่อง 3", label: "เงินได้หลังหักค่าใช้จ่าย", value: calc.incomeAfterExpense },
    { step: "ช่อง 4", label: "หักค่าลดหย่อนรวม", value: activeAllowancesTotal.value },
    { step: "ช่อง 5", label: "เงินได้สุทธิ", value: calc.netTaxableIncome },
    { step: "ช่อง 6", label: "ภาษีที่คำนวณได้", value: calc.taxBeforeCredits },
    { step: "ช่อง 7", label: "หัก: ภาษีหัก ณ ที่จ่าย (50 ทวิ)", value: Number(withholdingTax.value) || 0 },
  ];

  if (selectedForm.value === "pnd90") {
    list.push({ step: "ช่อง 8", label: "หัก: ภาษีที่ชำระตาม ภ.ง.ด. 94", value: Number(paidPnd94Tax.value) || 0 });
    list.push({ step: "ช่อง 9", label: calc.finalBalance >= 0 ? "ภาษีที่ต้องชำระเพิ่มเติม" : "ภาษีที่ชำระไว้เกิน (ขอคืน)", value: Math.abs(calc.finalBalance) });
  } else {
    list.push({ step: "ช่อง 8", label: calc.finalBalance >= 0 ? "ภาษีครึ่งปีที่ต้องชำระ" : "ภาษีที่ชำระไว้เกิน", value: Math.abs(calc.finalBalance) });
  }

  return list;
});

// Copy to Clipboard
const copyToClipboard = async (value, label) => {
  try {
    await navigator.clipboard.writeText(String(value));
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: false,
    });
    Toast.fire({
      icon: "success",
      title: `คัดลอก ${label} (฿${formatCurrency(value)}) เรียบร้อยแล้ว`,
    });
  } catch (err) {
    console.error("Clipboard copy failed:", err);
  }
};

// Tax Brackets Display List with Active Highlighter
const bracketsDisplay = computed(() => {
  const net = activeCalculation.value.netTaxableIncome;
  return [
    { range: "0 - 150,000", rate: "0% (ยกเว้น)", taxInStep: "0", accumTax: "0", isCurrent: net <= 150000 },
    { range: "150,001 - 300,000", rate: "5%", taxInStep: "7,500", accumTax: "7,500", isCurrent: net > 150000 && net <= 300000 },
    { range: "300,001 - 500,000", rate: "10%", taxInStep: "20,000", accumTax: "27,500", isCurrent: net > 300000 && net <= 500000 },
    { range: "500,001 - 750,000", rate: "15%", taxInStep: "37,500", accumTax: "65,000", isCurrent: net > 500000 && net <= 750000 },
    { range: "750,001 - 1,000,000", rate: "20%", taxInStep: "50,000", accumTax: "115,000", isCurrent: net > 750000 && net <= 1000000 },
    { range: "1,000,001 - 2,000,000", rate: "25%", taxInStep: "250,000", accumTax: "365,000", isCurrent: net > 1000000 && net <= 2000000 },
    { range: "2,000,001 - 5,000,000", rate: "30%", taxInStep: "900,000", accumTax: "1,265,000", isCurrent: net > 2000000 && net <= 5000000 },
    { range: "5,000,001 ขึ้นไป", rate: "35%", taxInStep: "ตามจริง", accumTax: "-", isCurrent: net > 5000000 },
  ];
});
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
