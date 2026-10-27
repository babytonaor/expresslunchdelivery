// Import โมดูล HttpClient และ RxJS Operators สำหรับจัดการ Data Stream
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

// Union Type สำหรับกลยุทธ์/อัลกอริทึมการคำนวณเส้นทาง ('nearest' หรือ 'alternative')
export type RouteStrategy = 'nearest' | 'alternative';

// Interface นิยามพิกัดและข้อมูลสถานที่ทั่วไป (เช่น ร้านค้า)
export interface Location {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

// Interface นิยามรายละเอียดของจุดส่งแต่ละจุด (Stop) ของออเดอร์
export interface RouteStop {
  id: number;
  customerId: number;
  customerName: string;
  address: string;
  latitude: number;
  longitude: number;
  totalBoxes: number;
  sequenceNumber: number; // ลำดับจุดส่ง (1, 2, 3)
}

// Interface นิยามสรุปข้อมูลเส้นทาง คำนวณระยะทาง เวลา และกำไร-ต้นทุนสำหรับไรเดอร์แต่ละคน
export interface RiderRoute {
  rider: { id: number; name: string; jobCode: string; status: string };
  stops: RouteStop[];
  totalBoxes: number;
  distanceKm: number;
  travelMinutes: number;
  revenue: number;        // รายได้จำลอง
  foodCost: number;       // ต้นทุนวัตถุดิบอาหาร
  deliveryCost: number;   // ค่าเที่ยว/ค่าส่งของไรเดอร์
  profit: number;         // กำไรสุทธิหลังหักต้นทุน
  estimatedArrival: string; // เวลาคาดการณ์ถึงจุดส่งสุดท้าย
  meetsDeadline: boolean;   // จัดส่งทันกำหนด 12:30 น. หรือไม่
}

// Interface นิยามแผนภาพรวมทั้งหมดที่ส่งมาจาก Backend (รวมร้านค้า + ข้อจำกัด + สรุปตัวเลขรวม + รายเส้นทางไรเดอร์)
export interface RoutePlan {
  strategy: RouteStrategy;
  shop: Location;
  pricing: {
    departureTime: string;
    deadlineTime: string;
    maxBoxesPerOrder: number;
    maxOrdersPerRider: number;
  };
  totals: {
    totalBoxes: number;
    distanceKm: number;
    revenue: number;
    foodCost: number;
    deliveryCost: number;
    profit: number;
    allRoutesMeetDeadline: boolean;
  };
  routes: RiderRoute[];
}

// Interface มาตรฐานสำหรับดักอ่านโครงสร้าง Response จาก Express Backend API
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ประกาศให้ Service เป็น Singleton ใช้ประมวลผลข้อมูลวางแผนเส้นทางทั่วทั้งแอปพลิเคชัน
@Injectable({ providedIn: 'root' })
export class RoutePlanningService {
  // Inject HttpClient สำหรับเชื่อมต่อ API
  private readonly http = inject(HttpClient);
  // URL ปลายทางของ Route Planning API
  private readonly apiUrl = 'http://localhost:3000/api/routes';

  // [POST] ส่งคำขอคำนวณและพรีวิวแผนการจัดส่งจำลองตาม Strategy ที่เลือก ('nearest' | 'alternative')
  preview(strategy: RouteStrategy): Observable<RoutePlan> {
    return this.http.post<ApiResponse<RoutePlan>>(`${this.apiUrl}/preview`, { strategy }).pipe(
      map((response) => {
        // ตรวจสอบโครงสร้าง Response ว่าสำเร็จและมีก้อนข้อมูล data
        if (!response.success || !response.data) {
          throw new Error('The route planning API returned an invalid response.');
        }
        return response.data; // คืนค่าเฉพาะก้อนข้อมูล RoutePlan กลับไปใช้งานบน Component
      }),
    );
  }
}