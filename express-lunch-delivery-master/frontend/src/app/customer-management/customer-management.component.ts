// Import โมดูลและฟังก์ชันที่จำเป็นจาก Angular และ Services
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Customer, CustomerDraft, CustomerService } from '../services/customer.service';

// Decorator กำหนดประเภท Component และไฟล์ที่เกี่ยวข้อง
@Component({
  imports: [FormsModule], // นำเข้า FormsModule เพื่อใช้ [(ngModel)] สำหรับ Two-way Data Binding
  selector: 'app-customer-management', // ชื่อ Selector สำหรับนำไปแปะในไฟล์ HTML
  styleUrl: './customer-management.component.css', // ไฟล์ CSS สำหรับหน้าจัดการลูกค้า
  templateUrl: './customer-management.component.html', // ไฟล์ HTML สำหรับหน้าจัดการลูกค้า
})
export class CustomerManagement implements OnInit {
  // ฉีด (Inject) CustomerService เข้ามาเพื่อใช้ส่ง API ไป Backend
  private readonly customerService = inject(CustomerService);

  // สเตตแบบ Signals สำหรับเก็บข้อมูลและข้อความแจ้งเตือนต่างๆ
  protected readonly customers = signal<Customer[]>([]); // เก็บลายชื่อลูกค้าทั้งหมด
  protected readonly errorMessage = signal<string | null>(null); // เก็บข้อความ Error
  protected readonly successMessage = signal<string | null>(null); // เก็บข้อความ Success

  // ตัวแปรสถานะทั่วไป
  protected isSaving = false; // สถานะล็อกปุ่มขณะกำลังบันทึกข้อมูล
  protected editingId: number | null = null; // เก็บ ID ของลูกค้าที่กำลังแก้ไข (ถ้าเป็น null แปลว่ากำลังเพิ่มใหม่)
  protected draft: CustomerDraft = this.emptyDraft(); // เก็บข้อมูลฟอร์มเริ่มต้น

  // Lifecycle Hook: ทำงานอัตโนมัติเมื่อ Component โหลดเสร็จครั้งแรก
  ngOnInit(): void {
    this.loadCustomers(); // เรียกโหลดข้อมูลลูกค้าทันที
  }

  // ฟังก์ชันดึงรายการลูกค้าทั้งหมดจาก Backend
  protected loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (customers) => this.customers.set(customers), // ดึงสำเร็จ ให้อัปเดตค่าเข้า Signal
      error: (error: unknown) => {
        console.error('Failed to load customers:', error);
        this.errorMessage.set('โหลดข้อมูลลูกค้าไม่สำเร็จ กรุณาตรวจสอบ Backend');
      },
    });
  }

  // ฟังก์ชันบันทึกข้อมูลลูกค้า (ใช้ทั้งตอนเพิ่มใหม่และแก้ไข)
  protected saveCustomer(): void {
    this.errorMessage.set(null); // รีเซ็ตข้อความ Error
    this.successMessage.set(null); // รีเซ็ตข้อความ Success
    this.isSaving = true; // เปิดสถานะกำลังบันทึก (ปิดการใช้งานปุ่ม)

    // เลือกว่าจะเรียก API เพิ่มใหม่ (createCustomer) หรือ แก้ไขเดิม (updateCustomer)
    const operation = this.editingId === null
      ? this.customerService.createCustomer({ ...this.draft })
      : this.customerService.updateCustomer(this.editingId, { ...this.draft });

    operation.subscribe({
      next: () => {
        // แสดงข้อความสำเร็จตามโหมดที่ทำ
        this.successMessage.set(this.editingId === null ? 'เพิ่มข้อมูลลูกค้าแล้ว' : 'บันทึกข้อมูลลูกค้าแล้ว');
        this.cancelEdit(); // ล้างฟอร์ม
        this.isSaving = false; // ปิดสถานะบันทึก
        this.loadCustomers(); // ดึงข้อมูลในตารางใหม่
      },
      error: (error: unknown) => {
        console.error('Failed to save customer:', error);
        this.errorMessage.set(this.apiErrorMessage(error, 'บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองอีกครั้ง'));
        this.isSaving = false;
      },
    });
  }

  // ฟังก์ชันกดปุ่ม "แก้ไข" เพื่อดึงข้อมูลลูกค้ารายนั้นขึ้นมาบนฟอร์ม
  protected editCustomer(customer: Customer): void {
    this.editingId = customer.id; // บันทึก ID ลูกค้าที่เลือก
    this.draft = { // คัดลอกข้อมูลใส่ฟอร์ม
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      latitude: customer.latitude,
      longitude: customer.longitude,
    };
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  // ฟังก์ชันลบข้อมูลลูกค้า
  protected deleteCustomer(customer: Customer): void {
    // แสดงกล่องยืนยันก่อนลบข้อมูล
    if (!window.confirm(`ลบข้อมูลลูกค้า "${customer.name}" หรือไม่?`)) {
      return;
    }
    this.customerService.deleteCustomer(customer.id).subscribe({
      next: () => {
        this.successMessage.set('ลบข้อมูลลูกค้าแล้ว');
        this.errorMessage.set(null);
        this.loadCustomers(); // รีเฟรชรายการลูกค้าใหม่
      },
      error: (error: unknown) => {
        console.error('Failed to delete customer:', error);
        this.errorMessage.set(this.apiErrorMessage(error, 'ลบข้อมูลไม่สำเร็จ ลูกค้าที่มีออเดอร์จะลบไม่ได้'));
      },
    });
  }

  // ฟังก์ชันยกเลิกการแก้ไข / รีเซ็ตฟอร์มกลับเป็นค่าเริ่มต้น
  protected cancelEdit(): void {
    this.editingId = null; // คืนค่าโหมดเพิ่มใหม่
    this.draft = this.emptyDraft(); // ล้างค่าในช่องกรอก
  }

  // ฟังก์ชันสร้าง URL สำหรับเปิดพิกัดใน Google Maps
  protected mapUrl(customer: Customer): string {
    return `https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`;
  }

  // ฟังก์ชันสร้าง Object ข้อมูลเริ่มต้นของฟอร์ม (พร้อมพิกัดตั้งต้น)
  private emptyDraft(): CustomerDraft {
    return { name: '', phone: '', address: '', latitude: 16.2452, longitude: 103.2501 };
  }

  // ฟังก์ชันช่วยสกัดจับข้อความ Error ที่ตอบกลับมาจาก Backend API
  private apiErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const apiError = error.error;
      if (typeof apiError === 'object' && apiError !== null && 'message' in apiError && typeof apiError.message === 'string') {
        return apiError.message; // คืนค่าข้อความ Error จริงจาก API
      }
    }
    return fallback; // ถ้าอ่านข้อความไม่ได้ ให้ใช้ข้อความสำรองแทน
  }
}