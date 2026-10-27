// Import โมดูลสำหรับการทดสอบ (Unit Testing) จาก Angular Testing Framework
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrderService } from './order.service';

// กลุ่มการทดสอบ Unit Test สำหรับ OrderService
describe('OrderService', () => {
  let service: OrderService; // ตัวแปรสำหรับเก็บ Instance ของ OrderService
  let httpTesting: HttpTestingController; // ตัวแปรสำหรับจำลอง/ตรวจสอบ HTTP Request

  // ทำงานก่อนเริ่มแต่ละ Test Case (it)
  beforeEach(() => {
    // กำหนดค่าคอนฟิก Test Environment และ Inject Dependencies จำลอง
    TestBed.configureTestingModule({
      providers: [
        OrderService, 
        provideHttpClient(), // เปิดใช้งาน HttpClient ในการทดสอบ
        provideHttpClientTesting() // เปิดใช้งาน HttpTestingController สำหรับจำลอง HTTP Response
      ],
    });

    // ดึง Instance ของ Service และ HttpTestingController มาเตรียมไว้ใช้งาน
    service = TestBed.inject(OrderService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  // ทำงานหลังจบแต่ละ Test Case เพื่อตรวจสอบว่าไม่มี HTTP Request ค้างอยู่
  afterEach(() => {
    httpTesting.verify(); // ตรวจสอบว่าทุก Request ถูกตอบรับครบถ้วนแล้ว ไม่มี Request ที่หลุดค้าง
  });

  // Test Case: ตรวจสอบการยิง Request ดึงข้อมูลออเดอร์และคืนค่าผลลัพธ์กลับมาถูกต้อง
  it('requests orders from the backend and returns the response data', () => {
    // ข้อมูลจำลองสำหรับตอบกลับ (Mock Response Data)
    const mockOrders = [
      {
        id: 1,
        customerName: 'Somchai',
        pickupAddress: 'Restaurant',
        deliveryAddress: 'Office',
        status: 'pending' as const,
      },
    ];

    // 1. เรียกใช้งานฟังก์ชัน getOrders() และดักรอรับข้อมูล
    service.getOrders().subscribe((orders) => {
      expect(orders).toEqual(mockOrders); // ตรวจสอบว่าข้อมูลที่ได้ตรงกับ mockOrders หรือไม่
    });

    // 2. ตรวจสอบว่ายิง API ไปยัง URL ที่ถูกต้อง
    const request = httpTesting.expectOne('http://localhost:3000/api/orders');
    
    // 3. ตรวจสอบว่าใช้ HTTP Method "GET" ในการส่ง Request
    expect(request.request.method).toBe('GET');
    
    // 4. จำลองการส่ง Response สดกลับไปให้ Service
    request.flush({ success: true, data: mockOrders });
  });
});