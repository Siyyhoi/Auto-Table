// ../app/api/schedule/hooks/multischedule.ts

"use client";
import { useState, useEffect, useRef } from 'react';
import { ScheduleSheet, ClassSlot, Subject, Teacher, Room, SchoolInfo, PeriodConfig, DayConfig, SubTeacher } from '../type/schedule';
import { getUserSchedules, saveUserSchedules, getUserScheduleConfig, saveUserScheduleConfig } from '../actions/actions';

const STORAGE_KEY = 'my_thai_schedules';

// Default values
const DEFAULT_PERIODS: PeriodConfig[] = [
  { id: 1, time: '08:30 - 09:30' },
  { id: 2, time: '09:30 - 10:30' },
  { id: 3, time: '10:30 - 11:30' },
  { id: 4, time: '11:30 - 12:30' },
  { id: 5, time: '12:30 - 13:30' },
  { id: 6, time: '13:30 - 14:30' },
  { id: 7, time: '14:30 - 15:30' },
  { id: 8, time: '15:30 - 16:30' },
];

const DEFAULT_DAYS: DayConfig[] = [
  { key: 'Monday', label: 'จันทร์', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  { key: 'Tuesday', label: 'อังคาร', color: 'bg-pink-100 border-pink-300 text-pink-800' },
  { key: 'Wednesday', label: 'พุธ', color: 'bg-green-100 border-green-300 text-green-800' },
  { key: 'Thursday', label: 'พฤหัส', color: 'bg-orange-100 border-orange-300 text-orange-800' },
  { key: 'Friday', label: 'ศุกร์', color: 'bg-blue-100 border-blue-300 text-blue-800' },
];

const DEFAULT_SCHOOL_INFO: SchoolInfo = {
  name: '',
  startTime: '08:00',
  endTime: '16:00',
  minutesPerPeriod: 60,
};

// ฟังก์ชันสำหรับ generate periodConfigs จาก schoolInfo
function generatePeriodConfigsFromSchoolInfo(schoolInfo: SchoolInfo): PeriodConfig[] {
  if (!schoolInfo.startTime || !schoolInfo.endTime || !schoolInfo.minutesPerPeriod) {
    return DEFAULT_PERIODS;
  }
  
  const configs = [];
  let id = 1;
  let [sh, sm] = schoolInfo.startTime.split(':').map(Number);
  let [eh, em] = schoolInfo.endTime.split(':').map(Number);
  let start = new Date(2000, 0, 1, sh, sm);
  let end = new Date(2000, 0, 1, eh, em);
  
  while (start < end) {
    const periodStart = new Date(start.getTime());
    start.setMinutes(start.getMinutes() + schoolInfo.minutesPerPeriod);
    if (start > end) break;
    configs.push({
      id,
      time: `${periodStart.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})} - ${start.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}`,
      minutesPerPeriod: schoolInfo.minutesPerPeriod
    });
    id++;
  }
  
  return configs.length > 0 ? configs : DEFAULT_PERIODS;
}

export function useMultiSchedule(userId: number | null) {
  const [sheets, setSheets] = useState<ScheduleSheet[]>([]);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // เพิ่ม State สำหรับสถานะการเซฟ
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved');

  // Helper สำหรับสร้างชีทแรก
  const initDefaultSheet = () => {
    const newSheet: ScheduleSheet = {
      id: Date.now().toString(),
      name: "ตารางเรียนของฉัน",
      slots: [],
      subjects: [],
      teachers: [],
      subTeachers: [],
      rooms: [],
      schoolInfo: { ...DEFAULT_SCHOOL_INFO },
      periodConfigs: generatePeriodConfigsFromSchoolInfo(DEFAULT_SCHOOL_INFO),
      dayConfigs: [...DEFAULT_DAYS],
    };
    setSheets([newSheet]);
    setActiveSheetId(newSheet.id);
  };

  // 1. Load Data (โหลดจาก localStorage เป็นหลัก, DB เป็น backup)
  useEffect(() => {
    async function loadData() {
      // โหลดจาก localStorage ก่อน (เป็นหลัก)
      const localSaved = localStorage.getItem(STORAGE_KEY);
      let loadedSheets: ScheduleSheet[] | null = null;

      if (localSaved) {
        try {
          loadedSheets = JSON.parse(localSaved);
        } catch (e) {
          console.error('Error parsing local storage:', e);
        }
      }

      // ถ้า localStorage ว่าง และมี userId ให้ลองโหลดจาก DB
      if (!loadedSheets && userId) {
        loadedSheets = await getUserSchedules(userId);
        
        // ถ้าโหลดจาก DB ได้ ให้บันทึกลง localStorage ด้วย
        if (loadedSheets) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedSheets));
        }
      }

      // ถ้ามี userId ให้โหลด config จาก DB เพื่อ sync
      if (userId && loadedSheets) {
        const dbConfig = await getUserScheduleConfig(userId);
        if (dbConfig) {
          // Merge config จาก DB เข้ากับ sheets
          loadedSheets = loadedSheets.map(sheet => ({
            ...sheet,
            schoolInfo: dbConfig.schoolInfo,
            periodConfigs: dbConfig.periodConfigs,
            dayConfigs: dbConfig.dayConfigs,
          }));
        }
      }

      if (loadedSheets) {
        // --- Migration Logic เดิมของคุณ ---
        try {
          const migrated = loadedSheets.map((sheet: any) => {
            if (!sheet.subjects) {
              const schoolInfo = sheet.schoolInfo || DEFAULT_SCHOOL_INFO;
              return {
                ...sheet,
                subjects: [],
                teachers: [],
                subTeachers: [],
                rooms: [],
                schoolInfo: { ...schoolInfo, startTime: schoolInfo.startTime || DEFAULT_SCHOOL_INFO.startTime, endTime: schoolInfo.endTime || DEFAULT_SCHOOL_INFO.endTime, minutesPerPeriod: schoolInfo.minutesPerPeriod || DEFAULT_SCHOOL_INFO.minutesPerPeriod },
                periodConfigs: sheet.periodConfigs || generatePeriodConfigsFromSchoolInfo(schoolInfo),
                dayConfigs: sheet.dayConfigs || [...DEFAULT_DAYS],
              };
            }
            
            // เพิ่ม subTeachers ถ้ายังไม่มี
            if (!sheet.subTeachers) {
              sheet.subTeachers = [];
            }
            
            // Migrate teachers: แปลง name เป็น first_name, last_name ถ้ายังไม่มี
            if (sheet.teachers && Array.isArray(sheet.teachers)) {
              sheet.teachers = sheet.teachers.map((teacher: any) => {
                // ถ้ามี name แต่ไม่มี first_name, last_name ให้แยก
                if (teacher.name && !teacher.first_name && !teacher.last_name) {
                  const nameParts = teacher.name.trim().split(/\s+/);
                  const title = nameParts[0].match(/^(ดร\.|ผศ\.|รศ\.|ศ\.|อ\.|อาจารย์)$/) ? nameParts[0] : undefined;
                  const startIdx = title ? 1 : 0;
                  const first_name = nameParts[startIdx] || '';
                  const last_name = nameParts.slice(startIdx + 1).join(' ') || '';
                  const full_name = [title, first_name, last_name].filter(Boolean).join(' ');
                  
                  return {
                    ...teacher,
                    title,
                    first_name,
                    last_name,
                    full_name: full_name || teacher.name,
                    max_hours_per_week: teacher.max_hours_per_week ?? undefined,
                    unavailable_times: teacher.unavailable_times || [],
                    weekend_available: teacher.weekend_available ?? undefined,
                    availableRooms: teacher.availableRooms || [],
                  };
                }
                // ถ้ามี first_name, last_name แล้ว
                return {
                  ...teacher,
                  full_name: teacher.full_name || [teacher.title, teacher.first_name, teacher.last_name].filter(Boolean).join(' '),
                  max_hours_per_week: teacher.max_hours_per_week ?? undefined,
                  unavailable_times: teacher.unavailable_times || [],
                  weekend_available: teacher.weekend_available ?? undefined,
                  availableRooms: teacher.availableRooms || [],
                };
              });
            }
            // ถ้ามี schoolInfo แต่ไม่มี periodConfigs หรือ periodConfigs ไม่ตรงกับ schoolInfo ให้ generate ใหม่
            if (sheet.schoolInfo && sheet.schoolInfo.startTime && sheet.schoolInfo.endTime) {
              const generated = generatePeriodConfigsFromSchoolInfo(sheet.schoolInfo);
              if (generated.length > 0 && (!sheet.periodConfigs || sheet.periodConfigs.length !== generated.length)) {
                return {
                  ...sheet,
                  periodConfigs: generated
                };
              }
            }
            
            // Migrate subjects: เพิ่มฟิลด์ใหม่ถ้ายังไม่มี
            if (sheet.subjects && Array.isArray(sheet.subjects)) {
              sheet.subjects = sheet.subjects.map((subject: any) => ({
                ...subject,
                name_en: subject.name_en || subject.name || '', // ถ้าไม่มี name_en ให้ใช้ name
                lecture_hours: subject.lecture_hours ?? undefined,
                lab_hours: subject.lab_hours ?? undefined,
                total_hours: subject.total_hours ?? undefined,
                labRoomId: subject.labRoomId || undefined,
              }));
            }
            
            // Migrate rooms: เพิ่ม room_type ถ้ายังไม่มี
            if (sheet.rooms && Array.isArray(sheet.rooms)) {
              sheet.rooms = sheet.rooms.map((room: any) => ({
                ...room,
                room_type: room.room_type || 'ห้องเรียน', // default เป็น 'ห้องเรียน'
                capacity: room.capacity ?? undefined,
              }));
            }
            
            // Migrate: ลบ roomId และเพิ่ม grade ถ้ามี roomId เก่า
            if (sheet.roomId && !sheet.grade) {
              // ถ้ามี roomId เก่า ให้ลบออก (ไม่ต้องแปลงเป็น grade)
              delete sheet.roomId;
            }
            // ตรวจสอบว่าไม่มี roomId แล้ว
            if (sheet.roomId) {
              delete sheet.roomId;
            }
            
            return sheet;
          });
          
          setSheets(migrated);
          if (migrated.length > 0) {
            setActiveSheetId(migrated[0].id);
          } else {
            initDefaultSheet();
          }
        } catch (e) {
          console.error('Error parsing:', e);
          initDefaultSheet();
        }
      } else {
        initDefaultSheet();
      }
      setIsLoaded(true);
    }
    loadData();
  }, [userId]); // รันใหม่เมื่อ userId เปลี่ยน

  // 2. Save to localStorage (ทันที - เป็นหลัก)
  useEffect(() => {
    if (!isLoaded) return;
    
    // บันทึกลง localStorage ทันที (เพื่อไม่ให้ฐานข้อมูลเต็ม)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
  }, [sheets, isLoaded]);

  // 3. Auto-Save to DB Logic (Debounce + Periodic)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastConfigRef = useRef<{ schoolInfo: SchoolInfo; periodConfigs: PeriodConfig[]; dayConfigs: DayConfig[] } | null>(null);

  useEffect(() => {
    // อย่าเพิ่งเซฟถ้ายังโหลดไม่เสร็จ หรือ ไม่มี User
    if (!isLoaded || !userId) {
      if (!isLoaded) console.log('Auto-save: Waiting for data to load...');
      if (!userId) console.log('Auto-save: No userId provided, skipping save');
      return;
    }

    console.log('Auto-save: Sheets changed, setting status to unsaved');
    setSaveStatus('unsaved'); // ทันทีที่ sheets เปลี่ยน สถานะคือยังไม่เซฟ

    // ตรวจสอบว่า config เปลี่ยนหรือไม่
    const activeSheet = sheets.find(s => s.id === activeSheetId);
    const currentConfig = activeSheet ? {
      schoolInfo: activeSheet.schoolInfo,
      periodConfigs: activeSheet.periodConfigs,
      dayConfigs: activeSheet.dayConfigs,
    } : null;

    const configChanged = !lastConfigRef.current || 
      JSON.stringify(lastConfigRef.current) !== JSON.stringify(currentConfig);

    // เคลียร์ timer เก่า (ถ้ามีการพิมพ์ต่อเนื่อง)
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Debounce: ตั้ง timer ใหม่ (หน่วงเวลา 3 วินาที)
    timeoutRef.current = setTimeout(async () => {
      console.log('Auto-save: Starting save to DB...', { userId, sheetsCount: sheets.length });
      setSaveStatus('saving');
      
      try {
        // ถ้า config เปลี่ยน ให้เซฟ config ก่อน (เบากว่า)
        if (configChanged && currentConfig) {
          console.log('Auto-save: Saving config...');
          const configResult = await saveUserScheduleConfig(userId, currentConfig);
          if (configResult.success) {
            lastConfigRef.current = currentConfig;
            console.log('✅ Config saved to DB');
          } else {
            console.error('❌ Config save failed:', configResult.error);
          }
        }

        // เซฟข้อมูลทั้งหมดลง DB (หน่วงเวลานานกว่า)
        console.log('Auto-save: Saving all sheets to DB...', { sheetsCount: sheets.length });
        const result = await saveUserSchedules(userId, sheets);
        
        if (result.success) {
          setSaveStatus('saved');
          console.log('✅ Auto-saved to DB successfully', { sheetsCount: sheets.length });
        } else {
          setSaveStatus('error');
          console.error('❌ Save error:', result.error);
        }
      } catch (error) {
        setSaveStatus('error');
        console.error('❌ Save error:', error);
      }
    }, 3000); // 3000ms = 3 วินาที

    // Cleanup function
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [sheets, isLoaded, userId, activeSheetId]); // รันทุกครั้งที่ sheets เปลี่ยน

  // Periodic Save: เซฟทุก 30 วินาที (เผื่อ debounce ไม่ทำงาน)
  useEffect(() => {
    if (!isLoaded || !userId) return;

    intervalRef.current = setInterval(async () => {
      if (saveStatus === 'unsaved' && sheets.length > 0) {
        setSaveStatus('saving');
        
        try {
          const activeSheet = sheets.find(s => s.id === activeSheetId);
          const currentConfig = activeSheet ? {
            schoolInfo: activeSheet.schoolInfo,
            periodConfigs: activeSheet.periodConfigs,
            dayConfigs: activeSheet.dayConfigs,
          } : null;

          // เซฟ config ถ้ามี
          if (currentConfig) {
            await saveUserScheduleConfig(userId, currentConfig);
          }

          // เซฟข้อมูลทั้งหมด
          const result = await saveUserSchedules(userId, sheets);
          if (result.success) {
            setSaveStatus('saved');
            console.log('Periodic save to DB');
          }
        } catch (error) {
          console.error('Periodic save error:', error);
        }
      }
    }, 30000); // 30 วินาที

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLoaded, userId, saveStatus, sheets, activeSheetId]);

  // สร้างตารางใหม่ (Sheet ใหม่) - แยกจากห้องเรียน
  const createSheet = (name: string, grade?: string) => {
    const newSheet: ScheduleSheet = {
      id: Date.now().toString(),
      name: name,
      grade: grade || undefined,
      slots: [],
      subjects: [],
      teachers: [],
      subTeachers: [],
      rooms: [],
      schoolInfo: { ...DEFAULT_SCHOOL_INFO },
      periodConfigs: [...DEFAULT_PERIODS],
      dayConfigs: [...DEFAULT_DAYS],
    };
    console.log('createSheet called:', { name, grade, newSheetId: newSheet.id });
    setSheets(prev => {
      const updated = [...prev, newSheet];
      console.log('Sheets updated, count:', updated.length);
      return updated;
    });
    setActiveSheetId(newSheet.id);
    console.log('Active sheet ID set to:', newSheet.id);
  };

  // ลบตาราง (Sheet)
  const deleteSheet = (id: string) => {
    const newSheets = sheets.filter(s => s.id !== id);
    setSheets(newSheets);
    if (activeSheetId === id && newSheets.length > 0) {
      setActiveSheetId(newSheets[0].id);
    } else if (newSheets.length === 0) {
      setActiveSheetId(null);
    }
  };

  // เพิ่ม/แก้ไข วิชาในตารางปัจจุบัน
  const updateSlot = (slot: ClassSlot) => {
    if (!activeSheetId) return;
    
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;

      // ลบอันเก่าออกก่อน (ถ้าทับตำแหน่งเดิม) แล้วใส่ใหม่
      const otherSlots = sheet.slots.filter(s => !(s.day === slot.day && s.period === slot.period));
      return { ...sheet, slots: [...otherSlots, slot] };
    }));
  };

  // ลบวิชาออกจากช่อง
  const removeSlot = (day: string, period: number) => {
    if (!activeSheetId) return;
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      return { ...sheet, slots: sheet.slots.filter(s => !(s.day === day && s.period === period)) };
    }));
  };

  // จัดการวิชา
  const addSubject = (subject: Subject) => {
    if (!activeSheetId) return;
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      return { ...sheet, subjects: [...sheet.subjects, subject] };
    }));
  };

  const updateSubject = (subject: Subject) => {
    if (!activeSheetId) return;
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      return { ...sheet, subjects: sheet.subjects.map(s => s.id === subject.id ? subject : s) };
    }));
  };

  const deleteSubject = (subjectId: string) => {
    if (!activeSheetId) return;
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      return { 
        ...sheet, 
        subjects: sheet.subjects.filter(s => s.id !== subjectId),
        slots: sheet.slots.filter(s => s.subjectCode !== sheet.subjects.find(sub => sub.id === subjectId)?.code)
      };
    }));
  };

  // จัดการอาจารย์
  const addTeacher = (teacher: Teacher) => {
    if (!activeSheetId) return;
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      return { ...sheet, teachers: [...sheet.teachers, teacher] };
    }));
  };

  const updateTeacher = (teacher: Teacher) => {
    if (!activeSheetId) return;
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      return { ...sheet, teachers: sheet.teachers.map(t => t.id === teacher.id ? teacher : t) };
    }));
  };

  const deleteTeacher = (teacherId: string) => {
    if (!activeSheetId) return;
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      return { 
        ...sheet, 
        teachers: sheet.teachers.filter(t => t.id !== teacherId),
        subTeachers: sheet.subTeachers.filter(st => st.teacher_id !== teacherId),
        slots: sheet.slots.filter(s => s.teacherId !== teacherId)
      };
    }));
  };

  // จัดการ SubTeacher (ความสัมพันธ์ระหว่างอาจารย์และวิชา)
  const addSubTeacher = (subTeacher: SubTeacher) => {
    if (!activeSheetId) return;
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      // ตรวจสอบว่ามีอยู่แล้วหรือไม่
      const exists = sheet.subTeachers.find(st => 
        st.teacher_id === subTeacher.teacher_id && st.subject_id === subTeacher.subject_id
      );
      if (exists) return sheet;
      return { ...sheet, subTeachers: [...sheet.subTeachers, subTeacher] };
    }));
  };

  const updateSubTeacher = (subTeacher: SubTeacher) => {
    if (!activeSheetId) return;
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      return { 
        ...sheet, 
        subTeachers: sheet.subTeachers.map(st => st.id === subTeacher.id ? subTeacher : st)
      };
    }));
  };

  const deleteSubTeacher = (subTeacherId: string) => {
    if (!activeSheetId) return;
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      return { 
        ...sheet, 
        subTeachers: sheet.subTeachers.filter(st => st.id !== subTeacherId)
      };
    }));
  };

  // ฟังก์ชัน helper: สร้าง SubTeacher จาก teacher และ subject
  const createSubTeacher = (teacherId: string, subjectId: string): SubTeacher | null => {
    const activeSheet = sheets.find(s => s.id === activeSheetId);
    if (!activeSheet) return null;

    const teacher = activeSheet.teachers.find(t => t.id === teacherId);
    const subject = activeSheet.subjects.find(s => s.id === subjectId);

    if (!teacher || !subject) return null;

    return {
      id: `subteacher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      teacher_id: teacherId,
      teacher_name: teacher.full_name || `${teacher.first_name} ${teacher.last_name}`,
      subject_id: subjectId,
      subject_name: subject.name
    };
  };

  // จัดการห้องเรียน - เพิ่มแค่ Room ไปใน rooms array (ไม่สร้างตารางอัตโนมัติ)
  const addRoom = (room: Room) => {
    if (!activeSheetId) return;
    
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      // ตรวจสอบว่ามีห้องนี้อยู่แล้วหรือไม่
      const roomExists = sheet.rooms.find(r => r.id === room.id);
      if (roomExists) return sheet;
      return { ...sheet, rooms: [...sheet.rooms, room] };
    }));
  };


  const updateRoom = (room: Room) => {
    if (!activeSheetId) return;
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      return { ...sheet, rooms: sheet.rooms.map(r => r.id === room.id ? room : r) };
    }));
  };

  const deleteRoom = (roomId: string) => {
    if (!activeSheetId) return;
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      return { 
        ...sheet, 
        rooms: sheet.rooms.filter(r => r.id !== roomId),
        slots: sheet.slots.filter(s => s.roomId !== roomId)
      };
    }));
  };

  // อัปเดตข้อมูลโรงเรียน - อัปเดตทุกตารางให้เหมือนกันทั้งหมด
  const updateSchoolInfo = (schoolInfo: SchoolInfo) => {
    if (!activeSheetId) return;
    setSheets(prev => {
      // อัปเดตทุกตารางให้มี schoolInfo เหมือนกันทั้งหมด
      return prev.map(sheet => ({
        ...sheet,
        schoolInfo: { ...schoolInfo }
      }));
    });
  };

  // อัปเดตการตั้งค่าคาบ
  const updatePeriodConfig = (periodId: number, config: Partial<PeriodConfig>) => {
    if (!activeSheetId) return;
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      return {
        ...sheet,
        periodConfigs: sheet.periodConfigs.map(p => p.id === periodId ? { ...p, ...config } : p)
      };
    }));
  };

  // อัปเดตการตั้งค่าวัน
  const updateDayConfig = (dayKey: string, config: Partial<DayConfig>) => {
    if (!activeSheetId) return;
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      return {
        ...sheet,
        dayConfigs: sheet.dayConfigs.map(d => d.key === dayKey ? { ...d, ...config } : d)
      };
    }));
  };

  const activeSheet = sheets.find(s => s.id === activeSheetId);

  // ดึงรายการห้องทั้งหมดจากทุกตาราง
  const getAllRooms = (): Room[] => {
    const roomMap = new Map<string, Room>();
    sheets.forEach(sheet => {
      sheet.rooms.forEach(room => {
        if (!roomMap.has(room.id)) {
          roomMap.set(room.id, room);
        }
      });
    });
    return Array.from(roomMap.values());
  };

  const setPeriodConfigs = (periodConfigs: PeriodConfig[]) => {
    if (!activeSheetId) return;
    
    // เก็บ period IDs ที่ยังใช้ได้ (period ที่อยู่ในช่วงเวลาใหม่)
    const validPeriodIds = new Set(periodConfigs.map(p => p.id));
    
    setSheets(prev => {
      // อัปเดตทุกตารางให้มี periodConfigs เหมือนกันทั้งหมด และลบ slots ที่อยู่นอกช่วงเวลา
      return prev.map(sheet => {
        const validSlots = sheet.slots.filter(slot => validPeriodIds.has(slot.period));
        return {
          ...sheet,
          periodConfigs: [...periodConfigs],
          slots: validSlots
        };
      });
    });
  };


  return { 
    sheets, 
    activeSheet, 
    activeSheetId, 
    setActiveSheetId, 
    createSheet, 
    deleteSheet, 
    updateSlot, 
    removeSlot,
    addSubject,
    updateSubject,
    deleteSubject,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addSubTeacher,
    updateSubTeacher,
    deleteSubTeacher,
    createSubTeacher,
    addRoom,
    updateRoom,
    deleteRoom,
    updateSchoolInfo,
    updatePeriodConfig,
    updateDayConfig,
    getAllRooms,
    setPeriodConfigs,
    isLoaded,
    saveStatus
  };
}