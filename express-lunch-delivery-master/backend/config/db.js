// โหลดตัวแปรจากไฟล์ .env เข้าสู่ระบบ
require('dotenv').config();

// ดึงโมดูล mysql2 แบบรองรับ async/await (Promise)
const mysql = require('mysql2/promise');

// สร้าง Connection Pool สำหรับจัดการท่อเชื่อมต่อฐานข้อมูล
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',          // ที่อยู่ Database Server (ถ้าไม่มีใช้ localhost)
  port: Number(process.env.DB_PORT) || 3306,         // Port ของ MySQL (ถ้าไม่มีใช้ 3306)
  user: process.env.DB_USER || 'root',              // ชื่อผู้ใช้งาน Database
  password: process.env.DB_PASSWORD || '',          // รหัสผ่านเข้า Database
  database: process.env.DB_NAME || 'lunch_delivery_db', // ชื่อฐานข้อมูลที่ใช้งาน
  waitForConnections: true,                          // ให้รอคิวก่อน ถ้าท่อเชื่อมต่อเต็ม (ไม่ตัดสายทิ้ง)
  connectionLimit: 10,                               // จำกัดจำนวนท่อเชื่อมต่อพร้อมกันสูงสุด 10 ท่อ
  queueLimit: 0                                      // ไม่จำกัดจำนวนคนเข้าคิวรอ
});

// ส่งออก pool ให้ไฟล์อื่นดึงไปใช้งาน
module.exports = pool;