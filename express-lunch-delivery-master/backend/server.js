// โหลดค่ากำหนดในไฟล์ .env (เช่น PORT) เข้าสู่ process.env
require('dotenv').config();

// นำเข้า (Import) แพ็กเกจและ Route ที่ต้องใช้งาน
const cors = require('cors'); // แพ็กเกจอนุญาต Cross-Origin (ให้ Frontend เรียกใช้ API ได้)
const express = require('express'); // Framework หลักสำหรับสร้าง Web API
const customerRoutes = require('./routes/customerRoutes'); // เส้นทางจัดการลูกค้า
const orderRoutes = require('./routes/orderRoutes');       // เส้นทางจัดการออเดอร์
const routeRoutes = require('./routes/routeRoutes');       // เส้นทางคำนวณและวางแผนเส้นทางส่งอาหาร
const riderRoutes = require('./routes/riderRoutes');       // เส้นทางจัดการไรเดอร์และใบงาน

// สร้าง Express Application
const app = express();
// กำหนด Port ของ Server (ดึงจาก .env หรือใช้ค่าเริ่มต้น 3000)
const port = Number(process.env.PORT) || 3000;

// Middleware เปิดให้ Domain อื่น (เช่น Frontend localhost:4200) เข้าถึง API นี้ได้
app.use(cors());
// Middleware แปลง Body ของ Request ที่ส่งมาในรูปแบบ JSON ให้เป็น Object อัตโนมัติ
app.use(express.json());

// [GET] / - Route สำหรับเช็กสถานะการทำงานเบื้องต้นของ API (Health Check)
app.get('/', (req, res) => {
  res.json({ message: 'Rider Route Management API is running' });
});

// ลงทะเบียน Prefix Path สำหรับ API แต่ละชุด
app.use('/api/orders', orderRoutes);       // แมป /api/orders เข้ากับ orderRoutes
app.use('/api/customers', customerRoutes); // แมป /api/customers เข้ากับ customerRoutes
app.use('/api/routes', routeRoutes);       // แมป /api/routes เข้ากับ routeRoutes
app.use('/api/riders', riderRoutes);       // แมป /api/riders เข้ากับ riderRoutes

// Middleware จัดการเมื่อเรียก URL ที่ไม่มีในระบบ (404 Not Found)
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler Middleware จัดการเมื่อเกิดข้อผิดพลาดรุนแรงในระบบ (500 Internal Server Error)
app.use((err, req, res, next) => {
  console.error(err); // พิมพ์ Log ของ Error ออกบน Console
  res.status(500).json({ message: 'Internal server error' });
});

// เริ่มต้นเปิด Server ให้รอรับ Connection ตาม Port ที่กำหนด
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});