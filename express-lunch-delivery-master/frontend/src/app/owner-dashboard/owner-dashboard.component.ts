// Import โมดูลที่จำเป็นจาก Angular framework และ Services ฝั่ง Frontend
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Customer, CustomerService } from '../services/customer.service';
import { Order, OrderDraft, OrderService, OrderStatus } from '../services/order.service';

// Decorator สำหรับกำหนดสเปกของ Component
@Component({
  imports: [FormsModule, RouterLink], // นำเข้า FormsModule สำหรับ ngModel และ RouterLink สำหรับลิงก์ข้ามหน้า
  selector: 'app-owner-dashboard', // ชื่อ Tag Selector เมื่อนำไปเรียกใช้งาน
  styleUrl: './owner-dashboard.component.css', // ไฟล์ CSS สำหรับหน้านี้
  templateUrl: './owner-dashboard.component.html', // ไฟล์ HTML สำหรับหน้านี้
})
export class OwnerDashboard implements OnInit {
  // Inject บริการ (Services) สำหรับสื่อสารกับ Backend API
  private readonly orderService = inject(OrderService);
  private readonly customerService = inject(CustomerService);

  // สถานะข้อมูลในลักษณะ Signals (การจัดการ Reactive State ใน Angular เวอร์ชันใหม่)
  protected readonly orders = signal<Order[]>([]); // เก็บลายชื่อออเดอร์ทั้งหมด
  protected readonly customers = signal<Customer[]>([]); // เก็บลายชื่อลูกค้าสำหรับเลือกในฟอร์ม
  protected readonly isLoading = signal(false); // สถานะการโหลดข้อมูลในตาราง
  protected readonly errorMessage = signal<string | null>(null); // ข้อความแจ้งเตือนเมื่อเกิด Error
  protected readonly successMessage = signal<string | null>(null); // ข้อความแจ้งเตือนเมื่อทำรายการสำเร็จ

  // ตัวแปรควบคุมการทำงานของฟอร์ม
  protected isSaving = false; // สถานะขณะกำลังกดบันทึกข้อมูล
  protected editingOrderId: number | null = null; // เก็บ ID ออเดอร์ที่กำลังแก้ไข (ถ้าเป็น null คือสร้างใหม่)
  protected orderDraft: OrderDraft = { customerId: 1, totalBoxes: 1 }; // ตัวแปรเก็บค่าจากฟอร์มเริ่มต้น

  // Lifecycle Hook: ทำงานอัตโนมัติเมื่อ Component เริ่มต้น
  ngOnInit(): void {
    this.loadData();
  }

  // ฟังก์ชันโหลดข้อมูลออเดอร์และลูกค้ารวมกัน
  protected loadData(): void {
    this.loadOrders();
    this.loadCustomers();
  }

