"use client";
import { useState, useEffect } from 'react';
import { ScheduleSheet, ClassSlot, Subject, Teacher, Room, SchoolInfo, PeriodConfig, DayConfig } from '../type/schedule';

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

export function useMultiSchedule() {
  const [sheets, setSheets] = useState<ScheduleSheet[]>([]);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load Data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate old data format to new format
        const migrated = parsed.map((sheet: any) => {
          if (!sheet.subjects) {
            const schoolInfo = sheet.schoolInfo || DEFAULT_SCHOOL_INFO;
            return {
              ...sheet,
              subjects: [],
              teachers: [],
              rooms: [],
              schoolInfo: { ...schoolInfo, startTime: schoolInfo.startTime || DEFAULT_SCHOOL_INFO.startTime, endTime: schoolInfo.endTime || DEFAULT_SCHOOL_INFO.endTime, minutesPerPeriod: schoolInfo.minutesPerPeriod || DEFAULT_SCHOOL_INFO.minutesPerPeriod },
              periodConfigs: sheet.periodConfigs || generatePeriodConfigsFromSchoolInfo(schoolInfo),
              dayConfigs: sheet.dayConfigs || [...DEFAULT_DAYS],
            };
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
          return sheet;
        });
        setSheets(migrated);
        if (migrated.length > 0) {
          setActiveSheetId(migrated[0].id);
        } else {
          // ถ้าไม่มีข้อมูลเลย ให้สร้างตารางแรกให้
          const newSheet: ScheduleSheet = {
            id: Date.now().toString(),
            name: "ตารางเรียนของฉัน",
            slots: [],
            subjects: [],
            teachers: [],
            rooms: [],
            schoolInfo: { ...DEFAULT_SCHOOL_INFO },
            periodConfigs: generatePeriodConfigsFromSchoolInfo(DEFAULT_SCHOOL_INFO),
            dayConfigs: [...DEFAULT_DAYS],
          };
          setSheets([newSheet]);
          setActiveSheetId(newSheet.id);
        }
      } catch (e) {
        console.error('Error parsing saved data:', e);
        const newSheet: ScheduleSheet = {
          id: Date.now().toString(),
          name: "ตารางเรียนของฉัน",
          slots: [],
          subjects: [],
          teachers: [],
          rooms: [],
          schoolInfo: { ...DEFAULT_SCHOOL_INFO },
          periodConfigs: generatePeriodConfigsFromSchoolInfo(DEFAULT_SCHOOL_INFO),
          dayConfigs: [...DEFAULT_DAYS],
        };
        setSheets([newSheet]);
        setActiveSheetId(newSheet.id);
      }
    } else {
      // ถ้าไม่มีข้อมูลเลย ให้สร้างตารางแรกให้
      const newSheet: ScheduleSheet = {
        id: Date.now().toString(),
        name: "ตารางเรียนของฉัน",
        slots: [],
        subjects: [],
        teachers: [],
        rooms: [],
        schoolInfo: { ...DEFAULT_SCHOOL_INFO },
        periodConfigs: generatePeriodConfigsFromSchoolInfo(DEFAULT_SCHOOL_INFO),
        dayConfigs: [...DEFAULT_DAYS],
      };
      setSheets([newSheet]);
      setActiveSheetId(newSheet.id);
    }
    setIsLoaded(true);
  }, []);

  // 2. Save Data
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
    }
  }, [sheets, isLoaded]);

  // สร้างตารางใหม่ (Sheet ใหม่)
  const createSheet = (name: string) => {
    const newSheet: ScheduleSheet = {
      id: Date.now().toString(),
      name: name,
      slots: [],
      subjects: [],
      teachers: [],
      rooms: [],
      schoolInfo: { ...DEFAULT_SCHOOL_INFO },
      periodConfigs: [...DEFAULT_PERIODS],
      dayConfigs: [...DEFAULT_DAYS],
    };
    setSheets(prev => [...prev, newSheet]);
    setActiveSheetId(newSheet.id);
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
        slots: sheet.slots.filter(s => s.teacherId !== teacherId)
      };
    }));
  };

  // จัดการห้องเรียน
  const addRoom = (room: Room) => {
    if (!activeSheetId) return;
    
    setSheets(prev => {
      // หาตารางหลัก (activeSheet) เพื่อ copy schoolInfo และ periodConfigs
      const mainSheet = prev.find(s => s.id === activeSheetId);
      
      // หาตารางอื่นที่มีข้อมูลโรงเรียนที่ตั้งค่าแล้ว (มี startTime และ endTime และ name ไม่ว่าง หรือมี startTime/endTime)
      // ให้ priority ห้องที่มี roomId ก่อน (ห้องเรียน) แล้วค่อยหาตารางหลัก
      const sheetWithSchoolInfo = prev.find(s => 
        s.schoolInfo?.startTime && 
        s.schoolInfo?.endTime && 
        s.schoolInfo.startTime !== '--:--' && 
        s.schoolInfo.endTime !== '--:--' &&
        s.schoolInfo.startTime !== '' &&
        s.schoolInfo.endTime !== ''
      ) || prev.find(s => 
        s.schoolInfo?.startTime && 
        s.schoolInfo?.endTime
      );
      
      // ใช้ข้อมูลจากตารางที่มีข้อมูลแล้ว หรือจากตารางหลัก หรือค่า default
      let sourceSchoolInfo: SchoolInfo;
      if (sheetWithSchoolInfo?.schoolInfo?.startTime && sheetWithSchoolInfo?.schoolInfo?.endTime) {
        // ใช้จากตารางที่มีข้อมูลแล้ว
        sourceSchoolInfo = { ...sheetWithSchoolInfo.schoolInfo };
      } else if (mainSheet?.schoolInfo?.startTime && mainSheet?.schoolInfo?.endTime) {
        // ใช้จากตารางหลัก
        sourceSchoolInfo = { ...mainSheet.schoolInfo };
      } else {
        // ใช้ค่า default
        sourceSchoolInfo = { ...DEFAULT_SCHOOL_INFO };
      }
      
      // Generate periodConfigs จาก schoolInfo
      let sourcePeriodConfigs: PeriodConfig[];
      if (sourceSchoolInfo.startTime && sourceSchoolInfo.endTime && sourceSchoolInfo.minutesPerPeriod) {
        sourcePeriodConfigs = generatePeriodConfigsFromSchoolInfo(sourceSchoolInfo);
      } else {
        // ใช้ periodConfigs จากตารางที่มีข้อมูลแล้ว หรือจากตารางหลัก
        sourcePeriodConfigs = sheetWithSchoolInfo?.periodConfigs || 
                              mainSheet?.periodConfigs || 
                              generatePeriodConfigsFromSchoolInfo(DEFAULT_SCHOOL_INFO);
      }
      
      // สร้างตารางเรียนใหม่สำหรับห้องนี้ (copy schoolInfo และ periodConfigs)
      const newSheet: ScheduleSheet = {
        id: Date.now().toString(),
        name: `ตารางเรียน - ${room.name}`,
        roomId: room.id,
        slots: [],
        subjects: [],
        teachers: [],
        rooms: [room], // เก็บห้องไว้ในตารางนี้ด้วย
        schoolInfo: { ...sourceSchoolInfo },
        periodConfigs: [...sourcePeriodConfigs],
        dayConfigs: [...DEFAULT_DAYS],
      };
      
      // เพิ่มห้องในตารางปัจจุบัน (สำหรับการจัดการทั่วไป)
      const updatedSheets = prev.map(sheet => {
        if (sheet.id !== activeSheetId) return sheet;
        return { ...sheet, rooms: [...sheet.rooms, room] };
      });
      // เพิ่มตารางเรียนใหม่สำหรับห้องนี้
      return [...updatedSheets, newSheet];
    });
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
    setSheets(prev => {
      // ลบห้องจากตารางปัจจุบัน
      const updatedSheets = prev.map(sheet => {
        if (sheet.id !== activeSheetId) return sheet;
        return { 
          ...sheet, 
          rooms: sheet.rooms.filter(r => r.id !== roomId),
          slots: sheet.slots.filter(s => s.roomId !== roomId)
        };
      });
      // ลบตารางเรียนที่เชื่อมกับห้องนี้
      const filteredSheets = updatedSheets.filter(sheet => sheet.roomId !== roomId);
      
      // ถ้าตารางที่กำลังเปิดอยู่ถูกลบ ให้เปลี่ยนไปตารางอื่น
      if (filteredSheets.length > 0 && !filteredSheets.find(s => s.id === activeSheetId)) {
        setActiveSheetId(filteredSheets[0].id);
      } else if (filteredSheets.length === 0) {
        setActiveSheetId(null);
      }
      
      return filteredSheets;
    });
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

  // ดึงตารางที่เชื่อมกับห้อง
  const getSheetByRoomId = (roomId: string): ScheduleSheet | undefined => {
    return sheets.find(s => s.roomId === roomId);
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
    addRoom,
    updateRoom,
    deleteRoom,
    updateSchoolInfo,
    updatePeriodConfig,
    updateDayConfig,
    getAllRooms,
    getSheetByRoomId,
    setPeriodConfigs,
    isLoaded 
  };
}