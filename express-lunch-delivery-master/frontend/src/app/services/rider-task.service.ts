// Import โมดูลยิง HTTP Request (HttpClient) และ Operator จาก RxJS
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { RiderRoute, Location } from './route-planning.service';

// Interface นิยามโครงสร้างข้อมูลใบงานของไรเดอร์ (ขยายความสามารถมาจาก RiderRoute)
export interface RiderTask extends RiderRoute {
  jobCode: string;            // รหัสใบงาน (เช่น JOB-20261012-001)
  rider: RiderRoute['rider']; // ข้อมูลไรเดอร์ประจำใบงาน
  shop: Location;             // พิกัดและข้อมูลของร้านค้า (จุดเริ่มต้นส่งอาหาร)
}

// Interface มาตรฐานสำหรับดักอ่านโครงสร้าง Response จาก Express Backend API
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ประกาศ ให้ Service นี้เป็นแบบ Singleton (ใช้ตัวเดียวกันทั่วทั้งแอปพลิเคชัน)
@Injectable({ providedIn: 'root' })
export class RiderTaskService {
  // Inject HttpClient สำหรับใช้ยิง HTTP Requests
  private readonly http = inject(HttpClient);
  // URL ปลายทางของ API สำหรับค้นหาใบงานไรเดอร์
  private readonly apiUrl = 'http://localhost:3000/api/riders/tasks';

  // [GET] ดึงข้อมูลใบงานและแผนเส้นทางของไรเดอร์ตามรหัส jobCode
  getTask(jobCode: string): Observable<RiderTask> {
    // ใช้ encodeURIComponent() ป้องกันปัญหา Character พิเศษหรือช่องว่างใน URL
    return this.http.get<ApiResponse<RiderTask>>(`${this.apiUrl}/${encodeURIComponent(jobCode)}`).pipe(
      map((response) => {
        // ตรวจสอบความถูกต้องของ Response จาก Backend
        if (!response.success || !response.data) {
          throw new Error('The rider task API returned an invalid response.');
        }
        return response.data; // คืนเฉพาะก้อนข้อมูล RiderTask กลับไปใช้งาน
      }),
    );
  }
}