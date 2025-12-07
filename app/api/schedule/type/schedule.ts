export interface ClassSlot {
  id: string;        // ID ของคาบนั้นๆ
  day: string;       // 'Monday', 'Tuesday', ...
  period: number;    // คาบที่เท่าไหร่ (1-10)
  subjectCode: string; // รหัสวิชา
  subjectName: string; // ชื่อวิชา
  teacherId?: string;  // ID ของอาจารย์
  roomId?: string;     // ID ของห้องเรียน
  color?: string;    // สีพื้นหลังวิชา
}

export interface Subject {
  id: string;        // ID ของวิชา
  code: string;      // รหัสวิชา
  name: string;      // ชื่อวิชา
  color?: string;    // สีพื้นหลัง
  teacherId?: string;  // ID ของอาจารย์
  roomId?: string;
}

export interface Teacher {
  id: string;        // ID ของอาจารย์
  name: string;      // ชื่ออาจารย์
  availableRooms: string[]; // รายการ ID ห้องที่สอนได้
}

export interface Room {
  id: string;        // ID ของห้อง
  name: string;      // ชื่อห้อง (เช่น "404", "Lab 1")
  capacity?: number; // ความจุ
}

export interface SchoolInfo {
  name: string;      // ชื่อโรงเรียน
  startTime: string;   // เวลาที่เริ่มเรียน (HH:mm)
  endTime: string;     // เวลาที่สิ้นสุด (HH:mm)
  minutesPerPeriod: number; // นาทีต่อคาบ
}

export interface PeriodConfig {
  id: number;        // ID ของคาบ
  time: string;      // เวลา (เช่น "08:30 - 09:30")
  minutesPerPeriod?: number; // นาทีต่อคาบ (ถ้าไม่กำหนดใช้จาก SchoolInfo)
}

export interface DayConfig {
  key: string;       // 'Monday', 'Tuesday', ...
  label: string;     // 'จันทร์', 'อังคาร', ...
  color: string;     // สีพื้นหลัง
  minutesPerPeriod?: number; // นาทีต่อคาบสำหรับวันนี้ (ถ้าไม่กำหนดใช้จาก SchoolInfo)
}

export interface ScheduleSheet {
  id: string;        // ID ของแผ่นตาราง
  name: string;      // ชื่อตาราง เช่น "ตารางเรียนเทอม 1"
  roomId?: string;   // ID ของห้องเรียนที่ตารางนี้เป็นของ (ถ้ามี)
  slots: ClassSlot[]; // รายวิชาในตารางนี้
  subjects: Subject[]; // รายการวิชา
  teachers: Teacher[]; // รายการอาจารย์
  rooms: Room[];     // รายการห้องเรียน (สำหรับห้องที่ไม่ได้เชื่อมกับตาราง)
  schoolInfo: SchoolInfo; // ข้อมูลโรงเรียน
  periodConfigs: PeriodConfig[]; // การตั้งค่าคาบ
  dayConfigs: DayConfig[]; // การตั้งค่าวัน
}