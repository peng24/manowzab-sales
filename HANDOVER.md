# 📋 SalesPilot — เอกสารส่งมอบระบบและคู่มือพัฒนาต่อ (Handover Document)

> **SalesPilot (v1.5.4)** — ระบบเว็บแอปพลิเคชันบริหารจัดการยอดขาย บันทึกรายจ่าย คำนวณกำไรสุทธิ และวางแผนภาษี สำหรับร้านค้าออนไลน์ (เน้นสินค้าแฟชั่น/เสื้อผ้า รองรับทั้งยอดโอนเงิน Transfer และยอดเก็บเงินปลายทาง COD Flash Express)

---

## 1. 📌 ภาพรวมโปรเจคและเทคโนโลยี (Tech Stack)

SalesPilot ถูกออกแบบเป็น **Single Page Application (SPA)** แบบ Mobile-First รองรับการใช้งานทั้งบนมือถือ แท็บเล็ต และคอมพิวเตอร์อย่างลื่นไหล พร้อมระบบ PWA (Progressive Web App) และการแสดงผลวันเดือนปีตาม **พ.ศ. (พุทธศักราช)** เต็มระบบ

* **Frontend Framework:** Vue 3 (Composition API, `<script setup>`)
* **Build Tool:** Vite 7
* **State Management:** Pinia 3
* **Routing & Auth Guards:** Vue Router 4 (Hash Mode: `createWebHashHistory`)
* **Backend & Database:** Firebase v12 (Cloud Firestore + Firebase Authentication)
* **Styling & UI:** TailwindCSS, Lucide Vue Next (Icons), SweetAlert2
* **Data Visualization:** Chart.js + vue-chartjs + chartjs-plugin-datalabels
* **Date & Time:** date-fns ร่วมกับ Custom Components (`ThaiDatePicker`, `ThaiTimePicker`)
* **Excel Processing:** ExcelJS (อ่านและประมวลผลไฟล์รายงาน COD จากขนส่งบนฝั่ง Client)
* **Hosting & Deploy:** GitHub Pages (Automated build & deploy via `gh-pages`)

---

## 2. 🚀 ฟังก์ชันหลักของระบบ (Core Features)

### 1) 📊 แดชบอร์ดภาพรวมการเงิน (DashboardView)
* **KPI Summary Cards:** แสดงตัวเลขสรุป ยอดขายรวม (Revenue), ยอดโอน (Transfer), ยอดเก็บปลายทาง (COD), รายจ่าย (Expenses), จำนวนออเดอร์ (Total Orders), กำไรสุทธิ (Net Profit) และอัตรากำไรสุทธิ (Net Margin %)
* **Interactive Chart:** กราฟแท่งแสดงแนวโน้มยอดขายรายวัน พร้อมปุ่ม Toggle สลับโหมด:
  * ยอดขายแยกตามประเภท (COD vs Transfer)
  * ยอดขายเทียบกับรายจ่าย (Sales vs Expenses)
* **Super Date Filters:** กรองข้อมูลได้ 6 โหมด: วันนี้ (Today), เดือนนี้ (This Month), เดือนก่อนหน้า (Previous Month), เลือกเดือนระบุเอง (Select Month), กำหนดช่วงวันเอง (Custom Range) และตลอดกาล (All Time)
* **Pull to Refresh:** ดึงหน้าจอลงเพื่อรีเฟรชข้อมูลบนมือถือ

### 2) 💸 บันทึกยอดขายแบบโอนเงิน (TransferView)
* ฟอร์มบันทึกยอดขายจากการโอนเงิน พร้อมระบุชื่อลูกค้า เลขออเดอร์ และยอดเงิน
* เลือกวันเวลาไทยแบบ พ.ศ. และนาฬิกา 24 ชม.
* **ระบุจำนวนตัว/ชิ้น (Item Count):** นำไปคำนวณต้นทุนแฝงซัก-รีดอัตโนมัติ

### 3) 📦 นำเข้ายอดเก็บเงินปลายทาง (ImportCODView)
* อัปโหลดไฟล์ Excel (.xlsx / .xls) รายงานเงินโอน COD จากขนส่ง (เช่น Flash Express)
* **ตรวจจับยอดซ้ำ (Duplicate Detection):** ตรวจสอบกับฐานข้อมูล Firestore ตามเลขออเดอร์/Tracking ป้องกันการบันทึกเงินซ้ำ
* **Preview Mode:** ตรวจสอบความถูกต้องและยอดรวมก่อนกดยืนยันบันทึกจริง
* บันทึกข้อมูลเข้า Firestore แบบ **Batch Write** รวดเร็วและประหยัดโควตา Write

