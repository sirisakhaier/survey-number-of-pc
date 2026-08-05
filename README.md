# 📊 Survey Number of PC Web Application
> **Haier Electrical Appliances (Thailand) Co., Ltd.**  
> ระบบเว็บแอปพลิเคชันสำรวจและบันทึกจำนวนพนักงาน PC (Product Consultant) ตามสาขา ห้างสรรพสินค้า แบรนด์สินค้า และประเภทการจ้างงาน

[![Live Demo](https://img.shields.io/badge/Live_App-Cloudflare_Workers-005AAA?style=for-the-badge&logo=cloudflare)](https://survey-app.sirisak-haier.workers.dev)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/sirisakhaier/survey-number-of-pc)

---

## 🌟 คุณสมบัติเด่นของระบบ (Key Features)

### 1. 📝 หน้าสำรวจข้อมูล (Survey Landing Page for Field Users)
- **Cascading Dropdowns**: ลำดับการเลือก: `1. เลือกห้าง/ช่องทาง (Mall)` ➔ `2. เลือกภูมิภาค (Region)` ➔ `3. เลือกสาขา (Store Name)`
- **Auto Data Pre-fill**: ดึงคำตอบที่เคยบันทึกไว้ของสาขานั้นมาแสดงในตารางโดยอัตโนมัติ เพื่อความสะดวกในการอัปเดตข้อมูล
- **Matrix Layout (Desktop & Mobile Responsive)**: ตารางบันทึกจำนวน PC แบบพิกัดระหว่าง **12 แบรนด์** (Hisense, Samsung, LG, TCL, Toshiba, Mitsu Heavy, Mitsu Elec, Midea, Sanden, Daikin, Electrolux, Hitachi) และ **5 ประเภท PC** (MA PC, TV PC, AC PC, Promoter, Partime)
- **Blank Input Handling**: เริ่มต้นด้วยช่องว่าง (BLANK) ไม่แสดงเลข 0 และช่องที่ไม่กรอกจะไม่ถูกบันทึกเข้าฐานข้อมูลเพื่อลดขนาดไฟล์
- **Validation**: ตรวจสอบเบอร์โทรศัพท์มือถือ 10 หลัก (เริ่มต้นด้วย 0) และคำนวณยอดรวม (Row Total, Column Total, Grand Total) แบบเรียลไทม์

### 2. 🔐 ระบบกำหนดสิทธิ์การใช้งาน (Role-Based Access Control)
- **แผงเข้าสู่ระบบ (Sign-In Screen)**: รองรับการกดปุ่ม `ENTER` ในช่อง Username/Password เพื่อเข้าสู่ระบบทันที
- **👑 Admin Role** (`admin` / default password: `admin1234`):
  - สิทธิ์เต็มในการบริหารจัดการระบบ (แดชบอร์ดผู้บริหาร, ดูผลสำรวจ, ส่งออก CSV, นำเข้า CSV มิติข้อมูล, เปิด/ปิด มิติข้อมูล, ลบรายการสำรวจ, และรีเซ็ตข้อมูล)
- **👁️ Viewer Role** (`viewer` / default password: `viewer1234`):
  - สิทธิ์สำหรับผู้บริหารและผู้ตรวจสอบ (ดูแดชบอร์ดสรุปผู้บริหาร, ดูผลการสำรวจ, ดาวน์โหลด CSV)
  - ซ่อนเมนูจัดการ active/inactive, ปุ่มนำเข้าข้อมูล, และปุ่มลบ/รีเซ็ตข้อมูลทั้งหมด

### 3. 📈 แดชบอร์ดสรุปผู้บริหาร (Executive Dashboard)
- **Main Selection Filter (ห้าง/ช่องทาง)**: กรองข้อมูลสถิติมุมมองระดับห้างสรรพสินค้า (เช่น บิ๊กซี, โลตัส, โฮมโปร, ไทยวัสดุ ฯลฯ)
- **KPI Metrics Cards**: แสดงสถิติสำคัญ ได้แก่ จำนวนสาขาที่สำรวจแล้ว, Coverage Ratio %, จำนวน PC รวมทุกประเภท, จำนวนภูมิภาค และจำนวนแบรนด์ที่เปิดใช้งาน
- **Interactive Visual Charts (Chart.js)**:
  - กราฟวงกลมแสดงสัดส่วน PC แยกตามแบรนด์
  - กราฟวงกลมแสดงสัดส่วน PC แยกตามประเภทคำตอบ
  - กราฟแท่งเปรียบเทียบจำนวน PC รวม และจำนวนสาขาที่สำรวจแยกตามภูมิภาค

### 4. 📋 รายงานผลการสำรวจ (Survey Results Table)
- **Smart Filtering**: กรองผลสำรวจตาม ห้าง, ภูมิภาค, สาขา, และ แบรนด์
- **Horizon Scroll & Fixed Height**: แสดงตารางรายงานแบบจำกัดความสูงสายตา (~12 แถว) พร้อมแถบเลื่อน Vertical Scroll และ Horizontal Scroll สำหรับดูข้อมูลแบรนด์ทั้งหมดได้ในหน้าจอเดียว
- **Export CSV**: ดาวน์โหลดข้อมูลผลการสำรวจทั้งหมดเป็นไฟล์ UTF-8 CSV รองรับการเปิดใช้งานกับ Microsoft Excel
- **Safety First**: ยกเลิกปุ่ม Clear All Data เพื่อป้องกันความผิดพลาดในการลบข้อมูลทั้งหมดโดยไม่ตั้งใจ

### 5. ⚙️ การจัดการมิติข้อมูล Active / Inactive (Manage Dimensions)
- **🏬 1. เปิด/ปิด ทั้งห้าง (Whole Customer / Mall)**: กดเปิด/ปิดใช้งานสถานะ Active/Inactive ให้กับทุกสาขาในห้างนั้นได้ด้วยการคลิกเพียงครั้งเดียว
- **🏪 2. เปิด/ปิด สาขา ในห้างที่เลือก (Store in Select Mall)**: ตัวเลือกค้นหาตามห้างเพื่อดูและจัดการเปิด/ปิดการใช้งานสาขารายแห่ง
- **🏷️ 3. แบรนด์ & 📋 4. ประเภท PC**: เปิด/ปิดการแสดงผลตัวเลือกแบรนด์และประเภท PC ในหน้าสำรวจ

### 6. 📥 นำเข้าและรีเซ็ตมิติข้อมูล (Targeted Import CSV & Resets)
- **Import CSV**: นำเข้าไฟล์ CSV มิติข้อมูล 3 หมวด (Stores, Brands, Answer Choices)
- **Targeted Reset Controls**: แยกปุ่มรีเซ็ตออกเป็นส่วนๆ ชัดเจน:
  - `🗑️ Reset Stores Data Only`: ลบเฉพาะมิติสาขา
  - `🗑️ Reset Brands Data Only`: ลบเฉพาะมิติแบรนด์
  - `🗑️ Reset Answer Choices Data Only`: ลบเฉพาะมิติตัวเลือกประเภท PC
  - `📋 Reset Whole Survey Answer Data`: ล้างเฉพาะผลคำตอบการสำรวจทั้งหมด
  - `🔥 Reset All Dimensions & Clear Database`: ล้างมิติข้อมูลและผลสำรวจทั้งหมดในระบบ D1

---

## 🏗️ โครงสร้างไฟล์ในโครงการ (Project Structure)

```
Survey Number of PC/
├── migrations/
│   ├── 0001_schema.sql         # Database DDL Schema (Stores, Brands, Answer Choices, Headers, Details)
│   └── 0002_seed.sql           # Seed Data (1,058 Stores, 12 Brands, 5 Answer Choices)
├── sample_data/
│   ├── sample_stores.csv       # ไฟล์ CSV ตัวอย่างสำหรับนำเข้ามิติสาขา
│   ├── sample_brands.csv       # ไฟล์ CSV ตัวอย่างสำหรับนำเข้ามิติแบรนด์
│   └── sample_answers.csv      # ไฟล์ CSV ตัวอย่างสำหรับนำเข้ามิติตัวเลือกคำตอบ
├── public/
│   ├── index.html              # Single Page Application HTML Architecture
│   ├── css/
│   │   └── style.css           # Glassmorphism Modern Styling & Dark Mode CSS Variables
│   └── js/
│       └── app.js              # Client JS (Cascading Dropdowns, Matrix Calculations, Dashboard & Admin)
├── src/
│   └── worker/
│       └── index.ts            # Cloudflare Worker REST API & D1 SQLite Handler
├── wrangler.toml               # Cloudflare Workers & D1 Binding Configuration
├── package.json                # Dependencies & Build/Deploy Scripts
└── README.md                   # เอกสารประกอบโครงการ
```

---

## 💻 การเปิดรันและทดสอบระบบแบบ Local (Local Development)

1. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
2. รันคำสั่งพัฒนาเครื่องท้องถิ่น:
   ```bash
   npm run dev
   ```
3. เปิดเบราว์เซอร์ไปที่ `http://localhost:8787` เพื่อทดสอบระบบ

---

## 🚀 การปรับใช้บน Cloudflare (Deployment Guide)

### 1. สร้าง D1 Database & Deploy Worker
```bash
# ล็อกอินเข้าสู่ Cloudflare CLI
npx wrangler login

# สร้างฐานข้อมูล D1
npx wrangler d1 create survey_db

# รัน Migration ข้อมูลไปยัง Cloudflare D1 Remote
npm run d1:init:remote

# Build & Deploy ขึ้น Cloudflare Workers
npm run deploy
```

---

## 🔌 รายการ API (API Endpoints Summary)

| Method | Endpoint Path | Role Permission | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dimensions` | Public | ดึงข้อมูลมิติที่ Active (`?includeInactive=true` สำหรับแอดมิน) |
| `GET` | `/api/stores` | Public | ดึงรายการสาขาทั้งหมด |
| `GET` | `/api/survey/:storeId` | Public | ดึงผลการสำรวจเดิมของสาขา |
| `POST` | `/api/survey` | Public | บันทึกคำตอบแบบสำรวจของสาขา |
| `POST` | `/api/admin/login` | Public | ตรวจสอบสิทธิ์การเข้าใช้งาน (`admin` / `viewer`) |
| `GET` | `/api/admin/stats` | Admin / Viewer | ดึงข้อมูลสถิติแดชบอร์ดผู้บริหาร (รองรับ `?mall=...`) |
| `GET` | `/api/admin/surveys` | Admin / Viewer | ค้นหาผลการสำรวจ (รองรับตัวกรอง Mall, Region, Store, Brand) |
| `GET` | `/api/admin/export` | Admin / Viewer | ดาวน์โหลดรายงานผลการสำรวจเป็นไฟล์ CSV |
| `DELETE`| `/api/admin/survey/:id` | Admin Only | ลบรายการผลการสำรวจรายแถว |
| `POST` | `/api/admin/dimension/toggle` | Admin Only | สลับสถานะ Active/Inactive (`malls`, `stores`, `brands`, `answerChoices`) |
| `POST` | `/api/admin/import/stores` | Admin Only | นำเข้าไฟล์ CSV มิติสาขา |
| `POST` | `/api/admin/import/brands` | Admin Only | นำเข้าไฟล์ CSV มิติแบรนด์ |
| `POST` | `/api/admin/import/answers`| Admin Only | นำเข้าไฟล์ CSV มิติตัวเลือกคำตอบ |
| `POST` | `/api/admin/reset-dimensions`| Admin Only | รีเซ็ตข้อมูลเฉพาะส่วน (`stores`, `brands`, `answers`, `surveys`, `all`) |

---

© **Haier Electrical Appliances (Thailand) Co., Ltd.** All rights reserved.
