# Product Specification Document (PSD)

## ManowZab Sales - SalesPilot

**เวอร์ชัน:** 1.1.1  
**วันที่:** 9 กุมภาพันธ์ 2026  
**สถานะ:** Production Ready

---

## 1. ภาพรวมผลิตภัณฑ์ (Product Overview)

### 1.1 ชื่อผลิตภัณฑ์

**ManowZab Sales** (SalesPilot) - ระบบจัดการข้อมูลการขายและลูกค้าแบบ Real-time

### 1.2 วัตถุประสงค์ (Objectives)

ระบบ ManowZab Sales ได้รับการออกแบบมาเพื่อช่วยให้ธุรกิจขนาดเล็กและขนาดกลางสามารถ:

- **บันทึกและติดตามยอดขาย** แบบ Real-time ผ่าน Cloud Database
- **จัดการข้อมูลลูกค้า** อย่างเป็นระบบและครบถ้วน
- **วิเคราะห์ข้อมูลการขาย** ผ่าน Dashboard และ Charts
- **รองรับการชำระเงินหลายรูปแบบ** (โอน/COD)
- **นำเข้าข้อมูลจาก Excel** สำหรับข้อมูล COD จากผู้ให้บริการขนส่ง
- **ส่งออกรายงาน** ในรูปแบบ Excel เพื่อการวิเคราะห์เพิ่มเติม

### 1.3 กลุ่มผู้ใช้เป้าหมาย (Target Users)

- เจ้าของธุรกิจออนไลน์
- ผู้ดูแลระบบการขาย
- พนักงานขาย/บริการลูกค้า
- ผู้จัดการฝ่ายการตลาดที่ต้องการข้อมูลเชิงลึก

---

## 2. คุณสมบัติหลัก (Core Features)

### 2.1 Dashboard (แดชบอร์ด)

**วัตถุประสงค์:** แสดงภาพรวมยอดขายและสถิติสำคัญ

#### สิ่งที่แสดงผล:

- **Summary Cards** (บัตรสรุป)
  - ยอดขายรวม (Total Sales)
  - จำนวนออเดอร์ทั้งหมด (Total Orders)
  - ยอดโอน (Transfer Amount)
  - ยอด COD (COD Amount)

- **Time Range Filter** (ตัวกรองช่วงเวลา)
  - วันนี้ (Today)
  - 7 วันที่ผ่านมา (Last 7 Days)
  - 30 วันที่ผ่านมา (Last 30 Days)
  - เดือนนี้ (This Month)
  - เดือนที่แล้ว (Last Month)
  - **ระบุเดือน** พร้อม Month/Year Picker

- **Sales Chart** (กราฟแสดงยอดขาย)
  - แสดงข้อมูลเป็นแท่งกราฟ (Bar Chart)
  - แบ่งตาม Transfer และ COD
  - ใช้ Chart.js และ vue-chartjs

- **Recent Transactions** (รายการล่าสุด)
  - แสดง 10 รายการล่าสุด
  - ลิงก์ไปยังหน้า All Sales

#### User Stories:

- ผู้ใช้สามารถดูภาพรวมยอดขายได้ทันทีเมื่อเข้าระบบ
- ผู้ใช้สามารถเลือกช่วงเวลาที่ต้องการดูข้อมูลได้อย่างยืดหยุ่น
- ผู้ใช้สามารถดูแนวโน้มยอดขายผ่านกราฟได้ชัดเจน

---

### 2.2 Transfer View (บันทึกยอดโอน)

**วัตถุประสงค์:** บันทึกข้อมูลการขายประเภทโอนเงิน

#### ฟอร์มบันทึก:

- **วันที่และเวลา** (DateTime Picker)
  - รองรับรูปแบบไทย
  - ค่าเริ่มต้นเป็นวันที่และเวลาปัจจุบัน
- **เลขออเดอร์** (Order Number)
  - สร้างอัตโนมัติในรูปแบบ `TRF-YYYYMMDD-HHMMSS`
  - ไม่สามารถแก้ไขได้
- **ชื่อลูกค้า** (Customer Name)
  - มี Autocomplete Suggestions
  - ดึงข้อมูลจากฐานข้อมูลลูกค้า
  - แสดงเบอร์โทรศัพท์ประกอบ
