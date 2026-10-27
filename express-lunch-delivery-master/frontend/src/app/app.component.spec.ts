// Import โมดูลสำหรับการทดสอบ (Unit Testing) จาก Angular Testing Framework
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app.component';

// กลุ่มการทดสอบ Unit Test สำหรับ Root Component (App)
describe('App', () => {
  // ทำงานก่อนเริ่มแต่ละ Test Case เพื่อตั้งค่า Testing Module และคอมไพล์ Component
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App], // นำเข้า Standalone Component (App)
      providers: [provideRouter([])], // จำลอง Router Provider เปล่าสำหรับการทดสอบ Navigation Links และ <router-outlet />
    }).compileComponents();
  });

  // Test Case 1: ตรวจสอบการสร้าง Instance ของ AppComponent ว่าสำเร็จหรือไม่
  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy(); // คาดหวังว่า Instance ของ Component ถูกสร้างขึ้นจริง
  });

  // Test Case 2: ตรวจสอบการ Render แถบนั่ง Navigation ว่ามีข้อความเมนูหลักแสดงผลอยู่ครบถ้วน
  it('should render navigation links for both workspaces', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges(); // สั่ง Trigger Change Detection เพื่อให้ Angular Render Template เข้า DOM
    const compiled = fixture.nativeElement as HTMLElement; // ดึง Element HTML จริงออกมาตรวจสอบ

    // ตรวจสอบว่าใน DOM มีข้อความเมนูของทั้ง Owner Workspace และ Rider Workspace หรือไม่
    expect(compiled.textContent).toContain('จัดการออเดอร์');
    expect(compiled.textContent).toContain('คิวงานไรเดอร์');
  });
});