  // ฟังก์ชันดึงรายการออเดอร์ทั้งหมดมาจาก Backend
  protected loadOrders(): void {
    this.isLoading.set(true); // เปิดสถานะกำลังโหลด
    this.errorMessage.set(null); // ล้างข้อความ Error เดิม

    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders); // อัปเดตรายการออเดอร์เข้า Signal
        this.isLoading.set(false); // ปิดสถานะโหลด
      },
      error: (error: unknown) => {
        console.error('Failed to load orders:', error);
        this.errorMessage.set('โหลดรายการออเดอร์ไม่สำเร็จ กรุณาตรวจสอบ Backend แล้วลองอีกครั้ง');
        this.isLoading.set(false);
      },
    });
  }

  // ฟังก์ชันบันทึกออเดอร์ (ใช้ได้ทั้งเพิ่มใหม่และแก้ไข)
  protected saveOrder(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isSaving = true;
    const editingId = this.editingOrderId;
    
    // ตรวจสอบว่าเป็นการสร้างใหม่หรือแก้ไข
    const operation = editingId === null
      ? this.orderService.createOrder({ ...this.orderDraft })
      : this.orderService.updateOrder(editingId, { ...this.orderDraft });

    operation.subscribe({
      next: () => {
        this.successMessage.set(editingId === null ? 'เพิ่มออเดอร์แล้ว' : 'แก้ไขออเดอร์แล้ว');
        this.cancelEdit(); // ล้างฟอร์ม
        this.isSaving = false;
        this.loadOrders(); // รีเฟรชตารางออเดอร์
      },
      error: (error: unknown) => {
        console.error('Failed to save order:', error);
        this.errorMessage.set(this.apiErrorMessage(error, 'บันทึกออเดอร์ไม่สำเร็จ กรุณาตรวจสอบข้อมูล'));
        this.isSaving = false;
      },
    });
  }

  // ฟังก์ชันกดปุ่ม "แก้ไข" เพื่อดึงข้อมูลออเดอร์ที่เลือกมาลงในฟอร์ม
  protected editOrder(order: Order): void {
    this.editingOrderId = order.id;
    this.orderDraft = { customerId: order.customerId, totalBoxes: order.totalBoxes };
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  // ฟังก์ชันลบออเดอร์
  protected deleteOrder(order: Order): void {
    if (!window.confirm(`ลบออเดอร์ #${order.id} หรือไม่?`)) {
      return;
    }
    this.orderService.deleteOrder(order.id).subscribe({
      next: () => {
        this.successMessage.set(`ลบออเดอร์ #${order.id} แล้ว`);
        this.errorMessage.set(null);
        this.loadOrders();
      },
      error: (error: unknown) => {
        console.error('Failed to delete order:', error);
        this.errorMessage.set(this.apiErrorMessage(error, 'ลบออเดอร์ไม่สำเร็จ'));
      },
    });
  }

  // ฟังก์ชันเปลี่ยนสถานะออเดอร์ทันทีผ่าน Dropdown ในตาราง
  protected updateStatus(order: Order, status: OrderStatus): void {
    this.orderService.updateOrder(order.id, { status }).subscribe({
      next: () => {
        this.successMessage.set(`เปลี่ยนสถานะออเดอร์ #${order.id} แล้ว`);
        this.errorMessage.set(null);
        this.loadOrders();
      },
      error: (error: unknown) => {
        console.error('Failed to update order status:', error);
        this.errorMessage.set(this.apiErrorMessage(error, 'เปลี่ยนสถานะออเดอร์ไม่สำเร็จ'));
      },
    });
  }

  // ฟังก์ชันยกเลิกการแก้ไขและล้างข้อมูลบนฟอร์ม
  protected cancelEdit(): void {
    this.editingOrderId = null;
    this.orderDraft = { customerId: this.customers()[0]?.id ?? 1, totalBoxes: 1 };
  }

  // แปลงค่าสถานะภาษาอังกฤษให้เป็นข้อความภาษาไทยสำหรับแสดงผลบน UI
  protected statusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      pending: 'รอดำเนินการ',
      preparing: 'กำลังเตรียม',
      ready: 'พร้อมจัดส่ง',
      delivering: 'กำลังจัดส่ง',
      delivered: 'จัดส่งแล้ว',
      cancelled: 'ยกเลิก',
    };

    return labels[status];
  }

  // สร้างชื่อ CSS Class สำหรับ Badge แสดงสีตามสถานะ
  protected statusClass(status: OrderStatus): string {
    return `status-${status.replace('_', '-')}`;
  }

  // ฟังก์ชันภายในเพื่อดึงข้อมูลลูกค้ามาใส่ในช่องเลือก (Dropdown)
  private loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customers.set(customers);
        // กำหนดให้เลือกลูกค้าคนแรกอัตโนมัติถ้าเป็นการสร้างออเดอร์ใหม่
        if (this.editingOrderId === null && customers.length > 0) {
          this.orderDraft.customerId = customers[0].id;
        }
      },
      error: (error: unknown) => {
        console.error('Failed to load customers for orders:', error);
        this.errorMessage.set('โหลดรายชื่อลูกค้าไม่สำเร็จ กรุณาตรวจสอบ Backend');
      },
    });
  }

  // ฟังก์ชันช่วยสกัดจับข้อความ Error จาก API ตอบกลับ
  private apiErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const apiError = error.error;
      if (typeof apiError === 'object' && apiError !== null && 'message' in apiError && typeof apiError.message === 'string') {
        return apiError.message;
      }
    }
    return fallback;
  }
}