# Survey Number of PC Web Application

ระบบเว็บแอปพลิเคชันสำรวจและบันทึกจำนวนพนักงาน PC (Product Consultant) ตามสาขา ห้างสรรพสินค้า แบรนด์สินค้า และประเภทการจ้างงาน โดยพัฒนาตามมาตรฐาน **GitHub + Cloudflare Workers API + Cloudflare D1 (SQLite) + Cloudflare Pages**.

---

## 🌟 คุณสมบัติระบบ (Features)

1. **การสำรวจข้อมูล (Multi-user Survey)**:
   - **Cascading Dropdowns**: เลือกภูมิภาค ➔ เลือกห้าง/ช่องทาง ➔ เลือกสาขา
   - **Auto-Load**: ดึงข้อมูลที่เคยบันทึกไว้สำหรับสาขานั้นมาแสดงเพื่อแก้ไขทันที
   - **Cross-Tab Survey Matrix**: ตารางเปรียบเทียบระหว่าง **Brands** (12 แบรนด์) และ **Answer Choices** (5 ประเภท PC)
   - **Auto Totals & Validation**: คำนวณผลรวมตามแถว (Row Total) ผลรวมตามคอลัมน์ (Column Total) และผลรวมทั้งหมด (Grand Total) แบบเรียลไทม์ พร้อมตรวจทานค่าตัวเลข (Integer >= 0)

2. **ระบบผู้ดูแลระบบ (Admin Panel)**:
   - เข้าสู่ระบบด้วยรหัสผ่าน (`admin1234` เป็นค่าเริ่มต้น สามารถตั้งค่าผ่าน `ADMIN_PASSWORD` Environment Variable ได้)
   - **เรียกดูผลการสำรวจ (Browse Results)** พร้อมระบบกรองข้อมูลตาม ภูมิภาค, สาขา, และ แบรนด์
   - **ส่งออกข้อมูล CSV (Export CSV)** ดาวน์โหลดผลการสำรวจทั้งหมดในรูปแบบ UTF-8 CSV
   - **นำเข้ามิติข้อมูล (Import CSV)** สำหรับ Stores, Brands, และ Answer Choices
   - **ลบข้อมูลสำรวจ (Delete/Clear Survey)** และระบบ **Reset All Dimensions**

---

## 🏗️ โครงสร้างไฟล์ในโครงการ (Project Structure)

```
Survey Number of PC/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment pipeline
├── migrations/
│   ├── 0001_schema.sql         # D1 Database Schema DDL
│   └── 0002_seed.sql           # Seed data (1,058 Stores, 12 Brands, 5 Answer Choices)
├── sample_data/
│   ├── sample_stores.csv       # ตัวอย่างไฟล์ CSV มิติสาขา
│   ├── sample_brands.csv       # ตัวอย่างไฟล์ CSV มิติแบรนด์
│   └── sample_answers.csv      # ตัวอย่างไฟล์ CSV มิติตัวเลือกคำตอบ
├── public/
│   ├── index.html              # Frontend HTML Single Page App
│   ├── css/
│   │   └── style.css           # Mobile-first Glassmorphism Design
│   └── js/
│       └── app.js              # Client JavaScript (Cascading dropdown, matrix calculation, admin panel)
├── src/
│   ├── client/
│   │   └── index.ts            # Client TypeScript Source
│   └── worker/
│       └── index.ts            # Cloudflare Workers API & D1 Queries
├── wrangler.toml               # Cloudflare Worker & D1 database configuration
├── package.json                # Project dependencies and deployment scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # คู่มือการใช้งานและการติดตั้ง
```

---

## 🚀 ขั้นตอนการสร้าง Repository ใน GitHub & การใช้งาน

### 1. นำโครงการขึ้น GitHub

1. เปิด Terminal ในโฟลเดอร์โครงการนี้ แล้วเริ่มใช้งาน Git:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Survey Number of PC App with Cloudflare Workers & D1"
   ```
2. สร้าง Repository ใหม่ใน [GitHub](https://github.com/new) (เช่น ชื่อ `survey-number-of-pc`)
3. เชื่อมต่อ Local Git กับ GitHub Remote และ Push โค้ด:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/survey-number-of-pc.git
   git branch -M main
   git push -u origin main
   ```

---

## ☁️ ขั้นตอนการปรับใช้บน Cloudflare (Deployment Guide)

