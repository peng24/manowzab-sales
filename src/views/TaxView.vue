<template>
  <div class="container mx-auto max-w-7xl py-1 md:py-2 space-y-4">
    <!-- 1. Header & Year Selector Card -->
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
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
              มาตรา 40(8) เงินได้จากการพาณิชย์
            </span>
            <span class="text-xs text-gray-400">บุคคลธรรมดา</span>
          </div>
          <h1 class="text-xl md:text-2xl font-black text-gray-900 leading-tight mt-0.5">
            วางแผนและคำนวณภาษี (Tax Planning)
          </h1>
          <p class="text-xs text-gray-500 mt-0.5">
            คำนวณภาษีร้านค้าออนไลน์ เปรียบเทียบวิธีหักค่าใช้จ่าย และเฝ้าระวังเกณฑ์กฎหมายภาษี
          </p>
        </div>
      </div>

      <!-- Year Selector & Refresh Button -->
      <div class="flex flex-wrap items-center gap-2.5">
        <div class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1 px-2.5">
          <Calendar class="h-4 w-4 text-gray-500" />
          <span class="text-xs font-semibold text-gray-600">รอบปีภาษี:</span>
          <select
            v-model="selectedYear"
            class="rounded-lg border-0 bg-transparent py-1 pr-7 pl-1 text-sm font-black text-gray-900 focus:ring-0 cursor-pointer"
          >
            <option v-for="yr in yearOptions" :key="yr" :value="yr">
              พ.ศ. {{ yr + 543 }} ({{ yr }})
            </option>
          </select>
        </div>

        <button
          @click="loadData"
          :disabled="loading"
          class="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          <span>{{ loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล' }}</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex h-64 w-full items-center justify-center">
      <div class="flex flex-col items-center gap-2">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        <p class="text-sm text-gray-500">กำลังคำนวณยอดภาษี...</p>
      </div>
    </div>

    <div v-else class="space-y-4 animate-fade-in-up">
      <!-- 2. Legal Thresholds & Warning Trackers (VAT 1.8M & e-Payment) -->
      <div class="grid gap-3.5 grid-cols-1 md:grid-cols-2">
        <!-- VAT 1.8 Million Threshold Tracker -->
        <div class="rounded-2xl border bg-white p-4 md:p-5 shadow-sm transition-all relative overflow-hidden"
          :class="vatProgressPercent >= 100 ? 'border-rose-300 bg-rose-50/20' : (vatProgressPercent >= 80 ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200')"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  :class="vatProgressPercent >= 100 ? 'bg-rose-100 text-rose-700' : (vatProgressPercent >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')"
                >
                  ภาษีมูลค่าเพิ่ม (VAT 7%)
                </span>
                <span class="text-xs font-semibold text-gray-500">เกณฑ์ 1.8 ล้านบาท/ปี</span>
              </div>
              <h3 class="text-lg font-black text-gray-900 mt-1.5">
                ฿{{ formatCurrency(annualRevenue) }}
                <span class="text-xs font-normal text-gray-500">/ ฿1,800,000</span>
              </h3>
            </div>
            <div class="rounded-xl p-2.5"
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
              ยอดขายเหลืออีก <strong class="font-bold">฿{{ formatCurrency(Math.max(0, 1800000 - annualRevenue)) }}</strong> จะถึงเกณฑ์ 1.8 ล้าน ควรเตรียมวางแผนภาษีและระบบออกใบกำกับภาษี
            </p>
            <p v-else class="text-gray-500">
              ยอดขายยังห่างจากเพดานอีก <strong>฿{{ formatCurrency(Math.max(0, 1800000 - annualRevenue)) }}</strong> ยังไม่ต้องจดทะเบียนภาษีมูลค่าเพิ่ม
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
                {{ transferCount }} รายการโอน
                <span class="text-xs font-normal text-gray-500">/ ฿{{ formatCurrency(annualTransferAmount) }}</span>
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
                <div class="h-2 w-2 rounded-full" :class="transferCount >= 3000 ? 'bg-amber-500' : 'bg-emerald-500'"></div>
                <span class="font-medium text-gray-700">เงื่อนไข 1: รับโอน 3,000 ครั้งขึ้นไป</span>
              </div>
              <span class="font-bold" :class="transferCount >= 3000 ? 'text-amber-600' : 'text-gray-600'">
                {{ transferCount }} / 3,000 ครั้ง
              </span>
            </div>

            <!-- Condition 2: 400 transactions & 2M THB -->
            <div class="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full" :class="(transferCount >= 400 && annualTransferAmount >= 2000000) ? 'bg-amber-500' : 'bg-emerald-500'"></div>
                <span class="font-medium text-gray-700">เงื่อนไข 2: รับโอน 400 ครั้ง + ยอด 2 ล้านบาท</span>
              </div>
              <span class="font-bold" :class="(transferCount >= 400 && annualTransferAmount >= 2000000) ? 'text-amber-600' : 'text-gray-600'">
                {{ transferCount >= 400 ? '✅ 400+ ครั้ง' : `${transferCount}/400 ครั้ง` }} | ฿{{ formatCurrency(annualTransferAmount) }}
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
            <h2 class="text-lg font-black text-gray-900">
              ประมาณการภาษีเงินได้บุคคลธรรมดา (ประจำปี พ.ศ. {{ selectedYear + 543 }})
            </h2>
            <p class="text-xs text-gray-500">
              เปรียบเทียบการหักค่าใช้จ่าย 2 รูปแบบ เพื่อให้คุณเลือกวิธีที่ประหยัดภาษีที่สุด
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
            <span class="text-[11px] font-bold text-gray-500 uppercase">1. รายได้รวมทั้งปี (Revenue)</span>
            <p class="text-xl md:text-2xl font-black text-gray-900 mt-1">
              ฿{{ formatCurrency(annualRevenue) }}
            </p>
            <p class="text-[11px] text-gray-400 mt-1">รวมยอดโอน และ COD</p>
          </div>

          <!-- Net Taxable Income Card -->
          <div class="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
            <span class="text-[11px] font-bold text-gray-500 uppercase">2. เงินได้สุทธิ (Net Income)</span>
            <p class="text-xl md:text-2xl font-black text-gray-900 mt-1">
              ฿{{ formatCurrency(activeCalculation.netTaxableIncome) }}
            </p>
            <p class="text-[11px] text-gray-400 mt-1">
              หลังหักค่าใช้จ่าย ({{ expenseDeductionMethod === 'flat' ? 'เหมา 60%' : 'ตามจริง' }}) & ค่าลดหย่อน
            </p>
          </div>

          <!-- Tax Payable Hero Card -->
          <div class="rounded-xl p-3.5 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-sm shadow-emerald-700/20">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                3. ภาษีที่ต้องชำระ (Tax to Pay)
              </span>
              <span class="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                ฐานภาษีสูงสุด {{ activeCalculation.highestBracketPercent }}%
              </span>
            </div>
            <p class="text-2xl md:text-3xl font-black mt-1">
              ฿{{ formatCurrency(activeCalculation.finalTaxPayable) }}
            </p>
            <p class="text-[11px] text-emerald-100/90 mt-1">
              {{ activeCalculation.usedFlat05PercentRule ? '(คิดจากเกณฑ์ภาษีเหมา 0.5% ของรายได้)' : '(คำนวณตามอัตราก้าวหน้า)' }}
            </p>
          </div>
        </div>

        <!-- Breakdown Formula Table -->
        <div class="overflow-x-auto rounded-xl border border-gray-100 bg-slate-50/50 p-3.5 text-xs">
          <h4 class="font-bold text-gray-700 mb-2.5 flex items-center gap-1.5">
            <FileText class="h-4 w-4 text-emerald-600" />
            สรุปขั้นตอนการคำนวณ (Tax Breakdown)
          </h4>
          <div class="space-y-2">
            <div class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium">
              <span class="text-gray-600">รายได้พึงประเมิน 40(8) (ยอดขายทั้งปี)</span>
              <span class="font-bold text-gray-900">฿{{ formatCurrency(annualRevenue) }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium text-rose-600">
              <span>
                หัก: ค่าใช้จ่าย ({{ expenseDeductionMethod === 'flat' ? 'เหมา 60%' : 'ตามจริงจากระบบ' }})
              </span>
              <span class="font-bold">- ฿{{ formatCurrency(activeCalculation.deductedExpenseAmount) }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium">
              <span class="text-gray-600">คงเหลือ: เงินได้หลังหักค่าใช้จ่าย</span>
              <span class="font-bold text-gray-900">฿{{ formatCurrency(activeCalculation.incomeAfterExpense) }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium text-rose-600">
              <span>หัก: ค่าลดหย่อนส่วนตัวและอื่นๆ รวม</span>
              <span class="font-bold">- ฿{{ formatCurrency(totalAllowances) }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-300 font-bold bg-white px-2 rounded-lg text-emerald-800">
              <span>เงินได้สุทธิที่นำไปคำนวณภาษี (Net Taxable Income)</span>
              <span class="text-sm">฿{{ formatCurrency(activeCalculation.netTaxableIncome) }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium">
              <span class="text-gray-600">ภาษีคำนวณตามอัตราก้าวหน้า (Progressive Brackets)</span>
              <span class="font-bold text-gray-900">฿{{ formatCurrency(activeCalculation.progressiveTax) }}</span>
            </div>
            <div v-if="annualRevenue > 1000000" class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium text-gray-600">
              <span>ภาษีขั้นต่ำแบบเหมา 0.5% (รายได้ × 0.005 ตาม ม.48(2))</span>
              <span class="font-bold">฿{{ formatCurrency(annualRevenue * 0.005) }}</span>
            </div>
            <div v-if="withholdingTax > 0" class="flex items-center justify-between py-1 border-b border-gray-200/60 font-medium text-emerald-600">
              <span>หัก: ภาษีถูกหัก ณ ที่จ่ายไว้แล้ว (Withholding Tax Credit)</span>
              <span class="font-bold">- ฿{{ formatCurrency(withholdingTax) }}</span>
            </div>
            <div class="flex items-center justify-between pt-2 font-black text-sm text-gray-900">
              <span>ภาษีที่ต้องชำระจริงสุทธิ</span>
              <span class="text-base text-emerald-600">฿{{ formatCurrency(activeCalculation.finalTaxPayable) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Interactive Tax Allowances & Deductions Form -->
      <div class="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div>
            <h3 class="text-base font-black text-gray-900 flex items-center gap-2">
              <BadgePercent class="h-5 w-5 text-emerald-600" />
              ปรับแต่งรายการลดหย่อนภาษี (Tax Allowances & Deductions)
            </h3>
            <p class="text-xs text-gray-500">
              กรอกรายการลดหย่อนของคุณเพื่อคำนวณยอดภาษีที่แท้จริง
            </p>
          </div>
          <div class="text-right">
            <span class="text-xs text-gray-400">ค่าลดหย่อนรวม</span>
            <p class="text-base font-black text-emerald-700">฿{{ formatCurrency(totalAllowances) }}</p>
          </div>
        </div>

        <div class="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <!-- 1. Personal Allowance (Fixed 60,000) -->
          <div class="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">ค่าลดหย่อนส่วนตัว</label>
              <span class="text-[10px] text-gray-400 font-semibold">ตามกฎหมาย</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-sm font-black text-gray-700 bg-white p-2 rounded-lg border border-gray-200">
              <span>฿60,000</span>
              <CheckCircle2 class="h-4 w-4 text-emerald-600" />
            </div>
            <p class="text-[10px] text-gray-400 mt-1">ได้รับสิทธิ์ทุกคนโดยอัตโนมัติ</p>
          </div>

          <!-- 2. Spouse Allowance -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">คู่สมรส (ไม่มีเงินได้)</label>
              <input type="checkbox" v-model="hasSpouseAllowance" class="rounded text-emerald-600 h-4 w-4 cursor-pointer" />
            </div>
            <div class="mt-2 text-sm font-bold text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">
              {{ hasSpouseAllowance ? '฿60,000' : '฿0' }}
            </div>
            <p class="text-[10px] text-gray-400 mt-1">จดทะเบียนสมรสและไม่มีรายได้</p>
          </div>

          <!-- 3. Children Allowance -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">จำนวนบุตร (30,000 บ./คน)</label>
              <span class="font-bold text-emerald-700">฿{{ formatCurrency(childrenCount * 30000) }}</span>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="10"
                v-model.number="childrenCount"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
              />
              <span class="text-gray-500 shrink-0">คน</span>
            </div>
          </div>

          <!-- 4. Social Security -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">ประกันสังคม ม.33 / ม.39 / ม.40</label>
              <span class="text-[10px] text-gray-400">สูงสุด 9,000</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                max="9000"
                step="500"
                v-model.number="socialSecurity"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="0 - 9,000"
              />
            </div>
          </div>

          <!-- 5. Life & Health Insurance -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">ประกันชีวิต / ประกันสุขภาพ</label>
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
                placeholder="สูงสุด 100,000"
              />
            </div>
          </div>

          <!-- 6. Funds SSF / RMF / Thai ESG -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">กองทุนลดหย่อน (SSF / RMF / Thai ESG)</label>
              <span class="text-[10px] text-gray-400">ตามเงื่อนไข</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                step="5000"
                v-model.number="investmentFunds"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="ยอดเงินลงทุน"
              />
            </div>
          </div>

          <!-- 7. Home Loan Interest -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">ดอกเบี้ยเงินกู้ยืมซื้อบ้าน</label>
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
                placeholder="ตามที่จ่ายจริง"
              />
            </div>
          </div>

          <!-- 8. Donations / Other -->
          <div class="p-3 rounded-xl border border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <label class="font-bold text-gray-800">เงินบริจาค / Easy E-Receipt</label>
              <span class="text-[10px] text-gray-400">ตามหลักฐาน</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                step="500"
                v-model.number="donations"
                class="w-full rounded-lg border-gray-300 py-1 px-2.5 text-xs font-bold text-gray-900"
                placeholder="เงินบริจาค / ช้อปดีมีคืน"
              />
            </div>
          </div>

          <!-- 9. Withholding Tax -->
          <div class="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40">
            <div class="flex items-center justify-between">
              <label class="font-bold text-emerald-900">ภาษีถูกหัก ณ ที่จ่าย (เครดิตภาษี)</label>
              <span class="text-[10px] text-emerald-700 font-bold">หักลบยอดจ่าย</span>
            </div>
            <div class="mt-2">
              <input
                type="number"
                min="0"
                step="500"
                v-model.number="withholdingTax"
                class="w-full rounded-lg border-emerald-300 py-1 px-2.5 text-xs font-bold text-emerald-900 bg-white"
                placeholder="ยอดภาษีที่ถูกหักไว้"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Progressive Tax Brackets Table -->
      <div class="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <h3 class="text-base font-black text-gray-900 mb-1">
          ตารางอัตราภาษีเงินได้บุคคลธรรมดาแบบขั้นบันได
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

      <!-- 6. Tax Filing Calendar & Business Optimization Guide -->
      <div class="grid gap-3.5 grid-cols-1 md:grid-cols-2">
        <!-- Filing Calendar Card -->
        <div class="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <Calendar class="h-5 w-5 text-indigo-600" />
            <h3 class="text-sm font-black text-gray-900">กำหนดเวลายื่นภาษีร้านค้า (มาตรา 40(8))</h3>
          </div>
          <div class="space-y-3 text-xs">
            <div class="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <div class="flex items-center justify-between font-bold text-indigo-900">
                <span>1. ภ.ง.ด. 94 (ภาษีครึ่งปี)</span>
                <span class="rounded bg-indigo-200/80 px-2 py-0.5 text-[10px]">ก.ค. - ก.ย.</span>
              </div>
              <p class="text-indigo-800/90 mt-1 text-[11px]">
                สรุปยอดขายและรายได้ช่วง 6 เดือนแรก (1 ม.ค. – 30 มิ.ย.) ยื่นภายใน 1 ก.ค. – 30 ก.ย. ของปีภาษีนั้นๆ
              </p>
            </div>

            <div class="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div class="flex items-center justify-between font-bold text-emerald-900">
                <span>2. ภ.ง.ด. 90 (ภาษีประจำปี)</span>
                <span class="rounded bg-emerald-200/80 px-2 py-0.5 text-[10px]">ม.ค. - มี.ค.</span>
              </div>
              <p class="text-emerald-800/90 mt-1 text-[11px]">
                สรุปยอดขายทั้งปี (1 ม.ค. – 31 ธ.ค.) ยื่นภายในเดือน ม.ค. – มี.ค. ของปีถัดไป (ยื่นออนไลน์ได้ถึง 8 เม.ย.) โดยนำภาษีครึ่งปีที่จ่ายไปแล้วมาหักลบได้
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
} from "lucide-vue-next";

const salesStore = useSalesStore();
const expenseStore = useExpenseStore();

const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
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

// Allowances Form State
const hasSpouseAllowance = ref(false);
const childrenCount = ref(0);
const socialSecurity = ref(0);
const lifeInsurance = ref(0);
const investmentFunds = ref(0);
const homeLoanInterest = ref(0);
const donations = ref(0);
const withholdingTax = ref(0);

// --- Data Fetching ---
const loadData = async () => {
  loading.value = true;
  try {
    const filter = {
      mode: "selectYear",
      year: selectedYear.value,
    };
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

watch(selectedYear, () => {
  loadData();
});

// --- Sales & Expense Aggregations ---
const annualRevenue = computed(() => {
  return salesStore.sales.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
});

const annualActualExpenses = computed(() => {
  return expenseStore.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
});

const transferSales = computed(() => {
  return salesStore.sales.filter((s) => s.type !== "COD");
});

const transferCount = computed(() => transferSales.value.length);

const annualTransferAmount = computed(() => {
  return transferSales.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
});

// VAT 1.8M Progress
const vatProgressPercent = computed(() => {
  if (annualRevenue.value <= 0) return 0;
  return Math.min(Math.round((annualRevenue.value / 1800000) * 100), 999);
});

// --- Allowances Computation ---
const totalAllowances = computed(() => {
  let sum = 60000; // Personal allowance
  if (hasSpouseAllowance.value) sum += 60000;
  sum += (Number(childrenCount.value) || 0) * 30000;
  sum += Math.min(Number(socialSecurity.value) || 0, 9000);
  sum += Math.min(Number(lifeInsurance.value) || 0, 100000);
  sum += Number(investmentFunds.value) || 0;
  sum += Math.min(Number(homeLoanInterest.value) || 0, 100000);
  sum += Number(donations.value) || 0;
  return sum;
});

// --- Tax Calculations Helper Function ---
const calculateTaxForMethod = (deductionType) => {
  const revenue = annualRevenue.value;
  let deductedExpense = 0;

  if (deductionType === "flat") {
    // 60% flat rate for 40(8) online commerce
    deductedExpense = revenue * 0.6;
  } else {
    // Actual recorded expenses
    deductedExpense = annualActualExpenses.value;
  }

  const incomeAfterExpense = Math.max(0, revenue - deductedExpense);
  const netTaxableIncome = Math.max(0, incomeAfterExpense - totalAllowances.value);

  // Progressive Tax Calculation (0 - 35%)
  let tax = 0;
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
      tax += step2 * 0.05;
      remaining -= step2;
      highestRate = 5;
    }

    // 300,001 - 500,000 @ 10% (max 200,000)
    if (remaining > 0) {
      const step3 = Math.min(remaining, 200000);
      tax += step3 * 0.10;
      remaining -= step3;
      highestRate = 10;
    }

    // 500,001 - 750,000 @ 15% (max 250,000)
    if (remaining > 0) {
      const step4 = Math.min(remaining, 250000);
      tax += step4 * 0.15;
      remaining -= step4;
      highestRate = 15;
    }

    // 750,001 - 1,000,000 @ 20% (max 250,000)
    if (remaining > 0) {
      const step5 = Math.min(remaining, 250000);
      tax += step5 * 0.20;
      remaining -= step5;
      highestRate = 20;
    }

    // 1,000,001 - 2,000,000 @ 25% (max 1,000,000)
    if (remaining > 0) {
      const step6 = Math.min(remaining, 1000000);
      tax += step6 * 0.25;
      remaining -= step6;
      highestRate = 25;
    }

    // 2,000,001 - 5,000,000 @ 30% (max 3,000,000)
    if (remaining > 0) {
      const step7 = Math.min(remaining, 3000000);
      tax += step7 * 0.30;
      remaining -= step7;
      highestRate = 30;
    }

    // > 5,000,000 @ 35%
    if (remaining > 0) {
      tax += remaining * 0.35;
      highestRate = 35;
    }
  }

  // Check 0.5% flat rule (Section 48(2)) for income > 1,000,000 THB
  const flat05PercentTax = revenue > 1000000 ? revenue * 0.005 : 0;
  const usedFlat05PercentRule = flat05PercentTax > tax && flat05PercentTax > 5000;
  const taxBeforeCredit = usedFlat05PercentRule ? flat05PercentTax : tax;

  const finalTaxPayable = Math.max(0, Math.round(taxBeforeCredit - (Number(withholdingTax.value) || 0)));

  return {
    deductedExpenseAmount: Math.round(deductedExpense),
    incomeAfterExpense: Math.round(incomeAfterExpense),
    netTaxableIncome: Math.round(netTaxableIncome),
    progressiveTax: Math.round(tax),
    highestBracketPercent: highestRate,
    usedFlat05PercentRule,
    finalTaxPayable,
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
  return actualCalculation.value.finalTaxPayable < flatCalculation.value.finalTaxPayable
    ? "actual"
    : "flat";
});

const taxSavingsDifference = computed(() => {
  return Math.abs(flatCalculation.value.finalTaxPayable - actualCalculation.value.finalTaxPayable);
});

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