- **ยอดโอน** (Amount)
  - ระบุเป็นตัวเลขเท่านั้น
  - แสดงสัญลักษณ์สกุลเงิน ฿
- **URL หลักฐาน** (Slip URL - Optional)
  - สำหรับเก็บลิงก์ภาพหลักฐานการโอน

#### รายการล่าสุด:

- แสดง 10 รายการโอนล่าสุด
- แสดงวันที่เวลา, เลขออเดอร์, ชื่อลูกค้า, ยอดเงิน, ลิงก์หลักฐาน

#### User Stories:

- ผู้ใช้สามารถบันทึกยอดโอนได้รวดเร็วด้วยฟอร์มที่ใช้งานง่าย
- ระบบช่วยป้อนชื่อลูกค้าอัตโนมัติเพื่อลดข้อผิดพลาด
- ผู้ใช้สามารถเก็บลิงก์หลักฐานการโอนไว้อ้างอิงได้

---

### 2.3 Import COD View (นำเข้า COD)

**วัตถุประสงค์:** นำเข้าข้อมูล COD จากไฟล์ Excel ที่ส่งมาจากบริษัทขนส่ง

#### การนำเข้าข้อมูล:

- **รองรับไฟล์** `.xlsx` และ `.xls`
- **Drag & Drop** หรือคลิกเพื่ออัปโหลด
- **อัปโหลดได้หลายไฟล์** พร้อมกัน
- ใช้ **ExcelJS** สำหรับ parsing

#### ขั้นตอนการทำงาน:

1. **Upload** - อัปโหลดไฟล์ Excel
2. **Preview** - แสดงตัวอย่างข้อมูลที่จะนำเข้า
3. **Validation** - ตรวจสอบความถูกต้องของข้อมูล
4. **Confirm** - ยืนยันการบันทึกลง Firebase

#### Summary Stats ที่แสดง:

- จำนวนรายการทั้งหมด
- จำนวนไฟล์ที่ประมวลผล
- ยอดรวมทั้งหมด (฿)

#### Validation Rules:

- Date ต้องถูกต้อง (รองรับหลายรูปแบบ)
- Customer Name ต้องไม่เป็นค่าว่าง
- Amount ต้องเป็นตัวเลขและมากกว่า 0

#### User Stories:

- ผู้ใช้สามารถนำเข้าข้อมูล COD จากผู้ให้บริการขนส่งได้อย่างรวดเร็ว
- ผู้ใช้สามารถตรวจสอบข้อมูลก่อนบันทึกเพื่อป้องกันข้อผิดพลาด
- ระบบรองรับการนำเข้าหลายไฟล์พร้อมกันเพื่อประหยัดเวลา

---

### 2.4 All Sales View (รายการขายทั้งหมด)

**วัตถุประสงค์:** จัดการและตรวจสอบรายการขายทั้งหมด

#### Advanced Filter System:

- **Filter Modes:**
  - ทั้งหมด (All)
  - วันที่กำหนด (Custom Date Range)
    - วันที่เริ่มต้น - วันที่สิ้นสุด
  - เลือกเดือน (Select Month)
    - Month Picker + Year Picker

#### Display Features:

- **Summary Cards:**
  - ยอดขายรวม
  - สัดส่วนประเภท (Transfer vs COD)
    - แสดงทั้งจำนวนเงินและเปอร์เซ็นต์

- **Sales Table:**
  - วันที่/เวลา
  - เลขออเดอร์
  - ชื่อลูกค้า (คลิกเพื่อดูรายละเอียด)
  - ประเภท (Transfer/COD Badge)
  - ยอดเงิน
  - หลักฐาน (ถ้ามี)
  - ปุ่มลบรายการ

#### Actions:

- **ลบรายการ** - ยืนยันด้วย SweetAlert2
- **ดูรายละเอียดลูกค้า** - คลิกที่ชื่อลูกค้า
- **ส่งออก Excel** - Export ข้อมูลที่แสดงอยู่

#### User Stories:

- ผู้ใช้สามารถค้นหาและกรองรายการขายได้อย่างละเอียด
- ผู้ใช้สามารถลบรายการที่ผิดพลาดได้
- ผู้ใช้สามารถส่งออกข้อมูลเพื่อวิเคราะห์ใน Excel ได้

---

### 2.5 Customers View (จัดการลูกค้า)

**วัตถุประสงค์:** จัดการข้อมูลลูกค้าแบบครบวงจร

