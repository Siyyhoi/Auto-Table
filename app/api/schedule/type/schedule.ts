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
  name: string;      // ชื่อวิชา (subject_name_th)
  name_en: string;   // ชื่อวิชาในภาษาอังกฤษ (subject_name_en)
  lecture_hours?: number;  // จำนวนชั่วโมงบรรยาย
  lab_hours?: number;     // จำนวนชั่วโมงปฏิบัติการ
  total_hours?: number;   // จำนวนชั่วโมงรวม
  color?: string;    // สีพื้นหลัง
  teacherId?: string;  // ID ของอาจารย์
  roomId?: string;   // ID ของห้องบรรยาย (Lecture Room)
  labRoomId?: string; // ID ของห้องปฏิบัติการ (Computer Lab, Network Lab, Business Lab, Multimedia Lab, Data/AI Lab)
}

export interface Teacher {
  id: string;        // ID ของอาจารย์ (teacher_id)
  title?: string;   // คำนำหน้า (เช่น ดร., ผศ., อ.)
  first_name: string; // ชื่อ
  last_name: string; // นามสกุล
  full_name?: string; // ชื่อเต็ม (คำนวณจาก title + first_name + last_name)
  max_hours_per_week?: number; // ชั่วโมงสูงสุดต่อสัปดาห์
  unavailable_times?: UnavailableTime[]; // เวลาที่ไม่ว่าง
  weekend_available?: boolean; // สอนวันหยุดได้หรือไม่
  availableRooms: string[]; // รายการ ID ห้องที่สอนได้
}

export interface UnavailableTime {
  day: string;      // วัน (Monday, Tuesday, ...)
  period: number;    // คาบ (1-10)
  reason?: string;   // เหตุผล (optional)
}

export interface SubTeacher {
  id: string;        // ID ของความสัมพันธ์
  teacher_id: string; // ID ของอาจารย์
  teacher_name: string; // ชื่ออาจารย์
  subject_id: string; // ID ของวิชา
  subject_name: string; // ชื่อวิชา
}

export interface Room {
  id: string;        // ID ของห้อง
  name: string;      // ชื่อห้อง (เช่น "404", "Lab 1")
  room_type: string; // ประเภทห้อง (เช่น "ห้องเรียน", "ห้องปฏิบัติการ")
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
  grade?: string;    // ชั้นเรียน เช่น "ม.1", "ม.2/1", "ป.4" (แยกจากห้องเรียน)
  slots: ClassSlot[]; // รายวิชาในตารางนี้
  subjects: Subject[]; // รายการวิชา
  teachers: Teacher[]; // รายการอาจารย์
  subTeachers: SubTeacher[]; // ความสัมพันธ์ระหว่างอาจารย์และวิชา
  rooms: Room[];     // รายการห้องเรียน (สำหรับการจัดการทั่วไป แยกจากตาราง)
  schoolInfo: SchoolInfo; // ข้อมูลโรงเรียน
  periodConfigs: PeriodConfig[]; // การตั้งค่าคาบ
  dayConfigs: DayConfig[]; // การตั้งค่าวัน
}