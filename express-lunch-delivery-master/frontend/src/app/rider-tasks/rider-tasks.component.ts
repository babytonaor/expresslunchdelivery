// Import โมดูลและฟังก์ชันที่จำเป็นจาก Angular และ Services
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RiderTask, RiderTaskService } from '../services/rider-task.service';

// Decorator กำหนดประเภท Component และไฟล์ที่ใช้เชื่อมโยง
@Component({
  imports: [CommonModule, FormsModule], // นำเข้า CommonModule และ FormsModule สำหรับใช้งาน directive และ ngModel
  selector: 'app-rider-tasks', // ชื่อ Selector สำหรับเรียกใช้งานใน Template
  styleUrl: './rider-tasks.component.css', // ไฟล์ style CSS
  templateUrl: './rider-tasks.component.html', // ไฟล์ Template HTML
})
export class RiderTasks {
  // Inject RiderTaskService เข้ามาเพื่อเรียกใช้ API ดึงข้อมูลใบงานไรเดอร์
  private readonly riderTaskService = inject(RiderTaskService);

  // ประกาศ State ในรูปแบบ Signals สำหรับจัดการข้อมูลหน้าจอ
  protected readonly task = signal<RiderTask | null>(null); // เก็บข้อมูลใบงานของไรเดอร์ (ถ้าไม่มีจะเป็น null)
  protected readonly isLoading = signal(false); // สถานะการโหลดข้อมูล (Spinner/Disabled)
  protected readonly errorMessage = signal<string | null>(null); // เก็บข้อความ Error เมื่อค้นหาไม่พบหรือ API มีปัญหา
  protected jobCode = 'JOB-20261012-001'; // ค่าเริ่มต้นของรหัสใบงานในช่องค้นหา

  // ฟังก์ชันค้นหาใบงานตาม jobCode ที่กรอก
  protected findTask(): void {
    const jobCode = this.jobCode.trim(); // ตัดช่องว่างหัว-ท้ายออก
    this.task.set(null); // ล้างข้อมูลใบงานเดิม
    this.errorMessage.set(null); // ล้างข้อความ Error เดิม

    // ตรวจสอบว่าได้กรอกรหัสใบงานมาหรือไม่
    if (!jobCode) {
      this.errorMessage.set('กรุณากรอกเลขใบงาน');
      return;
    }

    this.isLoading.set(true); // เปิดสถานะกำลังโหลด
    // เรียกใช้ Service ส่ง Request ไปยัง Backend API
    this.riderTaskService.getTask(jobCode).subscribe({
      next: (task) => {
        this.task.set(task); // ถ้าพบข้อมูล อัปเดตใส่ Signal task
        this.isLoading.set(false); // ปิดสถานะกำลังโหลด
      },
      error: (error: unknown) => {
        console.error('Failed to load rider task:', error);
        this.errorMessage.set(this.apiErrorMessage(error, 'ค้นหาใบงานไม่สำเร็จ กรุณาลองอีกครั้ง'));
        this.isLoading.set(false);
      },
    });
  }

  // ฟังก์ชันสร้าง URL สำหรับเปิดเส้นทางนำทางรวมทุกจุดส่งใน Google Maps Direction API
  protected mapsUrl(task: RiderTask): string {
    const destination = task.stops[task.stops.length - 1]; // หมุดจุดหมายปลายทาง (จุดส่งสุดท้าย)
    const waypoints = task.stops.slice(0, -1) // จุดแวะระหว่างทาง (จุดส่งทั้งหมด ยกเว้นจุดสุดท้าย)
      .map((stop) => `${stop.latitude},${stop.longitude}`)
      .join('|');
    
    // ตั้งค่า Parameter สำหรับ Google Maps Direct URL
    const params = new URLSearchParams({
      api: '1',
      origin: `${task.shop.latitude},${task.shop.longitude}`, // จุดเริ่มต้น (ตำแหน่งร้านค้า)
      destination: `${destination.latitude},${destination.longitude}`, // จุดส่งสุดท้าย
      travelmode: 'driving', // โหมดการเดินทางแบบขับรถ
    });

    // ถ้ามีจุดแวะระหว่างทาง ให้เพิ่ม parameter waypoints ลงไป
    if (waypoints) {
      params.set('waypoints', waypoints);
    }
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  // ฟังก์ชันสร้าง URL สำหรับค้นหาพิกัดเฉพาะจุดส่งเดียวบน Google Maps
  protected stopMapUrl(latitude: number, longitude: number): string {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  // ฟังก์ชันช่วยสกัดดึงข้อความ Error ที่ส่งมาจาก Backend API
  private apiErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const apiError = error.error;
      if (typeof apiError === 'object' && apiError !== null && 'message' in apiError && typeof apiError.message === 'string') {
        return apiError.message; // คืนค่าข้อความ Error จริงจาก API Response
      }
    }
    return fallback; // คืนค่าข้อความสำรองถ้าอ่าน Error response ไม่ได้
  }
}