#### ฟีเจอร์หลัก:

- **เพิ่มลูกค้าใหม่** (Create)
- **แก้ไขข้อมูลลูกค้า** (Update)
- **ลบลูกค้า** (Delete)
- **ค้นหาลูกค้า** (Search)

#### ข้อมูลลูกค้าที่เก็บ:

- **ชื่อลูกค้า\*** (Required)
- **เบอร์โทรศัพท์**
- **ที่อยู่**
- **หมายเหตุ**

#### Customer Modal Form:

- แสดงเป็น Modal Overlay
- รองรับทั้ง Create และ Edit Mode
- Validation ชื่อลูกค้าเป็น Required Field

#### Customer Table:

- แสดงข้อมูลลูกค้าทั้งหมด
- Real-time Search Filter
- ปุ่มแก้ไขและลบในแต่ละแถว

#### User Stories:

- ผู้ใช้สามารถเพิ่มข้อมูลลูกค้าใหม่ได้ง่ายและรวดเร็ว
- ผู้ใช้สามารถค้นหาลูกค้าผ่านชื่อหรือเบอร์โทรได้ทันที
- ผู้ใช้สามารถแก้ไขหรือลบข้อมูลลูกค้าที่ไม่ใช้งานแล้วได้

---

### 2.6 Customer Detail View (รายละเอียดลูกค้า)

**วัตถุประสงค์:** แสดงข้อมูลลูกค้าและประวัติการซื้อทั้งหมด

#### ข้อมูลที่แสดง:

- **ข้อมูลลูกค้า:**
  - ชื่อ
  - เบอร์โทรศัพท์
  - ที่อยู่
  - หมายเหตุ

- **สถิติการซื้อ:**
  - จำนวนออเดอร์ทั้งหมด
  - ยอดซื้อรวมทั้งหมด
  - ออเดอร์ล่าสุด

- **ประวัติการสั่งซื้อ:**
  - ตารางแสดงรายการซื้อทั้งหมดของลูกค้ารายนี้
  - วันที่, เลขออเดอร์, ประเภท, ยอดเงิน

#### User Stories:

- ผู้ใช้สามารถดูประวัติการซื้อของลูกค้าแต่ละรายได้ครบถ้วน
- ผู้ใช้สามารถประเมินมูลค่าลูกค้าจากยอดซื้อรวมได้
- ผู้ใช้สามารถติดตามความถี่ในการซื้อของลูกค้าได้

---

### 2.7 Login View (หน้าเข้าสู่ระบบ)

**วัตถุประสงค์:** Authentication และ Authorization

#### ระบบ Authentication:

- ใช้ **Firebase Authentication**
- รองรับ Email/Password Login
- Protected Routes ด้วย Router Guards

#### UI/UX:

- การ์ดล็อกอินสวยงามและทันสมัย
- แสดงเวอร์ชันของแอปพลิเคชัน
- Loading State ระหว่างการเข้าสู่ระบบ
- Error Handling พร้อม Alert สวยงาม

#### User Stories:

- ผู้ใช้สามารถเข้าสู่ระบบด้วย Email และ Password ได้อย่างปลอดภัย
- ระบบป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต
- ผู้ใช้ได้รับการแจ้งเตือนเมื่อล็อกอินผิดพลาด

---

## 3. สถาปัตยกรรมระบบ (System Architecture)

### 3.1 Technology Stack

#### Frontend:

- **Framework:** Vue 3 (Composition API with `<script setup>`)
- **Build Tool:** Vite 7.2.4
- **UI Framework:** Tailwind CSS 3.4.1
- **Router:** Vue Router 4.6.4
- **State Management:** Pinia 3.0.4

#### Charting & Visualization:

- **Chart.js** 4.5.1
- **vue-chartjs** 5.3.3
- **chartjs-plugin-datalabels** 2.2.0

#### Icons:

- **lucide-vue-next** 0.562.0

#### Date/Time:

- **date-fns** 4.1.0 (รองรับภาษาไทย)

#### Excel Processing:

- **ExcelJS** 4.4.0

#### UI Components:

- **SweetAlert2** 11.26.17

#### Backend/Database:

- **Firebase** 12.7.0
  - Firestore (Document Database)
  - Firebase Authentication
  - Real-time Database

### 3.2 Project Structure