### 4) 📑 ประวัติยอดขายและการจัดการจำนวนตัว (AllSalesView)
* ค้นหาและกรองรายการขายย้อนหลังอย่างละเอียด (ช่วงเวลา, ประเภท COD/โอน, ค้นหาตามชื่อลูกค้า หรือเลขออเดอร์)
* สรุปยอดขายรวม, จำนวนออเดอร์, จำนวนตัวรวม (Total Items) และค่าเฉลี่ยต่อออเดอร์
* **Quick Item Count Modal:** ปรับแก้จำนวนตัวของแต่ละออเดอร์สะดวกรวดเร็ว (กด Enter เพื่อบันทึกทันที พร้อมปุ่มลัด 1, 2, 3 ตัว)
* **Smart Auto-Estimator (ระบบประมาณการจำนวนตัวอัตโนมัติ):** คำนวณเดาจำนวนตัวย้อนหลังจากช่วงราคาสินค้าแบบ Batch อัตโนมัติ สำหรับออเดอร์ที่นำเข้าจาก Excel
* มี Badge สีเขียวและเครื่องหมายถูก ✅ กำกับออเดอร์ที่ยืนยันจำนวนตัวแล้ว

### 5) 🧾 จัดการรายจ่ายและต้นทุนแฝง (ExpensesView)
* บันทึกค่าใช้จ่ายแยกหมวดหมู่ (ค่าโฆษณา, ค่าขนส่ง, ค่าแพ็คเกจจิ้ง, ค่าของ/สต็อก, ค่าซักรีด ฯลฯ) พร้อมสี Badge แยกชัดเจน
* **ระบบคำนวณต้นทุนแฝงซัก-รีดอัตโนมัติ (Automated Overhead Cost):**
  * กำหนดเรตค่าซัก-รีดต่อตัวได้ (เช่น ฿15.00/ตัว)
  * ระบบดึงยอดจำนวนตัวรวมที่ขายได้จริงในช่วงเวลานั้นมาคำนวณเป็นค่าใช้จ่ายให้อัตโนมัติ

### 6) 📈 วิเคราะห์และเปรียบเทียบยอดขาย (CompareSalesView)
* เปรียบเทียบผลประกอบการ 2 ช่วงเวลาแบบละเอียด:
  * **MoM** (Month-over-Month): เดือนนี้ vs เดือนก่อน
  * **MoY** (Month-over-Year): เดือนนี้ vs เดือนเดียวกันของปีก่อน
  * **YoY** (Year-over-Year): ปีนี้ vs ปีก่อน
  * **Custom:** เลือกกำหนด 2 ช่วงเวลาเปรียบเทียบเอง
* คำนวณ % Growth อัตราเติบโตของยอดขาย, จำนวนออเดอร์, กำไร
* กราฟแท่งคู่ (Dual-series chart) เปรียบเทียบชัดเจน

### 7) 🏛️ วางแผนและคำนวณภาษีสรรพากร (TaxView)
* คำนวณภาษีเงินได้บุคคลธรรมดาสำหรับร้านค้าออนไลน์ **มาตรา 40(8) พาณิชยกรรม** ตามประมวลรัษฎากร 100%
* รองรับแบบแสดงรายการ:
  * **ภ.ง.ด. 90** (ยื่นสิ้นปี)
  * **ภ.ง.ด. 94** (ยื่นครึ่งปี)
* เลือกโหมดหักค่าใช้จ่าย: แบบเหมา (60%) หรือแบบตามจริง (ตามระบบบันทึกรายจ่าย)
* คำนวณลดหย่อนส่วนตัว/คู่สมรส/บุตร/กองทุน/ประกัน และแสดงฐานภาษีอัตราก้าวหน้า
* ตรวจสอบเกณฑ์ภาษีมูลค่าเพิ่ม (VAT 1.8 ล้านบาท)
* จัดรูปแบบตัวเลขตรงกับหน้ากรอก **e-Filing (rd.go.th)** ของกรมสรรพากร พร้อมนำไปกรอกยื่นภาษีได้ทันที

### 8) 👥 ระบบจัดการลูกค้า (CustomersView & CustomerDetailView)
* บันทึกประวัติและข้อมูลลูกค้า
* คำนวณยอดซื้อสะสม (Lifetime Value / Total Spend) และจำนวนครั้งที่สั่งซื้อ (Frequency)
* แบ่งกลุ่มสถานะลูกค้า (New, Regular, VIP)
* หน้ารายละเอียดลูกค้าพร้อมประวัติการสั่งซื้อย้อนหลังแบบแบ่งหน้า (Pagination)

