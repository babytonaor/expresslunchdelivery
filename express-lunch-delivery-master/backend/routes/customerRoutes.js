// ดึงโมดูล Express มาใช้งานเพื่อจัดการ Route
const express = require('express');

// นำเข้า (Import) ฟังก์ชัน Controller สำหรับจัดการข้อมูลลูกค้า
const {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');

// สร้าง Router Object จาก Express เพื่อใช้แยกจัดการเส้นทาง URL
const router = express.Router();

// [GET] /customers - เรียกดูรายการลูกค้าทั้งหมด
router.get('/', getCustomers);

// [POST] /customers - สร้างข้อมูลลูกค้าใหม่
router.post('/', createCustomer);

// [PUT] /customers/:id - แก้ไขข้อมูลลูกค้าตาม ID ที่ระบุ
router.put('/:id', updateCustomer);

// [DELETE] /customers/:id - ลบข้อมูลลูกค้าตาม ID ที่ระบุ
router.delete('/:id', deleteCustomer);

// ส่งออก router ไปให้ไฟล์หลัก (server.js) เรียกใช้งาน
module.exports = router;