// ดึงโมดูล Express มาใช้งานเพื่อจัดการ Route
const express = require('express');

// นำเข้า (Import) ฟังก์ชัน Controller สำหรับดึงข้อมูลภารกิจงานของไรเดอร์
const { getRiderTask } = require('../controllers/riderController');

// สร้าง Router Object จาก Express เพื่อใช้แยกจัดการเส้นทาง URL
const router = express.Router();

// [GET] /riders/tasks/:jobCode - เรียกดูข้อมูลเส้นทางและงานของไรเดอร์ตามรหัสใบงาน (เช่น /riders/tasks/RIDER-01)
router.get('/tasks/:jobCode', getRiderTask);

// ส่งออก router ไปให้ไฟล์หลัก (server.js) เรียกใช้งาน
module.exports = router;