### 9) 🔐 ระบบล็อกอินและความปลอดภัย (LoginView & Auth Guards)
* ยืนยันตัวตนผ่าน Firebase Authentication (Email/Password)
* มี Route Guard ป้องกันหน้าที่ต้องการ Auth
* แสดงวันเวลาที่ระบบถูก Build ล่าสุด (Build Date/Time) บนแถบเมนูและหน้าจอ

---

## 3. 🛠️ สิ่งที่เราพัฒนาและปรับปรุงมาแล้ว (Changelog & Milestones)

* **v1.0 - v1.1:** วางโครงสร้างโปรเจคด้วย Vue 3 + TailwindCSS + Firebase Firestore/Auth ทำระบบแดชบอร์ดเบื้องต้น บันทึกยอดโอน และระบบจัดการลูกค้า
* **v1.2:** พัฒนาระบบนำเข้า Excel COD จากขนส่งด้วย ExcelJS ตรวจสอบรายการซ้ำ และติดตั้งระบบ PWA (Icons, Manifest) ให้ติดตั้งบนมือถือได้
* **v1.3:** เพิ่มหน้าบันทึกรายจ่าย (Expenses), สร้าง Custom ThaiDatePicker และ 24h ThaiTimePicker แก้ปัญหาระบบปี พ.ศ. และเพิ่มหน้า CompareSalesView สำหรับเปรียบเทียบยอดขาย 2 ช่วงเวลา
* **v1.4:** เพิ่มหน้าคำนวณภาษีสรรพากร ภ.ง.ด. 90/94 (TaxView), เพิ่มระบบคำนวณต้นทุนแฝงซัก-รีดอัตโนมัติ (Automated Overhead Cost), เพิ่มฟิลด์จำนวนตัว (Item Count) ใน Transfer และ All Sales พร้อม Smart Auto-Estimator สำหรับเดาจำนวนตัวตามช่วงราคา
* **v1.5.0 - v1.5.1:** รวมศูนย์การจัดการจำนวนตัวไว้ที่ `AllSalesView` เพื่อให้ขั้นตอนนำเข้าไฟล์เร็วขึ้น และเพิ่ม Quick Modal สำหรับคีย์จำนวนตัวพร้อมปุ่ม Reset และเครื่องหมาย ✅ สีเขียว
* **v1.5.2:** **Accessibility (a11y) Overhaul:** ปรับปรุงความเข้าถึงตามมาตรฐาน WCAG เพิ่ม ARIA labels, ปรับปรุง Contrast สี, Focus state สำหรับคีย์บอร์ด, Focus trap และ Escape-to-close ใน Modal ทุกตัว
* **v1.5.3:** **Memory Leak & Performance Fixes:** ป้องกัน Memory Leak ใน Watchers, Intervals, ล้าง Timeout ใน PullToRefresh, ปรับปรุง Pinia Store Reset State ตอนออกจากหน้า และจัดการ Clean up ตอน Unmount
* **v1.5.4 (ล่าสุด):** **Audit Hardening:** แก้ปัญหาและข้อบกพร่อง 9 จุดสำคัญทั่วทั้งระบบ ทั้งการคุม Type ของ Query Firestore, การป้องกัน NaN ในการคำนวณตัวเลข, Error Boundaries ใน Chart และการจัดการ Data Loading States

---

## 4. 🏛️ โครงสร้างโค้ดและการไหลของข้อมูล (Architecture & Data Flow)

### โครงสร้างโฟลเดอร์หลัก (`src/`)
```text
src/
├── views/           # หน้าเว็บหลักแต่ละหน้า (Dashboard, AllSales, Tax, Expenses ฯลฯ)
├── components/      # คอมโพเนนต์ที่ใช้ซ้ำ (SalesChart, CompareChart, ThaiDatePicker, PullToRefresh ฯลฯ)
├── stores/          # Pinia State Management (salesStore, expenseStore, customerStore)
├── services/        # ชั้นเชื่อมต่อ Firestore CRUD (salesService, expenseService)
├── firebase/        # ไฟล์ Initialize Firebase Auth & Firestore Client
├── utils/           # ฟังก์ชันคำนวณ แปลงวันเวลา (dateUtils), แปลงสกุลเงิน (formatUtils) และ Performance Tracker
├── layouts/         # Layout โครงสร้างหน้าหลัก (MainLayout, Sidebar, Navigation)
└── router/          # การตั้งค่า Routing พร้อม Auth Guards (index.js)
```