```
d:\Manowzab-sales\
├── public/
│   ├── manifest.json          # PWA Manifest
│   ├── android-chrome-192x192.png
│   └── android-chrome-512x512.png
├── src/
│   ├── assets/               # Static assets
│   ├── components/           # Reusable components
│   │   ├── HelloWorld.vue
│   │   ├── PullToRefresh.vue
│   │   └── SalesChart.vue
│   ├── firebase/             # Firebase configuration
│   ├── layouts/
│   │   └── MainLayout.vue    # Main app layout
│   ├── router/
│   │   └── index.js          # Vue Router config
│   ├── services/
│   │   └── salesService.js   # Firebase data services
│   ├── stores/
│   │   └── salesStore.js     # Pinia state store
│   ├── views/                # Page components
│   │   ├── AllSalesView.vue
│   │   ├── CustomerDetailView.vue
│   │   ├── CustomersView.vue
│   │   ├── DashboardView.vue
│   │   ├── ImportCODView.vue
│   │   ├── LoginView.vue
│   │   └── TransferView.vue
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── .env                      # Environment variables
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

### 3.3 Data Models

#### Sales Document (Firestore)

```javascript
{
  id: String,                    // Document ID
  dateTime: Timestamp,           // วันที่เวลา
  order: String,                 // เลขออเดอร์
  customerName: String,          // ชื่อลูกค้า
  amount: Number,                // ยอดเงิน
  type: String,                  // "Transfer" | "COD"
  slipUrl: String (Optional),    // URL หลักฐาน
  createdAt: Timestamp,          // วันที่สร้าง
  updatedAt: Timestamp           // วันที่แก้ไขล่าสุด
}
```

#### Customer Document (Firestore)

```javascript
{
  id: String,                    // Document ID
  name: String,                  // ชื่อลูกค้า (Required)
  phoneNumber: String,           // เบอร์โทรศัพท์
  address: String,               // ที่อยู่
  note: String,                  // หมายเหตุ
  createdAt: Timestamp,          // วันที่สร้าง
  updatedAt: Timestamp           // วันที่แก้ไขล่าสุด
}
```

### 3.4 State Management (Pinia Store)

#### Sales Store (`salesStore.js`)

**State:**

- `sales: Array` - รายการขายทั้งหมด
- `loading: Boolean` - สถานะการโหลด
- `filters: Object` - Filter settings
- `lastFetchTime: Date` - เวลาดึงข้อมูลล่าสุด

**Getters:**

- `totalSales` - ยอดขายรวม
- `totalOrders` - จำนวนออเดอร์
- `totalTransfer` - ยอดโอนรวม
- `totalCOD` - ยอด COD รวม
- `summaryByDate` - สรุปยอดขายแบ่งตามวัน
- `recentSales` - รายการล่าสุด 10 รายการ
- `salesWithDates` - รายการที่มีวันที่ถูกต้อง (สำหรับกราฟ)

**Actions:**

- `fetchSales(filters)` - ดึงข้อมูลจาก Firestore
- `updateFilters(newFilters)` - อัปเดต filter
- `resetFilters()` - รีเซ็ต filter เป็นค่าเริ่มต้น
- `clearSales()` - ล้างข้อมูล

---

## 4. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 4.1 Browser Support

- **Modern Browsers:**
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+

### 4.2 Responsive Design

- **Mobile First Approach**
- **Breakpoints:**
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px
- **Tailwind Responsive Classes:**
  - `sm:` (640px)
  - `md:` (768px)
  - `lg:` (1024px)
  - `xl:` (1280px)

### 4.3 Performance

- **Code Splitting:** Route-based lazy loading
- **Bundle Optimization:** Vite automatic tree-shaking
- **Image Optimization:** รองรับ WebP และ lazy loading

### 4.4 Security

- **Firebase Security Rules:**
  - Authentication required สำหรับทุก operations
  - Data validation on server-side
- **Environment Variables:**
  - Firebase config เก็บใน `.env`
  - ไม่มี API keys ใน code

### 4.5 PWA Support

- **Manifest.json** มีครบถ้วน
- **Icons** มี 192x192 และ 512x512
- **Standalone Mode** รองรับ

---

## 5. การทำงานร่วมกับ Firebase

### 5.1 Firebase Services ที่ใช้

#### Firestore Database:

- **Collections:**
  - `sales` - เก็บข้อมูลการขาย
  - `customers` - เก็บข้อมูลลูกค้า

#### Firebase Authentication:

- Email/Password Authentication
- Protected Routes

#### Real-time Updates:

- ใช้ `onSnapshot` สำหรับ live updates
- Pull to Refresh สำหรับ manual refresh

### 5.2 Data Fetching Strategy

- **Initial Load:** ดึงข้อมูลตาม filter ที่กำหนด
- **Real-time Updates:** อัปเดตอัตโนมัติเมื่อมีการเปลี่ยนแปลง
- **Caching:** Pinia store เก็บข้อมูลใน memory

---

## 6. UI/UX Design Principles

### 6.1 Color Scheme

- **Primary:** Blue (#2563eb) - ปุ่มหลัก, accent
- **Success:** Green - ยอดเงิน, ยืนยัน
- **Warning:** Orange - COD, แจ้งเตือน
- **Error:** Red - ลบ, error states
- **Neutral:** Gray scale - background, borders, text

### 6.2 Typography

- **Font Family:** System font stack (Tailwind default)
- **Headings:**
  - H1: `text-2xl font-bold`
  - H2: `text-lg font-semibold`
  - H3: `text-base font-medium`

### 6.3 Components Design

- **Cards:** rounded-xl, shadow-sm, border
- **Buttons:** rounded-lg, transition-colors
- **Inputs:** rounded-lg, focus:ring
- **Tables:** divide-y, hover:bg-gray-50

### 6.4 Interaction Design

- **Hover Effects:** `-translate-y-1`, `bg-gray-50`
- **Loading States:** Spinner animations
- **Alerts:** SweetAlert2 modals
- **Transitions:** Smooth color และ transform transitions

---

## 7. สถานการณ์การใช้งาน (Use Cases)

### Use Case 1: บันทึกยอดโอนรายวัน

**Actor:** พนักงานขาย  
**Goal:** บันทึกยอดโอนจากลูกค้า  
**Steps:**

1. เข้าสู่ระบบด้วย Email/Password
2. ไปที่เมนู "บันทึกยอดโอน"
3. กรอกข้อมูล: วันที่, เวลา, ชื่อลูกค้า (autocomplete), ยอดโอน
4. แนบ URL หลักฐาน (ถ้ามี)
5. กดปุ่ม "บันทึกข้อมูลการโอน"
6. ระบบแสดง Success Alert
7. ฟอร์มรีเซ็ตพร้อมรับข้อมูลใหม่

### Use Case 2: นำเข้าข้อมูล COD จาก Excel

**Actor:** ผู้จัดการ  
**Goal:** นำเข้ายอด COD จากไฟล์ Excel ของบริษัทขนส่ง  
**Steps:**

1. เข้าสู่ระบบ
2. ไปที่เมนู "นำเข้า COD"
3. Drag & Drop ไฟล์ Excel หรือคลิกเพื่ออัปโหลด
4. ระบบประมวลผลและแสดง Preview
5. ตรวจสอบข้อมูลที่จะนำเข้า (จำนวน, ยอดรวม)
6. กดปุ่ม "ยืนยันการนำเข้า"
7. ระบบแสดง Progress Bar
8. เสร็จแล้วแสดง Success Alert พร้อมสรุปผล

### Use Case 3: ดูรายงานยอดขายรายเดือน

**Actor:** เจ้าของธุรกิจ  
**Goal:** วิเคราะห์ยอดขายของเดือนที่แล้ว  
**Steps:**

1. เข้าสู่ระบบ
2. อยู่ที่หน้า Dashboard (หน้าแรก)
3. เลือก Time Range Filter = "เดือนที่แล้ว"
4. ดูข้อมูลจาก Summary Cards
5. ดูแนวโน้มจากกราฟ
6. คลิก "ดูรายการทั้งหมด" เพื่อเข้าไปดูรายละเอียด
7. ส่งออกข้อมูลเป็น Excel สำหรับวิเคราะห์เพิ่มเติม

### Use Case 4: จัดการข้อมูลลูกค้า

**Actor:** พนักงานขาย  
**Goal:** เพิ่มและแก้ไขข้อมูลลูกค้าใหม่  
**Steps:**

1. เข้าสู่ระบบ
2. ไปที่เมนู "จัดการลูกค้า"
3. กดปุ่ม "+ เพิ่มลูกค้าใหม่"
4. กรอกข้อมูล: ชื่อ\*, เบอร์โทร, ที่อยู่, หมายเหตุ
5. กดปุ่ม "บันทึก"
6. ข้อมูลลูกค้าแสดงในตารางทันที

---

## 8. การ Deploy และ Maintenance

### 8.1 Build & Deploy Scripts

```json
{
  "dev": "vite", // Development server
  "build": "vite build", // Production build
  "preview": "vite preview", // Preview production build
  "predeploy": "npm run build", // Pre-deploy hook
  "deploy": "gh-pages -d dist" // Deploy to GitHub Pages
}
```

### 8.2 Version Management

```json
{
  "bump:patch": "npm version patch", // 1.1.1 → 1.1.2
  "bump:minor": "npm version minor", // 1.1.1 → 1.2.0
  "bump:major": "npm version major" // 1.1.1 → 2.0.0
}
```

### 8.3 Environment Setup

**Required Environment Variables (`.env`):**

```bash
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

