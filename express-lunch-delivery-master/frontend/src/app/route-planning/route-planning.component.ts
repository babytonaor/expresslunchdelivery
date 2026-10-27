// Import โมดูลที่จำเป็นจาก Angular framework และ Services ฝั่งวางแผนเส้นทาง
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoutePlan, RoutePlanningService, RouteStrategy, RiderRoute } from '../services/route-planning.service';

// Decorator สำหรับกำหนดการทำงานของ Component
@Component({
  imports: [CommonModule], // นำเข้า CommonModule เพื่อใช้ออปชันการจัดการฟอร์แมตตัวเลข (number pipe) และ Control Flow
  selector: 'app-route-planning', // ชื่อ Tag Selector
  styleUrl: './route-planning.component.css', // ไฟล์สไตล์ CSS
  templateUrl: './route-planning.component.html', // ไฟล์เทมเพลต HTML
})
export class RoutePlanning implements OnInit {
  // Inject บริการสำหรับคำนวณและดึงข้อมูลเส้นทาง API
  private readonly routePlanningService = inject(RoutePlanningService);

  // สเตตข้อมูล Reactive State ด้วย Signals
  protected readonly plan = signal<RoutePlan | null>(null); // เก็บรายละเอียดแผนการจัดส่งทั้งหมด
  protected readonly isLoading = signal(false); // สถานะการโหลดข้อมูล (Spinner/Loading state)
  protected readonly errorMessage = signal<string | null>(null); // ข้อความแจ้งเตือนเมื่อเกิด Error
  protected readonly strategy = signal<RouteStrategy>('nearest'); // เก็บประเภทอัลกอริทึมจัดเส้นทาง ('nearest' หรือ 'alternative')
  protected readonly routeColors = ['#dc2626', '#16a34a', '#2563eb', '#9333ea', '#ea580c']; // รหัสสี Hex สำหรับแบ่งเส้นทางไรเดอร์บน SVG

  // Lifecycle Hook: ทำงานอัตโนมัติเมื่อ Component เริ่มต้น
  ngOnInit(): void {
    this.loadPlan('nearest'); // โหลดแผนการส่งอาหารแบบจัดจุดใกล้ก่อน ('nearest') เป็นค่าเริ่มต้น
  }

  // ฟังก์ชันกดปุ่ม "คำนวณเส้นทางใหม่" เพื่อสลับอัลกอริทึมในการวางแผน (Nearest <-> Alternative)
  protected recalculate(): void {
    this.loadPlan(this.strategy() === 'nearest' ? 'alternative' : 'nearest');
  }

  // ฟังก์ชันส่ง Request ไปยัง Backend เพื่อขอพรีวิวการคำนวณเส้นทางตามอัลกอริทึมที่เลือก
  protected loadPlan(strategy: RouteStrategy): void {
    this.strategy.set(strategy);
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.routePlanningService.preview(strategy).subscribe({
      next: (plan) => {
        this.plan.set(plan); // อัปเดตข้อมูลแผนการคำนวณเข้า Signal
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to calculate mock routes:', error);
        this.errorMessage.set(this.apiErrorMessage(error, 'คำนวณเส้นทางจำลองไม่สำเร็จ'));
        this.isLoading.set(false);
      },
    });
  }

  // คืนค่าสีประจำตัวไรเดอร์จากอาร์เรย์ตามลำดับ Index (เวียนใช้สีเดิมหากจำนวนไรเดอร์เกินสีที่มี)
  protected colorForRoute(index: number): string {
    return this.routeColors[index % this.routeColors.length];
  }

  // สร้าง String พิกัดเชื่อมต่อเส้นทาง (Polyline points) สำหรับวาดเส้นบน SVG โดยเริ่มจากจุดร้าน -> ทุกจุดส่งตามลำดับ
  protected routePolyline(route: RiderRoute): string {
    const plan = this.plan();
    if (!plan) {
      return '';
    }
    return [
      this.mapPoint(plan.shop.latitude, plan.shop.longitude), // พิกัดร้านค้า (จุดเริ่มต้น)
      ...route.stops.map((stop) => this.mapPoint(stop.latitude, stop.longitude)), // พิกัดจุดส่งแต่ละจุด
    ].map(({ x, y }) => `${x},${y}`).join(' '); // แปลงอาร์เรย์พิกัดเป็น String รูปแบบ "x1,y1 x2,y2 ..."
  }

  // ฟังก์ชันคำนวณแปลงพิกัดจริง (Lat/Long) เป็นพิกัดพิกเซล (X, Y) เพื่อนำไปวาดภาพบน SVG Canvas 1000x500
  protected mapPoint(latitude: number, longitude: number): { x: number; y: number } {
    const plan = this.plan();
    // รวมพิกัดทั้งหมดในแผนงาน (ร้าน + จุดส่งของทุกเส้นทาง) มาหาขอบเขตพิกัดต่ำสุด-สูงสุด
    const locations = plan
      ? [plan.shop, ...plan.routes.flatMap((route) => route.stops)]
      : [];
    const latitudes = locations.map((location) => location.latitude);
    const longitudes = locations.map((location) => location.longitude);
    
    // หาค่า Lat/Long ต่ำสุดและสูงสุด
    const minLatitude = Math.min(...latitudes, latitude);
    const maxLatitude = Math.max(...latitudes, latitude);
    const minLongitude = Math.min(...longitudes, longitude);
    const maxLongitude = Math.max(...longitudes, longitude);
    
    // คำนวณช่วงระยะห่างพิกัด (ถ้าเท่ากันให้ใช้ค่าเริ่มต้น 0.001 เพื่อป้องกัน Error หารด้วย 0)
    const latitudeRange = maxLatitude - minLatitude || 0.001;
    const longitudeRange = maxLongitude - minLongitude || 0.001;

    // คำนวณอัตราส่วนและแปลงเป็นจุด Pixel บนแกน X (70px ถึง 930px) และ แกน Y (50px ถึง 440px)
    return {
      x: 70 + ((longitude - minLongitude) / longitudeRange) * 860,
      y: 50 + ((maxLatitude - latitude) / latitudeRange) * 390, // ละติจูดมากจะอยู่ด้านบน (ค่า Y น้อย)
    };
  }

  // ฟังก์ชันสกัดจับข้อความ Error ที่ตอบกลับมาจาก Backend API
  private apiErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const apiError = error.error;
      if (typeof apiError === 'object' && apiError !== null && 'message' in apiError && typeof apiError.message === 'string') {
        return apiError.message; // คืนค่าข้อความ Error จริงจากระบบ Backend
      }
    }
    return fallback; // คืนค่าข้อความสำรองหากสกัดข้อความไม่ได้
  }
}