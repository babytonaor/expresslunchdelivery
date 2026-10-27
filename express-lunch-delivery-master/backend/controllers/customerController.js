// ดึงข้อมูลจำลอง (Mock Data) มาใช้งาน
const mockData = require('../data/mockData');

// ฟังก์ชันตรวจสอบความถูกต้องของข้อมูลลูกค้าก่อนบันทึก
function validateCustomer(body) {
  // ตรวจสอบว่า body ส่งมาไหม ถ้าไม่มีให้ใส่เป็น Object ว่างป้องกันโปรแกรมพัง
  const input = body && typeof body === 'object' ? body : {};
  
  // แปลงค่าและตัดพื้นที่ว่าง (trim) หัว-ท้ายของข้อความ
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
  const address = typeof input.address === 'string' ? input.address.trim() : '';
  
  // แปลงค่าพิกัดให้เป็นตัวเลข
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);

  // เช็กว่ากรอกข้อมูลสำคัญครบถ้วนหรือไม่
  if (!name || !phone || !address) {
    return { error: 'กรุณากรอกชื่อ เบอร์โทร และที่อยู่ให้ครบ' };
  }
  // เช็กพิกัดละติจูดให้อยู่ในช่วง -90 ถึง 90
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { error: 'ละติจูดต้องอยู่ระหว่าง -90 ถึง 90' };
  }
  // เช็กพิกัดลองจิจูดให้อยู่ในช่วง -180 ถึง 180
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { error: 'ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180' };
  }

  // ถ้าผ่านเงื่อนไขทั้งหมด คืนค่าข้อมูลที่คลีนแล้วกลับไป
  return { customer: { name, phone, address, latitude, longitude } };
}

// [GET] ดึงรายการลูกค้าทั้งหมด
function getCustomers(req, res) {
  res.json({ success: true, data: mockData.customers });
}

// [POST] สร้างข้อมูลลูกค้าใหม่
function createCustomer(req, res) {
  // ตรวจสอบความถูกต้องของข้อมูลที่ส่งมา
  const result = validateCustomer(req.body);
  if (result.error) {
    return res.status(400).json({ message: result.error }); // คืน Error 400 ถ้าข้อมูลไม่ถูกต้อง
  }

  // สร้าง Object ลูกค้าใหม่ รัน ID เพิ่มขึ้นทีละ 1 แล้วรวมเข้ากับข้อมูลลูกค้า
  const customer = { id: mockData.nextCustomerId++, ...result.customer };
  mockData.customers.push(customer); // เพิ่มลงในอาร์เรย์
  return res.status(201).json({ success: true, data: customer }); // คืน Status 201 (Created)
}

// [PUT] แก้ไขข้อมูลลูกค้าตาม ID
function updateCustomer(req, res) {
  // ค้นหาลูกค้าในอาร์เรย์จาก ID ที่ส่งมาใน URL (req.params.id)
  const customer = mockData.customers.find((item) => item.id === Number(req.params.id));
  if (!customer) {
    return res.status(404).json({ message: 'ไม่พบข้อมูลลูกค้า' }); // ไม่พบ คืน Error 404
  }

  // ตรวจสอบความถูกต้องของข้อมูลใหม่ที่ส่งมาแก้ไข
  const result = validateCustomer(req.body);
  if (result.error) {
    return res.status(400).json({ message: result.error });
  }

  // อัปเดตข้อมูลลูกค้าเดิมด้วยข้อมูลใหม่
  Object.assign(customer, result.customer);
  mockData.currentRoutePlan = null; // รีเซ็ตแผนการวิ่งส่งอาหารเดิม ให้ต้องคำนวณใหม่
  return res.json({ success: true, data: customer });
}

// [DELETE] ลบข้อมูลลูกค้าตาม ID
function deleteCustomer(req, res) {
  const customerId = Number(req.params.id);
  // ค้นหาตำแหน่ง Index ของลูกค้าในอาร์เรย์
  const index = mockData.customers.findIndex((item) => item.id === customerId);
  if (index === -1) {
    return res.status(404).json({ message: 'ไม่พบข้อมูลลูกค้า' });
  }
  // ป้องกันการลบ: ตรวจสอบว่าลูกค้ารายนี้มีออเดอร์ค้างในระบบหรือไม่
  if (mockData.orders.some((item) => item.customerId === customerId)) {
    return res.status(409).json({ message: 'ลบไม่ได้ เนื่องจากลูกค้ามีออเดอร์อยู่ในระบบ' }); // คืน Error 409 (Conflict)
  }

  // ลบข้อมูลลูกค้าออกจากอาร์เรย์
  const [deletedCustomer] = mockData.customers.splice(index, 1);
  mockData.currentRoutePlan = null; // รีเซ็ตแผนการวิ่งส่งอาหาร
  return res.json({ success: true, data: deletedCustomer });
}

// ส่งออกฟังก์ชันทั้งหมดไปให้ไฟล์ Route เรียกใช้งาน
module.exports = { getCustomers, createCustomer, updateCustomer, deleteCustomer };