### 8.4 Deployment Platforms

- **GitHub Pages** (Current)
- **Firebase Hosting** (Alternative)
- **Netlify/Vercel** (Alternative)

---

## 9. การทดสอบ (Testing Strategy)

### 9.1 Manual Testing Checklist

- [ ] Login/Logout functionality
- [ ] Dashboard data display
- [ ] Transfer form submission
- [ ] COD Excel import
- [ ] Customer CRUD operations
- [ ] Filters and date pickers
- [ ] Chart rendering
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

### 9.2 User Acceptance Testing

- การทดสอบโดยผู้ใช้จริง
- Feedback loop และ iteration

---

## 10. Road Map และ Future Enhancements

### Version 2.0 (Proposed)

- [ ] **Multi-user Support** - สิทธิ์การเข้าถึงแบบหลายระดับ
- [ ] **Product Management** - จัดการสินค้า SKU และ inventory
- [ ] **Advanced Analytics** - รายงานเชิงลึก, trends, forecasting
- [ ] **Automated Backup** - สำรองข้อมูลอัตโนมัติ
- [ ] **Email/SMS Notifications** - แจ้งเตือนออเดอร์ใหม่
- [ ] **API Integration** - เชื่อมต่อกับ logistics, payment gateways
- [ ] **Dark Mode** - โหมดสีมืด
- [ ] **Export PDF Reports** - รายงานรูปแบบ PDF

