// ดึงข้อมูลจำลอง (Mock Data) มาใช้งาน
const mockData = require('../data/mockData');

// กำหนดรายการสถานะออเดอร์ที่อนุญาตให้ใช้งานได้ (Set ช่วยให้ค้นหาข้อมูลได้รวดเร็ว)
const allowedStatuses = new Set(['pending', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']);

// ฟังก์ชันสำหรับรวมข้อมูลออเดอร์เข้ากับข้อมูลลูกค้าและร้านค้า ให้สมบูรณ์พร้อมส่งกลับไป Frontend
function serializeOrder(order) {
  // ค้นหาข้อมูลลูกค้าจาก customerId ในออเดอร์
  const customer = mockData.customers.find((item) => item.id === order.customerId);

  return {
    ...order, // คัดลอกข้อมูลเดิมของออเดอร์ (id, customerId, totalBoxes, status, createdAt)
    customerName: customer ? customer.name : 'ไม่พบข้อมูลลูกค้า',
    customerPhone: customer ? customer.phone : '',
    pickupAddress: mockData.shop.address, // ที่อยู่ออกรถ (ที่อยู่ร้านค้า)
    deliveryAddress: customer ? customer.address : '',
    latitude: customer ? customer.latitude : null,
    longitude: customer ? customer.longitude : null
  };
}

// [GET] ดึงรายการออเดอร์ทั้งหมด พร้อมแปลงข้อมูลให้สมบูรณ์
function getOrders(req, res) {
  res.json({ success: true, data: mockData.orders.map(serializeOrder) });
}

// [POST] สร้างออเดอร์ใหม่
function createOrder(req, res) {
  // ดึงค่า customerId และ totalBoxes จาก Request Body
  const { customerId, totalBoxes } = req.body && typeof req.body === 'object' ? req.body : {};
  const customer = mockData.customers.find((item) => item.id === Number(customerId));
  const boxes = Number(totalBoxes);

  // ตรวจสอบว่าพบข้อมูลลูกค้าหรือไม่
  if (!customer) {
    return res.status(400).json({ message: 'ไม่พบข้อมูลลูกค้าที่เลือก' });
  }
  // ตรวจสอบว่าจำนวนกล่องเป็นจำนวนเต็ม และไม่เกินขีดจำกัดสูงสุดต่อออเดอร์
  if (!Number.isInteger(boxes) || boxes < 1 || boxes > mockData.pricing.maxBoxesPerOrder) {
    return res.status(400).json({ message: `จำนวนกล่องต้องอยู่ระหว่าง 1-${mockData.pricing.maxBoxesPerOrder} กล่องต่อออเดอร์` });
  }

  // สร้าง Object ออเดอร์ใหม่ กำหนดสถานะเริ่มต้นเป็น 'pending'
  const order = {
    id: mockData.nextOrderId++,
    customerId: customer.id,
    totalBoxes: boxes,
    status: 'pending',
    createdAt: new Date().toISOString() // บันทึกเวลาปัจจุบันในรูปแบบ ISO
  };
  mockData.orders.push(order); // บันทึกลงในอาร์เรย์
  mockData.currentRoutePlan = null; // รีเซ็ตแผนการส่งอาหารเดิม ให้ต้องคำนวณใหม่

  return res.status(201).json({ success: true, data: serializeOrder(order) });
}

// [PUT] แก้ไขข้อมูลออเดอร์ตาม ID
function updateOrder(req, res) {
  // ค้นหาออเดอร์จาก ID ใน URL
  const order = mockData.orders.find((item) => item.id === Number(req.params.id));
  if (!order) {
    return res.status(404).json({ message: 'ไม่พบออเดอร์ที่ต้องการแก้ไข' });
  }

  const { customerId, totalBoxes, status } = req.body && typeof req.body === 'object' ? req.body : {};
  
  // ถ้ามีการส่ง customerId มาแก้ไข ให้ตรวจสอบว่ามีลูกค้ารายนี้จริงไหม
  if (customerId !== undefined) {
    const customer = mockData.customers.find((item) => item.id === Number(customerId));
    if (!customer) {
      return res.status(400).json({ message: 'ไม่พบข้อมูลลูกค้าที่เลือก' });
    }
    order.customerId = customer.id;
  }

  // ถ้ามีการส่ง totalBoxes มาแก้ไข ให้ตรวจสอบเงื่อนไขจำนวนกล่อง
  if (totalBoxes !== undefined) {
    const boxes = Number(totalBoxes);
    if (!Number.isInteger(boxes) || boxes < 1 || boxes > mockData.pricing.maxBoxesPerOrder) {
      return res.status(400).json({ message: `จำนวนกล่องต้องอยู่ระหว่าง 1-${mockData.pricing.maxBoxesPerOrder} กล่องต่อออเดอร์` });
    }
    order.totalBoxes = boxes;
  }

  // ถ้ามีการส่ง status มาแก้ไข ให้เช็กว่าอยู่ในสถานะที่อนุญาตไว้หรือไม่
  if (status !== undefined) {
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ message: 'สถานะออเดอร์ไม่ถูกต้อง' });
    }
    order.status = status;
  }

  mockData.currentRoutePlan = null; // รีเซ็ตแผนการส่งอาหาร
  return res.json({ success: true, data: serializeOrder(order) });
}

// [DELETE] ลบออเดอร์ตาม ID
function deleteOrder(req, res) {
  // ค้นหาตำแหน่ง Index ของออเดอร์
  const index = mockData.orders.findIndex((item) => item.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: 'ไม่พบออเดอร์ที่ต้องการลบ' });
  }

  // ลบออเดอร์ออกจากอาร์เรย์
  const [deletedOrder] = mockData.orders.splice(index, 1);
  mockData.currentRoutePlan = null; // รีเซ็ตแผนการส่งอาหาร
  return res.json({ success: true, data: serializeOrder(deletedOrder) });
}

// ส่งออกฟังก์ชันทั้งหมดไปให้ไฟล์ Route เรียกใช้งาน
module.exports = { getOrders, createOrder, updateOrder, deleteOrder };