### การไหลของข้อมูล (Data Flow)
```text
ผู้ใช้กดใช้งาน (View)
  ↓
เรียก Pinia Action (เช่น salesStore.fetchSales)
  ↓
เรียก Service Layer (salesService.getAllSales / getSalesByDateRange)
  ↓
Query ข้อมูลจาก Cloud Firestore (คอลเลกชัน sales / expenses / customers)
  ↓
แปลงข้อมูลดิบ (Data Mapping & Timestamp Handling)
  ↓
อัปเดต State ใน Pinia Store
  ↓
คำนวณ Getters & Reactive State ส่งกลับให้ View เรนเดอร์บนหน้าจอ
```

---

## 5. ⚠️ จุดสำคัญที่ต้องระวังเวลาพัฒนาต่อ (Developer Gotchas)

1. **Firebase Timestamp vs JavaScript Date:**
   * ข้อมูลวันที่จาก Firestore จะเป็น `Timestamp` (ต้องเรียก `.toDate()` ก่อนนำมาแปลง)
   * ใช้ฟังก์ชันจาก `src/utils/dateUtils.js` เสมอ (`toDate()`, `toFirestoreTimestamp()`) เพื่อป้องกัน Runtime Error
2. **ระบบปี พ.ศ. (Thai Buddhist Era):**
   * UI ทั้งหมดแสดงผลเป็นปี พ.ศ. (ค.ศ. + 543)
   * ตัวเลือกวันที่ใช้ `ThaiDatePicker.vue` ห้ามเปลี่ยนกลับไปใช้ `<input type="date">` ธรรมดา เพราะจะแสดงผลปี ค.ศ. และมีปัญหาเรื่อง Timezone บนมือถือ
3. **การคำนวณจำนวนตัวและต้นทุนแฝง (Item Count & Overhead Cost):**
   * จำนวนตัวในแต่ละออเดอร์ถูกเก็บในฟิลด์ `itemCount` (ตัวเลข) หากไม่มีจะถูกคิดเป็น 1 ตัว
   * มีแฟล็ก `isItemCountVerified: true` กำกับว่าออเดอร์นี้ผู้ใช้ตรวจนับยืนยันแล้ว
4. **Auth Initialization ใน Router:**
   * ใน `src/router/index.js` มีฟังก์ชัน Singleton `waitForAuth()` เพื่อรอให้ Firebase Auth ยืนยันสถานะก่อน Router Guard จะทำงาน ป้องกันหน้าเด้งหลุดไปหน้า Login ขณะที่กำลังโหลดสถานะ
5. **นโยบายการ Deploy (Auto-Deploy Policy):**
   * เมื่อแก้ไขโค้ดและรัน `npm run build` ผ่าน ให้รัน `npm run deploy` เพื่อขึ้น GitHub Pages ทันที

---

## 6. 💻 การติดตั้งและเริ่มพัฒนา (Getting Started)

### 1) ติดตั้ง Dependencies
```bash
git clone <repository-url>
cd SalesPilot
npm install
```

### 2) ตั้งค่า Environment Variables
สร้างไฟล์ `.env` ที่ Root ของโปรเจค (คัดลอกจาก `.env.example`):
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3) รัน Local Development
```bash
npm run dev
```

### 4) ทดสอบ Build & Deploy
```bash
npm run build      # ตรวจสอบการคอมไพล์
npm run deploy     # Build และ Push ขึ้น GitHub Pages (branch gh-pages)
```

---

## 7. 🧭 แผนการพัฒนาต่อยอดที่แนะนำ (Roadmap / Next Steps)

1. **เชื่อมต่อ Flash Express API / ขนส่งโดยตรง:** ดึงยอด COD อัตโนมัติผ่าน Webhook หรือ REST API โดยไม่ต้องอัปโหลดไฟล์ Excel
2. **Export รายงานทางการเงิน:** เพิ่มระบบส่งออกรายงานสรุปยอดขาย รายจ่าย และตารางภาษีเป็นไฟล์ Excel (.xlsx) หรือ PDF เพื่อส่งให้สำนักงานบัญชี
3. **ระบบจัดการสต็อกสินค้า (Inventory / Stock):** ต่อยอดจากจำนวนตัว (Item Count) ให้ผูกกับรหัสสินค้า (SKU) และตัดสต็อกอัตโนมัติ
4. **Multi-Store / Multi-User Roles:** รองรับหลายร้านค้า และแยกสิทธิ์ระหว่างผู้บันทึกยอด (แอดมิน) กับเจ้าของร้าน (ดูผลกำไรและภาษี)
