// Import โมดูลสำหรับการยิง HTTP Request และการจัดการ Observable Data Stream (RxJS)
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

// Interface นิยามโครงสร้างข้อมูลลูกค้าที่ดึงมาจาก Backend
export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
}

// Type สำหรับข้อมูลฟอร์มตอนเพิ่ม/แก้ไข (ตัดคีย์ 'id' ออก เพราะ Backend เป็นคนสร้าง ID)
export type CustomerDraft = Omit<Customer, 'id'>;

// Interface มาตรฐานสำหรับอ่านโครงสร้าง Response จาก Backend ({ success: boolean, data: T })
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// กำหนดให้ Service นี้เป็นแบบ Singleton (ใช้ตัวเดียวกันทั่วทั้ง App)
@Injectable({ providedIn: 'root' })
export class CustomerService {
  // Inject HttpClient สำหรับยิง Rest API
  private readonly http = inject(HttpClient);
  // URL ปลายทางของ Customer API
  private readonly apiUrl = 'http://localhost:3000/api/customers';

  // [GET] ดึงรายการลูกค้าทั้งหมด
  getCustomers(): Observable<Customer[]> {
    return this.http.get<ApiResponse<Customer[]>>(this.apiUrl).pipe(
      map((response) => this.unwrap(response)), // แปลงโครงสร้างข้อความ ดึงเอาเฉพาะค่าใน data
    );
  }

  // [POST] ยิงข้อมูลเพิ่มลูกค้าใหม่
  createCustomer(draft: CustomerDraft): Observable<Customer> {
    return this.http.post<ApiResponse<Customer>>(this.apiUrl, draft).pipe(
      map((response) => this.unwrap(response)),
    );
  }

  // [PUT] ยิงข้อมูลแก้ไขลูกค้าตาม ID
  updateCustomer(id: number, draft: CustomerDraft): Observable<Customer> {
    return this.http.put<ApiResponse<Customer>>(`${this.apiUrl}/${id}`, draft).pipe(
      map((response) => this.unwrap(response)),
    );
  }

  // [DELETE] ยิงคำสั่งลบลูกค้าตาม ID
  deleteCustomer(id: number): Observable<Customer> {
    return this.http.delete<ApiResponse<Customer>>(`${this.apiUrl}/${id}`).pipe(
      map((response) => this.unwrap(response)),
    );
  }

  // ฟังก์ชันช่วยแกะ (Unwrap) ข้อมูลออกจากโครงสร้าง ApiResponse และตรวจเช็กความถูกต้อง
  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success || response.data === undefined) {
      throw new Error('The customers API returned an invalid response.'); // โยน Error ถ้า success เป็น false หรือไม่มี data
    }
    return response.data; // คืนค่าเฉพาะตัวเนื้อข้อมูล (data) กลับไป
  }
}