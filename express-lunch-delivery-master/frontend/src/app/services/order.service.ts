// Import โมดูลยิง HTTP Request (HttpClient) และ Operator จาก RxJS
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

// Union Type กำหนดสถานะออเดอร์ที่เป็นไปได้ทั้งหมดในระบบ Express Lunch Delivery
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

// Interface นิยามโครงสร้างข้อมูลออเดอร์แบบสมบูรณ์ที่ส่งกลับมาจาก Backend
export interface Order {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  totalBoxes: number;
  pickupAddress: string;
  deliveryAddress: string;
  status: OrderStatus;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

// Interface ข้อมูลขั้นต่ำที่ใช้ในการสั่งอาหารใหม่ (เลือกสมาชิกลูกค้า + จำนวนกล่อง)
export interface OrderDraft {
  customerId: number;
  totalBoxes: number;
}

// Interface มาตรฐานสำหรับดักอ่านโครงสร้าง Response จาก Express Backend API
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ประกาศ Injectable ให้ Service นี้เป็น Singleton พร้อมใช้งานได้ทั่วทั้งแอปพลิเคชัน
@Injectable({
  providedIn: 'root',
})
export class OrderService {
  // Inject HttpClient สำหรับจัดการการเชื่อมต่อ HTTP API
  private readonly http = inject(HttpClient);
  // URL ปลายทางของ Order Management API
  private readonly apiUrl = 'http://localhost:3000/api/orders';

  // [GET] ดึงรายการออเดอร์ทั้งหมด
  getOrders(): Observable<Order[]> {
    return this.http.get<ApiResponse<Order[]>>(this.apiUrl).pipe(
      map((response) => {
        // ตรวจสอบความถูกต้องของ Response ว่าต้องสำเร็จและส่งข้อมูลกลับมาเป็น Array
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error('The orders API returned an invalid response.');
        }

        return response.data;
      }),
    );
  }

  // [POST] สร้างออเดอร์จำลองใหม่
  createOrder(draft: OrderDraft): Observable<Order> {
    return this.http.post<ApiResponse<Order>>(this.apiUrl, draft).pipe(
      map((response) => this.unwrap(response)),
    );
  }

  // [PUT] แก้ไขออเดอร์ หรืออัปเดตสถานะการจัดส่ง (รองรับการส่ง partial draft หรือเฉพาะ status)
  updateOrder(id: number, draft: Partial<OrderDraft> & { status?: OrderStatus }): Observable<Order> {
    return this.http.put<ApiResponse<Order>>(`${this.apiUrl}/${id}`, draft).pipe(
      map((response) => this.unwrap(response)),
    );
  }

  // [DELETE] ลบออเดอร์ตาม ID ที่ระบุ คืนค่าเป็น Observable<void>
  deleteOrder(id: number): Observable<void> {
    return this.http.delete<ApiResponse<Order>>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        this.unwrap(response); // ยืนยันความสำเร็จของ Response จาก API ก่อนจบ Observable
      }),
    );
  }

  // ฟังก์ชันสกัด (Unwrap) แกะเฉพาะก้อนข้อมูล data ออกมาจากโครงสร้าง ApiResponse
  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success || response.data === undefined) {
      throw new Error('The orders API returned an invalid response.');
    }

    return response.data;
  }
}