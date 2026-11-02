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
            ประมาณการภาษีบุคคลธรรมดาขายสินค้าออนไลน์แบบซื้อมาขายไป รวมโอนและ COD จากร้านนี้
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
          @click="loadData(true)"
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
          — {{ selectedForm === 'pnd94' ? 'สรุปรายได้และรายจ่ายช่วง 6 เดือนแรก (1 ม.ค. – 30 มิ.ย.) ใช้ยอดจ่ายจริงครึ่งปีและค่าลดหย่อนตามประเภท ยื่น ก.ค. - ก.ย.' : 'สรุปรายได้และรายจ่ายทั้งปี (1 ม.ค. – 31 ธ.ค.) ยื่น ม.ค. - มี.ค. ของปีถัดไป' }}
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

    <div v-else-if="loadError" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">โหลดข้อมูลไม่ครบ จึงไม่แสดงผลภาษี: {{ loadError }} <button @click="loadData()" class="underline">ลองอีกครั้ง</button></div>
    <div v-else class="space-y-4 animate-fade-in-up">
      <!-- 2. Legal Thresholds & Warning Trackers (VAT 1.8M & e-Payment) -->
      <div class="grid gap-3.5 grid-cols-1 md:grid-cols-2">
        <!-- VAT 1.8 Million Threshold Tracker -->
        <div
          class="rounded-2xl border bg-white p-4 md:p-5 shadow-sm transition-all relative overflow-hidden"
          :class="vatExceeded ? 'border-rose-300 bg-rose-50/20' : (vatProgressPercent >= 80 ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200')"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span
                  class="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  :class="vatExceeded ? 'bg-rose-100 text-rose-700' : (vatProgressPercent >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')"
                >
                  ภาษีมูลค่าเพิ่ม (VAT)
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
              :class="vatExceeded ? 'bg-rose-100 text-rose-600' : (vatProgressPercent >= 80 ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600')"
            >
              <ShieldAlert v-if="vatProgressPercent >= 80" class="h-6 w-6" />
              <ShieldCheck v-else class="h-6 w-6" />
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mt-3">
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span :class="vatExceeded ? 'text-rose-600 font-bold' : (vatProgressPercent >= 80 ? 'text-amber-600 font-bold' : 'text-gray-600')">
                {{ vatExceeded ? '⚠️ เกินเกณฑ์ 1.8 ล้านแล้ว' : (vatProgressPercent >= 80 ? '⚡ ใกล้ถึงเกณฑ์ 1.8 ล้าน' : 'รายรับที่บันทึกยังไม่เกินเกณฑ์') }}
              </span>
              <span class="font-bold text-gray-800">{{ vatProgressPercent }}%</span>
            </div>
            <div class="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                class="h-full transition-all duration-500 rounded-full"
                :class="vatExceeded ? 'bg-rose-500' : (vatProgressPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500')"
                :style="{ width: `${Math.min(vatProgressPercent, 100)}%` }"
              ></div>
            </div>
          </div>

          <!-- Notice / Details -->
          <div class="mt-3 pt-2.5 border-t border-gray-100 text-xs text-gray-600">
            <p v-if="vatExceeded" class="text-rose-700 font-semibold flex items-center gap-1">
              <AlertTriangle class="h-4 w-4 shrink-0" />
              ต้องยื่นจดทะเบียนภาษีมูลค่าเพิ่มภายใน 30 วันนับแต่วันที่รายรับเกิน 1.8 ล้านบาท · กำหนดตามข้อมูลในระบบ {{ vatDeadline }}
            </p>
            <p v-else-if="vatProgressPercent >= 80" class="text-amber-700">
              ยอดขายทั้งปีเหลืออีก <strong class="font-bold">฿{{ formatCurrency(Math.max(0, 1800000 - fullYearRevenue)) }}</strong> จะถึงเกณฑ์ 1.8 ล้าน ควรเตรียมวางแผนภาษีและระบบออกใบกำกับภาษี
            </p>
            <p v-else class="text-gray-500">
              ยอดขายทั้งปีห่างจากเพดาน <strong>฿{{ formatCurrency(Math.max(0, 1800000 - fullYearRevenue)) }}</strong> ตรวจรายรับทุกช่องทางและสถานะจดทะเบียนเดิมร่วมด้วย
            </p>
          </div>
        </div>

        <div class="rounded-2xl border bg-white p-5 text-sm text-gray-700">
          <h3 class="font-bold">ขอบเขตและหน้าที่ยื่นแบบ</h3>
          <p class="mt-2">{{ activeCalculation.filingRequired ? 'รายได้ร้านนี้เกินเกณฑ์ต้องยื่นแบบ แม้ภาษีคำนวณได้เป็นศูนย์' : 'รายได้ร้านนี้ยังไม่เกินเกณฑ์ยื่น โปรดตรวจรายได้อื่นและเงินได้คู่สมรสร่วมด้วย' }}</p>
          <p class="mt-2 text-xs">โสดเกิน 60,000 บาท · สมรสรวมเกิน 120,000 บาท ในช่วงของแบบที่เลือก หากมีเงินเดือนหรือเงินได้อื่นต้องรวมในแบบจริง</p>
          <p class="mt-2 text-xs">ปีและแบบที่เลือกมีข้อมูลลดหย่อนแยกกัน กรอกยอดจ่ายเฉพาะช่วงนั้น ห้ามนำยอดจ่ายทั้งปีมาใช้ซ้ำกับครึ่งปี</p>
          <p v-if="rules.annualProvisional && selectedForm === 'pnd90'" class="mt-2 text-xs text-amber-800">สิ้นปี 2569 เป็นประมาณการจากกฎที่ตรวจได้ ณ 2 พ.ย. 2569 ต้องตรวจคู่มือสิ้นปีและมาตรการเพิ่มเติมก่อนยื่น</p>
          <p class="mt-2 text-xs">การรายงานธุรกรรมของธนาคารต้องใช้ข้อมูลบัญชีจริง จำนวนออเดอร์ในระบบไม่ใช่จำนวนครั้งรับโอน</p>
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

        <p class="mt-3 text-xs text-gray-600">ตามจริงใช้เฉพาะรายจ่ายที่ยืนยันสิทธิหักและระบุหลักฐาน ไม่รวมต้นทุนซักรีดประมาณการ ยังไม่ยืนยัน/ไม่มีหลักฐาน {{ excludedExpenses }} รายการ <RouterLink to="/expenses" class="font-bold text-emerald-800 underline">จัดการรายจ่าย</RouterLink></p>
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
              {{ taxSavingsDifference === 0 ? 'ให้ภาษีเท่ากันทั้งสองวิธี ส่วนต่าง' : 'ให้ภาษีน้อยกว่าอีกวิธี จากข้อมูลที่ยืนยันแล้ว' }}
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
              หลังหักค่าใช้จ่าย & ค่าลดหย่อน{{ selectedForm === 'pnd94' ? ' ตามสิทธิครึ่งปี' : '' }}
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
              {{ activeCalculation.finalBalance >= 0 ? (activeCalculation.usedFlat05PercentRule ? '(คิดจากภาษีเหมา 0.5% ม.48(2))' : '(คำนวณตามอัตราก้าวหน้า)') : 'ชำระไว้เกินโดยประมาณ ต้องตรวจแบบจริง' }}
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
              <span>4. หัก: ค่าลดหย่อนรวม{{ selectedForm === 'pnd94' ? ' (ตามประเภทสิทธิครึ่งปี)' : '' }}</span>
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
                {{ activeCalculation.method2Waived ? '฿' + formatCurrency(activeCalculation.rawMethod2Tax) + ' (ยกเว้น: ไม่เกิน 5,000 บ.)' : '฿' + formatCurrency(activeCalculation.rawMethod2Tax) }}
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
              สรุปเพื่อตรวจเทียบ e-Filing (ไม่ใช่หมายเลขช่องจริง) {{ selectedForm === 'pnd94' ? 'แบบ ภ.ง.ด. 94' : 'แบบ ภ.ง.ด. 90' }} ตรวจสิทธิและตัวเลขในแบบจริงก่อนยื่น
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
              กรอกเฉพาะยอดจ่ายจริงที่เข้าเงื่อนไขและมีหลักฐาน ในช่วงของแบบที่เลือก
            </p>
          </div>
          <div class="text-right">
            <span class="text-xs text-gray-400">ค่าลดหย่อนที่ใช้ได้จริง</span>
            <p class="text-base font-black text-emerald-700">฿{{ formatCurrency(activeAllowancesTotal) }}</p>
          </div>
        </div>

        <div class="my-3 space-y-2 text-xs text-gray-700">
          <label>สถานภาพ <select v-model="inputs.maritalStatus" class="rounded-lg border-gray-300 text-xs"><option value="single">โสด</option><option value="marriedNoIncome">สมรส คู่สมรสไม่มีเงินได้</option><option value="marriedSeparate">สมรส ต่างฝ่ายมีเงินได้ แยกยื่น</option></select></label>
          <label class="block">ประกันสังคม <select v-model="inputs.socialSecurityType" class="rounded-lg border-gray-300 text-xs"><option value="39">ม.39</option><option value="40">ม.40</option><option value="33">ม.33 (ตรวจเงินเดือนในแบบจริงด้วย)</option></select></label>
          <label class="block">ดอกเบี้ยบ้าน: ผู้ให้กู้ <select v-model="inputs.homeLoanLender" class="rounded-lg border-gray-300 text-xs"><option value="bank">ธนาคาร/ผู้ให้กู้ทั่วไปตามเกณฑ์</option><option value="eligibleFund">กองทุนที่ได้สิทธิเต็มตามคู่มือ</option></select> ผู้กู้ร่วมกรอกเฉพาะสิทธิของตน</label>
          <p>บุตรสองช่องห้ามนับซ้ำคน ตรวจอายุ/การศึกษา/เงินได้และเพดานบุตรบุญธรรม · บิดามารดาตรวจรายได้และไม่ใช้สิทธิซ้ำพี่น้อง · ประกันชีวิตตรวจกรมธรรม์ตั้งแต่ 10 ปีตามเงื่อนไข</p>
          <p>บริจาค: ตรวจผู้รับและช่วงเวลามาตรการ พร้อมหลักฐาน/e-Donation ตามปี ก่อนกรอกยอดที่ใช้สิทธิได้ · Thai ESGX ซื้อใหม่ปี 2569 รวมวงเงินกับ Thai ESG ส่วน LTF สับเปลี่ยนและสิทธิพิเศษอื่นให้ตรวจเพิ่มในแบบจริง</p>
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
              <input type="checkbox" :disabled="inputs.maritalStatus !== 'marriedNoIncome'" v-model="hasSpouseAllowance" class="rounded text-emerald-600 h-4 w-4 cursor-pointer" />
            </div>
            <div class="mt-2 text-sm font-bold text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">
              {{ hasSpouseAllowance ? '฿' + formatCurrency(selectedForm === 'pnd94' ? 30000 : 60000) : '฿0' }}
            </div>
            <p class="text-[10px] text-gray-400 mt-1">ตรวจคุณสมบัติคู่สมรสตามแบบที่เลือก</p>
          </div>

          <!-- 3. First Child (30,000 / child) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label for="tax-firstChildCount" class="font-bold text-gray-800">3. บุตรที่ได้สิทธิปกติ ({{ selectedForm === 'pnd94' ? '15,000' : '30,000' }} บ./คน)</label>
              <span class="font-bold text-emerald-700">฿{{ formatCurrency(firstChildCount * (selectedForm === 'pnd94' ? 15000 : 30000)) }}</span>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="10"
                id="tax-firstChildCount" v-model.number="firstChildCount"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
              />
              <span class="text-gray-500 shrink-0">คน</span>
            </div>
          </div>

          <!-- 4. Second Child Born 2018+ (60,000 / child) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label for="tax-secondChildCount" class="font-bold text-gray-800">4. บุตรคนที่ 2 ขึ้นไป (เกิดปี 61+)</label>
              <span class="font-bold text-emerald-700">฿{{ formatCurrency(secondChildCount * (selectedForm === 'pnd94' ? 45000 : 60000)) }}</span>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="10"
                id="tax-secondChildCount" v-model.number="secondChildCount"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
              />
              <span class="text-gray-500 shrink-0">คน</span>
            </div>
          </div>

          <!-- 5. Parents Care (30,000 / parent, max 4) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label for="tax-parentsCareCount" class="font-bold text-gray-800">5. อุปการะบิดามารดา (อายุ 60+)</label>
              <span class="font-bold text-emerald-700">฿{{ formatCurrency(parentsCareCount * (selectedForm === 'pnd94' ? 15000 : 30000)) }}</span>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                :max="inputs.maritalStatus === 'marriedNoIncome' ? 4 : 2"
                id="tax-parentsCareCount" v-model.number="parentsCareCount"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
              />
              <span class="text-gray-500 shrink-0">คน (ตามสิทธิของตนและคู่สมรส)</span>
            </div>
          </div>

          <!-- 6. Social Security (max 9,000) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label for="tax-socialSecurity" class="font-bold text-gray-800">6. ประกันสังคม (ม.33/39/40)</label>
              <span class="text-[10px] text-gray-500">ตามประเภทและยอดจ่ายจริง</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                :max="rules.socialSecurityAnnualCaps[inputs.socialSecurityType] * (selectedForm === 'pnd94' ? .5 : 1)"
                step="500"
                id="tax-socialSecurity" v-model.number="socialSecurity"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="ตามจ่ายจริง"
              />
            </div>
          </div>

          <!-- 7. Life & Health Insurance (max 100,000) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label for="tax-lifeInsurance" class="font-bold text-gray-800">7. เบี้ยประกันชีวิตที่เข้าเงื่อนไข</label>
              <span class="text-[10px] text-gray-400">สูงสุด 100,000</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                max="100000"
                step="1000"
                id="tax-lifeInsurance" v-model.number="lifeInsurance"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="ตามจ่ายจริง"
              />
            </div>
          </div>

          <!-- 8. Parents Health Insurance (max 15,000) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label for="tax-parentHealthInsurance" class="font-bold text-gray-800">8. ประกันสุขภาพบิดามารดา</label>
              <span class="text-[10px] text-gray-400">สูงสุด 15,000</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                max="15000"
                step="500"
                id="tax-parentHealthInsurance" v-model.number="parentHealthInsurance"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="ตามจ่ายจริง"
              />
            </div>
          </div>

          <!-- 9. Retirement Funds SSF / RMF / Pension -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label for="tax-retirementFunds" class="font-bold text-gray-800">9. กองทุน RMF (เพดาน 30% ของเงินได้)</label>
              <span class="text-[10px] text-gray-400">รวมไม่เกิน 500k</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                max="500000"
                step="5000"
                id="tax-retirementFunds" v-model.number="retirementFunds"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="ยอดซื้อกองทุน"
              />
            </div>
          </div>

          <label v-for="f in additionalFields" :key="f.key" class="p-3 rounded-xl border border-gray-200 bg-white">
            <span class="font-bold text-gray-800">{{ f.label }}</span><input type="number" min="0" step="0.01" :id="`tax-${f.key}`" v-model.number="inputs[f.key]" :disabled="f.disabled" class="mt-2 w-full rounded-lg border-gray-300 text-xs disabled:bg-gray-100" /><span class="mt-1 block text-xs text-gray-600">{{ f.help }}</span>
          </label>
          <!-- 10. Thai ESG Funds (max 300,000) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label for="tax-thaiESGFunds" class="font-bold text-gray-800">10. กองทุน Thai ESG</label>
              <span class="text-[10px] text-gray-400">สูงสุด {{ formatCurrency(rules.thaiESGCap) }} และ 30%</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                :max="rules.thaiESGCap"
                step="5000"
                id="tax-thaiESGFunds" v-model.number="thaiESGFunds"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="วงเงินพิเศษ Thai ESG"
              />
            </div>
          </div>

          <!-- 11. Home Loan Interest (max 100,000) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label for="tax-homeLoanInterest" class="font-bold text-gray-800">11. ดอกเบี้ยกู้ยืมซื้อบ้าน</label>
              <span class="text-[10px] text-gray-400">สูงสุด 100,000</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                max="100000"
                step="1000"
                id="tax-homeLoanInterest" v-model.number="homeLoanInterest"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="ตามหนังสือรับรอง"
              />
            </div>
          </div>

          <!-- 12. Donations 2x (e-Donation) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label for="tax-educationDonations" class="font-bold text-gray-800">12. บริจาคที่ตรวจสิทธิสองเท่าแล้ว</label>
              <span class="text-[10px] text-gray-400">หักได้ 2 เท่า</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                step="500"
                id="tax-educationDonations" v-model.number="educationDonations"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="ยอดเงินบริจาคจริง"
              />
            </div>
          </div>

          <!-- 13. General Donations -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label for="tax-generalDonations" class="font-bold text-gray-800">13. เงินบริจาคทั่วไป</label>
              <span class="text-[10px] text-gray-400">ตามจริง</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                step="500"
                id="tax-generalDonations" v-model.number="generalDonations"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="ยอดที่มีสิทธิตามเกณฑ์ e-Donation"
              />
            </div>
          </div>

          <!-- 14. Withholding Tax Credit (50 ทวิ) -->
          <div class="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40">
            <div class="flex items-center justify-between">
              <label for="tax-withholdingTax" class="font-bold text-emerald-900">14. ภาษีถูกหัก ณ ที่จ่าย (50 ทวิ)</label>
              <span class="text-[10px] text-emerald-700 font-bold">เครดิตภาษี</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                step="500"
                id="tax-withholdingTax" v-model.number="withholdingTax"
                class="w-full rounded-lg border-emerald-300 py-1 px-2.5 text-xs font-bold text-emerald-900 bg-white"
                placeholder="ตามหนังสือรับรอง 50 ทวิ"
              />
            </div>
          </div>

          <!-- 15. Paid P.N.D.94 Mid-Year Tax (Only for P.N.D.90) -->
          <div v-if="selectedForm === 'pnd90'" class="p-3 rounded-xl border border-blue-200 bg-blue-50/40">
            <div class="flex items-center justify-between">
              <label for="tax-paidPnd94Tax" class="font-bold text-blue-900">15. ภาษีที่จ่ายตาม ภ.ง.ด. 94 แล้ว</label>
              <span class="text-[10px] text-blue-700 font-bold">หักภาษีสิ้นปี</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                step="500"
                id="tax-paidPnd94Tax" v-model.number="paidPnd94Tax"
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
                สำหรับผู้มีเงินได้ 40(5) – 40(8) ที่ได้รับระหว่าง 1 ม.ค. – 30 มิ.ย. ยื่นภายใน 1 ก.ค. – 30 ก.ย. (ออนไลน์ตรวจวันขยายเวลาตามประกาศปีที่ยื่น)
              </p>
            </div>

            <div class="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div class="flex items-center justify-between font-bold text-emerald-900">
                <span>2. แบบ ภ.ง.ด. 90 (ภาษีประจำปี)</span>
                <span class="rounded bg-emerald-200/80 px-2 py-0.5 text-[10px]">1 ม.ค. - 31 มี.ค.</span>
              </div>
              <p class="text-emerald-800/90 mt-1 text-[11px]">
                สำหรับเงินได้ทุกประเภทตลอดทั้งปี 1 ม.ค. – 31 ธ.ค. ยื่นภายในเดือน ม.ค. – มี.ค. ของปีถัดไป (ออนไลน์ตรวจวันขยายเวลาตามประกาศปีที่ยื่น) โดยนำภาษีครึ่งปีที่ชำระแล้วมาหักกลบลบหนี้ได้
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
            <p>ควรเปรียบเทียบภาษีของกิจการ ภาษีเจ้าของ และค่าทำบัญชีร่วมกัน อัตราภาษีขั้นสูงสุดของบุคคลธรรมดาไม่ใช่อัตราภาษีเฉลี่ย จึงไม่ใช้กำไรถึงจำนวนหนึ่งเป็นเกณฑ์แนะนำจดบริษัทอัตโนมัติ</p>
            <p><a href="https://www.rd.go.th/fileadmin/tax_pdf/pit/2569/Ins94_160669.pdf" target="_blank" rel="noopener noreferrer" class="underline">คู่มือ ภ.ง.ด.94 ปี 2569</a> · <a href="https://www.rd.go.th/fileadmin/tax_pdf/pit/2568/Ins90_241268.pdf" target="_blank" rel="noopener noreferrer" class="underline">คู่มือ ภ.ง.ด.90 ปี 2568</a> · <a href="https://www.rd.go.th/2375.html" target="_blank" rel="noopener noreferrer" class="underline">เกณฑ์ค่าใช้จ่าย</a></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from "vue";
import Swal from "sweetalert2";
import { formatCurrency } from "../utils/formatUtils.js";
import { toDate } from "../utils/dateUtils.js";
import { getAllSales } from "../services/salesService.js";
import { getAllExpenses } from "../services/expenseService.js";
import { addDays } from "date-fns";
import { TAX_YEARS, taxRules, emptyTaxInputs, calculateRetailTax, isInTaxPeriod, sumTaxExpenses, vatStatus, money, nonNegative } from "../utils/taxUtils.js";
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

const currentYear = Math.min(new Date().getFullYear(), Math.max(...TAX_YEARS));
const selectedYear = ref(currentYear);
const selectedForm = ref("pnd90");
const yearOptions = TAX_YEARS;
const loading = ref(false), loadError = ref("");
const expenseDeductionMethod = ref("flat");
const yearlySales = ref([]), yearlyExpenses = ref([]);
const profiles = reactive({});
watch([selectedYear, selectedForm], () => {
  const key = `${selectedYear.value}:${selectedForm.value}`;
  if (!profiles[key]) profiles[key] = emptyTaxInputs();
}, { immediate: true, flush: "sync" });
const inputs = computed(() => profiles[`${selectedYear.value}:${selectedForm.value}`]);
const rules = computed(() => taxRules(selectedYear.value));
const field = key => computed({ get: () => inputs.value[key], set: value => { inputs.value[key] = value; } });
const hasSpouseAllowance = field("spouseAllowance");
const firstChildCount = field("ordinaryChildren"), secondChildCount = field("additionalChildren");
const parentsCareCount = field("parents"), socialSecurity = field("socialSecurity");
const lifeInsurance = field("lifeInsurance"), parentHealthInsurance = field("parentHealthInsurance");
const retirementFunds = field("rmf"), thaiESGFunds = field("thaiESG");
const homeLoanInterest = field("homeLoanInterest"), educationDonations = field("doubleDonations");
const generalDonations = field("generalDonations"), withholdingTax = field("withholdingTax"), paidPnd94Tax = field("paidPnd94Tax");
let generation = 0;
const loadData = async () => {
  const request = ++generation, year = selectedYear.value;
  loading.value = true; loadError.value = "";
  try {
    const filter = { mode: "selectYear", year };
    // Local atomic snapshot: another page's filter cannot change a tax result.
    const [sales, expenses] = await Promise.all([getAllSales(filter), getAllExpenses(filter)]);
    if (request !== generation) return;
    yearlySales.value = sales.filter(s => isInTaxPeriod(s.dateTime || s.date, year));
    yearlyExpenses.value = expenses.filter(e => isInTaxPeriod(e.dateTime || e.date, year));
  } catch (error) {
    if (request === generation) loadError.value = error.message || "โหลดข้อมูลไม่สำเร็จ";
  } finally {
    if (request === generation) loading.value = false;
  }
};
watch(selectedYear, loadData, { immediate: true });
onUnmounted(() => { generation++; });
const formSales = computed(() => yearlySales.value.filter(s => isInTaxPeriod(s.dateTime || s.date, selectedYear.value, selectedForm.value)));
const formExpenses = computed(() => yearlyExpenses.value.filter(e => isInTaxPeriod(e.dateTime || e.date, selectedYear.value, selectedForm.value)));
const formRevenue = computed(() => money(formSales.value.reduce((sum, s) => sum + nonNegative(s.amount), 0)));
const formActualExpenses = computed(() => sumTaxExpenses(formExpenses.value));
const excludedExpenses = computed(() => formExpenses.value.filter(e => e.isAuto || !e.taxDeductible || !String(e.taxEvidence || "").trim()).length);
const fullYearRevenue = computed(() => money(yearlySales.value.reduce((sum, s) => sum + nonNegative(s.amount), 0)));
const vat = computed(() => vatStatus(fullYearRevenue.value));
const vatProgressPercent = computed(() => vat.value.percent);
const vatExceeded = computed(() => vat.value.exceeded);
const vatCrossingDate = computed(() => {
  let sum = 0;
  for (const sale of [...yearlySales.value].sort((a, b) => toDate(a.dateTime || a.date) - toDate(b.dateTime || b.date))) {
    sum += nonNegative(sale.amount);
    if (sum > 1800000) return toDate(sale.dateTime || sale.date);
  }
  return null;
});
const vatDeadline = computed(() => vatCrossingDate.value ? addDays(vatCrossingDate.value, 30).toLocaleDateString("th-TH", {timeZone: "Asia/Bangkok"}) : "");
const calculateTaxForMethod = method => calculateRetailTax({ year: selectedYear.value, form: selectedForm.value, revenue: formRevenue.value, actualExpenses: formActualExpenses.value, method, inputs: inputs.value });
const flatCalculation = computed(() => calculateTaxForMethod("flat"));
const actualCalculation = computed(() => calculateTaxForMethod("actual"));
const activeCalculation = computed(() => expenseDeductionMethod.value === "flat" ? flatCalculation.value : actualCalculation.value);
const activeAllowancesTotal = computed(() => activeCalculation.value.allowances.total);
const recommendedMethod = computed(() => actualCalculation.value.taxBeforeCredits < flatCalculation.value.taxBeforeCredits ? "actual" : "flat");
const taxSavingsDifference = computed(() => money(Math.abs(flatCalculation.value.taxBeforeCredits - actualCalculation.value.taxBeforeCredits)));
const additionalFields = computed(() => [
  { key: "healthInsurance", label: "ประกันสุขภาพตนเอง", help: "ไม่เกิน 25,000 บาท ใช้เพดานร่วมกับประกันชีวิต" },
  { key: "ssf", label: "SSF", help: rules.value.ssfCap ? "30% ของเงินได้ ไม่เกิน 200,000 รวมเพดานเกษียณ" : "ซื้อใหม่หลังปี 2567 ไม่ได้สิทธินี้", disabled: !rules.value.ssfCap },
  { key: "pensionInsurance", label: "เบี้ยประกันชีวิตแบบบำนาญ", help: "เติมสิทธิประกันชีวิตที่เหลือ ก่อนคิดสิทธิบำนาญ 15% ไม่เกิน 200,000" },
  { key: "otherRetirement", label: "เงินสะสมเกษียณอื่นที่ตรวจสิทธิแล้ว", help: "เฉพาะยอดที่ผ่านเพดานเฉพาะประเภทแล้ว รวม RMF/SSF/บำนาญไม่เกิน 500,000" },
]);
const eFilingFields = computed(() => {
  const c = activeCalculation.value;
  const rows = [
    ["เงินได้ขายสินค้าออนไลน์ 40(8)", formRevenue.value], ["หักค่าใช้จ่าย", c.deductedExpenseAmount],
    ["เงินได้หลังหักค่าใช้จ่าย", c.incomeAfterExpense], ["ค่าลดหย่อนและยกเว้นรวม", c.allowances.total],
    ["บริจาคสองเท่าที่ใช้สิทธิได้", c.doubleDonationDeduction], ["บริจาคทั่วไปที่ใช้สิทธิได้", c.generalDonationDeduction],
    ["เงินได้สุทธิ", c.netTaxableIncome], ["ภาษีก่อนเครดิต", c.taxBeforeCredits], ["ภาษีหัก ณ ที่จ่ายของรายได้ที่นำมาคำนวณ", money(inputs.value.withholdingTax)],
  ];
  if (selectedForm.value === "pnd90") rows.push(["ภาษี ภ.ง.ด.94 ที่ชำระจริง", money(inputs.value.paidPnd94Tax)]);
  rows.push([c.finalBalance < 0 ? "ชำระไว้เกินโดยประมาณ" : "ต้องชำระโดยประมาณ", Math.abs(c.finalBalance)]);
  return rows.map(([label, value]) => ({ step: "รายการสรุป", label, value }));
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