### 1. สร้างฐานข้อมูล Cloudflare D1

1. ติดตั้ง `wrangler` และล็อกอินเข้าสู่ Cloudflare:
   ```bash
   npx wrangler login
   ```
2. สร้างฐานข้อมูล D1 ชื่อ `survey_db`:
   ```bash
   npx wrangler d1 create survey_db
   ```
3. คัดลอก `database_id` ที่ได้ นำไปใส่ในไฟล์ `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "survey_db"
   database_id = "ใส่-D1-DATABASE-ID-ของคุณที่นี่"
   ```

### 2. รัน Migration เพื่อสร้างตารางและลงข้อมูลเริ่มต้น (Seed Data)

- **สำหรับ Local Development (ทดสอบในคอมพิวเตอร์)**:
  ```bash
  npm run d1:init:local
  ```
- **สำหรับ Production D1 บน Cloudflare**:
  ```bash
  npm run d1:init:remote
  ```

---

### 3. ตั้งค่า GitHub Actions สำหรับ Automatic Deployment

ในระบบ GitHub Repository ไปที่ **Settings ➔ Secrets and variables ➔ Actions** แล้วเพิ่ม Secrets 2 ตัว:

1. **`CLOUDFLARE_API_TOKEN`**: Cloudflare API Token ที่มีสิทธิ์แก้ไข Cloudflare Workers / D1 (สร้างได้จาก Cloudflare Dashboard ➔ Profile ➔ API Tokens ➔ Create Token ➔ Edit Cloudflare Workers template)
2. **`CLOUDFLARE_ACCOUNT_ID`**: Account ID ของ Cloudflare (ดูได้จากแถบขวาของหน้า Cloudflare Overview)

เมื่อมี Push โค้ดไปยังสาขา `main` โฟลว์ `.github/workflows/deploy.yml` จะทำการรัน D1 Migration และ Deploy Worker ไปยัง Cloudflare โดยอัตโนมัติ!

---

## 💻 การเปิดรันและทดสอบระบบแบบ Local (Local Development)

รันคำสั่งพัฒนาในเครื่อง:
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:8787` เพื่อทดสอบใช้งาน:
- ทดลองเลือก ภูมิภาค ➔ ห้าง ➔ สาขา
- ทดลองกรอกจำนวนตัวเลขพนักงาน PC แล้วกด **"บันทึกข้อมูลสำรวจ"**
- ทดลองเปิดปุ่ม **⚙️ Admin** มุมขวาบน กรอกรหัสผ่าน `admin1234` เพื่อเข้าดูผลสำรวจและทดสอบดาวน์โหลด CSV

---

## 🔌 รายการ API (API Endpoints)

| HTTP Method | API Path | คำอธิบาย |
| :--- | :--- | :--- |
| `GET` | `/api/dimensions` | ดึงข้อมูลมิติสาขา แบรนด์ และประเภท PC |
| `GET` | `/api/stores` | ดึงรายการสาขาทั้งหมด |
| `GET` | `/api/survey/:storeId` | ดึงข้อมูลผลสำรวจเดิมตาม `storeId` |
| `POST` | `/api/survey` | บันทึกหรืออัปเดตข้อมูลสำรวจของสาขา |
| `POST` | `/api/admin/login` | ตรวจสอบรหัสผ่าน Admin Panel |
| `GET` | `/api/admin/surveys` | ค้นหาผลสำรวจ (รองรับการกรองตามภูมิภาค สาขา แบรนด์) |
| `GET` | `/api/admin/export` | ส่งออกผลสำรวจทั้งหมดเป็นไฟล์ CSV |
| `DELETE` | `/api/admin/survey/:id` | ลบรายการสำรวจตาม ID |
| `DELETE` | `/api/admin/clear` | ล้างผลสำรวจทั้งหมด |
| `POST` | `/api/admin/import/stores` | นำเข้าไฟล์ CSV มิติสาขา |
| `POST` | `/api/admin/import/brands` | นำเข้าไฟล์ CSV มิติแบรนด์ |
| `POST` | `/api/admin/import/answers` | นำเข้าไฟล์ CSV มิติตัวเลือกคำตอบ |
| `POST` | `/api/admin/reset-dimensions` | รีเซ็ตมิติข้อมูลทั้งหมด |
