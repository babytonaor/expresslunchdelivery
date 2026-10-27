// ดึงโมดูล Express มาใช้งานเพื่อจัดการ Route
const express = require('express');

// นำเข้า (Import) ฟังก์ชัน Controller สำหรับจัดการข้อมูลออเดอร์
const {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder
} = require('../controllers/orderController');

// สร้าง Router Object จาก Express เพื่อใช้แยกจัดการเส้นทาง URL
const router = express.Router();

// [GET] /orders - เรียกดูรายการออเดอร์ทั้งหมด
router.get('/', getOrders);

// [POST] /orders - สร้างออเดอร์ใหม่
router.post('/', createOrder);

// [PUT] /orders/:id - แก้ไขข้อมูลออเดอร์ตาม ID ที่ระบุ
router.put('/:id', updateOrder);

// [DELETE] /orders/:id - ลบออเดอร์ตาม ID ที่ระบุ
router.delete('/:id', deleteOrder);

// ส่งออก router ไปให้ไฟล์หลัก (server.js) เรียกใช้งาน
module.exports = router;