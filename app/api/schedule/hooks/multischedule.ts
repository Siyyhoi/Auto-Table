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
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  minutesPerPeriod: 60,
};

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
            return {
              ...sheet,
              subjects: [],
              teachers: [],
              rooms: [],
              schoolInfo: { ...DEFAULT_SCHOOL_INFO },
              periodConfigs: [...DEFAULT_PERIODS],
              dayConfigs: [...DEFAULT_DAYS],
            };
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
            periodConfigs: [...DEFAULT_PERIODS],
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
          periodConfigs: [...DEFAULT_PERIODS],
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
        periodConfigs: [...DEFAULT_PERIODS],
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
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
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

  // อัปเดตข้อมูลโรงเรียน
  const updateSchoolInfo = (schoolInfo: SchoolInfo) => {
    if (!activeSheetId) return;
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      return { ...sheet, schoolInfo };
    }));
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
    isLoaded 
  };
}