### Version 1.2 (Short-term)

- [ ] **Unit Tests** - Jest/Vitest
- [ ] **E2E Tests** - Cypress/Playwright
- [ ] **Performance Optimization** - Bundle size reduction
- [ ] **Accessibility (a11y)** - ARIA labels, keyboard navigation

---

## 11. การบำรุงรักษา (Maintenance)

### 11.1 Regular Tasks

- ตรวจสอบและอัปเดต dependencies
- Monitor Firebase usage และ costs
- Backup Firestore data เป็นประจำ
- Review security rules

### 11.2 Support

- User training และ documentation
- Bug fixes และ patches
- Feature requests handling

---

## 12. สรุป (Conclusion)

**ManowZab Sales (SalesPilot)** เป็นระบบจัดการข้อมูลการขายและลูกค้าที่ทันสมัย มีการออกแบบ UI/UX ที่ใช้งานง่าย รองรับการทำงานแบบ Real-time ผ่าน Firebase และมีความยืดหยุ่นสูงในการจัดการข้อมูล

ระบบนี้เหมาะสำหรับธุรกิจขนาดเล็กและขนาดกลางที่ต้องการเครื่องมือในการติดตามยอดขาย วิเคราะห์ข้อมูล และจัดการลูกค้าอย่างมีประสิทธิภาพ โดยไม่ต้องลงทุนในระบบขนาดใหญ่

**Key Strengths:**
✅ Real-time data synchronization  
✅ User-friendly interface  
✅ Excel import/export  
✅ Multi-payment type support  
✅ Customer management  
✅ Visual analytics with charts  
✅ Mobile responsive  
✅ PWA ready

---

**เอกสารนี้จัดทำโดย:** Antigravity AI Assistant  
**วันที่:** 9 กุมภาพันธ์ 2026  
**เวอร์ชันเอกสาร:** 1.0
