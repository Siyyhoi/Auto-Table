// app/api/schedule/actions.ts
'use server'

import { prisma } from '@/lib/prisma'
import { ScheduleSheet, SchoolInfo, PeriodConfig, DayConfig } from '../type/schedule'

// Type assertion ชั่วคราว - ต้องรัน npx prisma generate ก่อน
type PrismaWithSchedules = typeof prisma & {
  schedules: {
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any | null>;
    deleteMany: (args: any) => Promise<any>;
    createMany: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
  };
};

const prismaWithSchedules = prisma as unknown as PrismaWithSchedules;

// Type สำหรับเก็บ config แยก
export interface ScheduleConfig {
  schoolInfo: SchoolInfo;
  periodConfigs: PeriodConfig[];
  dayConfigs: DayConfig[];
}

// ฟังก์ชันดึงข้อมูลทั้งหมด (sheets + config)
export async function getUserSchedules(userId: number) {
  try {
    const schedules = await prismaWithSchedules.schedules.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    })

    if (!schedules || schedules.length === 0) return null;
    
    // แปลงจาก Schedules model เป็น ScheduleSheet[]
    const sheets: ScheduleSheet[] = schedules.map((s: any) => ({
      ...(s.data as ScheduleSheet),
      id: s.id,
      name: s.name
    }));
    
    return sheets;
  } catch (error) {
    console.error("Load error:", error)
    return null;
  }
}

// ฟังก์ชันดึง config เท่านั้น (เบากว่า)
export async function getUserScheduleConfig(userId: number): Promise<ScheduleConfig | null> {
  try {
    // หา schedule แรกเพื่อดึง config
    const firstSchedule = await prismaWithSchedules.schedules.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    })

    if (!firstSchedule) return null;
    
    const sheet = firstSchedule.data as unknown as ScheduleSheet;
    return {
      schoolInfo: sheet.schoolInfo,
      periodConfigs: sheet.periodConfigs,
      dayConfigs: sheet.dayConfigs
    };
  } catch (error) {
    console.error("Load config error:", error)
    return null;
  }
}

// ฟังก์ชันบันทึกข้อมูลทั้งหมด (Save all sheets)
export async function saveUserSchedules(userId: number, sheets: ScheduleSheet[]) {
  try {
    // ลบข้อมูลเก่าทั้งหมด
    await prismaWithSchedules.schedules.deleteMany({
      where: { userId }
    })

    // บันทึกข้อมูลใหม่ทั้งหมด
    await prismaWithSchedules.schedules.createMany({
      data: sheets.map(sheet => ({
        id: sheet.id,
        name: sheet.name,
        userId,
        data: sheet as any
      }))
    })

    return { success: true }
  } catch (error) {
    console.error("Save error:", error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ฟังก์ชันบันทึกเฉพาะ config (เบากว่า)
export async function saveUserScheduleConfig(userId: number, config: ScheduleConfig) {
  try {
    // ใช้ $queryRaw หรือ raw query ถ้า Prisma client ยังไม่ได้ generate
    // อัปเดต config ในทุก schedule ของ user นี้
    let schedules: any[];
    try {
      schedules = await prismaWithSchedules.schedules.findMany({
        where: { userId }
      });
    } catch (prismaError: any) {
      // ถ้า Prisma client ยังไม่ได้ generate ให้ใช้ raw query
      console.warn('Prisma client not ready, using raw query:', prismaError.message);
      const result = await (prisma as any).$queryRaw`
        SELECT * FROM "Schedules" WHERE "userId" = ${userId}
      `;
      schedules = result || [];
    }

    if (schedules.length === 0) {
      // ถ้ายังไม่มี schedule ให้สร้างใหม่
      const defaultSheet: ScheduleSheet = {
        id: Date.now().toString(),
        name: "ตารางเรียนของฉัน",
        slots: [],
        subjects: [],
        teachers: [],
        subTeachers: [],
        rooms: [],
        schoolInfo: config.schoolInfo,
        periodConfigs: config.periodConfigs,
        dayConfigs: config.dayConfigs,
      };
      
      try {
        if (typeof (prisma as any).schedules !== 'undefined') {
          await (prisma as any).schedules.create({
            data: {
              id: defaultSheet.id,
              name: defaultSheet.name,
              userId,
              data: defaultSheet as any
            }
          });
        } else {
          await (prisma as any).$executeRaw`
            INSERT INTO "Schedules" (id, name, "userId", data, "createdAt", "updatedAt")
            VALUES (${defaultSheet.id}, ${defaultSheet.name}, ${userId}, ${JSON.stringify(defaultSheet)}::jsonb, NOW(), NOW())
          `;
        }
      } catch (createError: any) {
        console.error('Create schedule failed:', createError);
        return { success: false, error: `Failed to create schedule: ${createError.message}` };
      }
    } else {
      // อัปเดต config ในทุก schedule
      try {
        if (typeof (prisma as any).schedules !== 'undefined') {
          await Promise.all(
            schedules.map((schedule: any) => {
              const sheet = schedule.data as ScheduleSheet;
              return (prisma as any).schedules.update({
                where: { id: schedule.id },
                data: {
                  data: {
                    ...sheet,
                    schoolInfo: config.schoolInfo,
                    periodConfigs: config.periodConfigs,
                    dayConfigs: config.dayConfigs,
                  } as any
                }
              })
            })
          );
        } else {
          // ใช้ raw query
          await Promise.all(
            schedules.map(async (schedule: any) => {
              const sheet = schedule.data as ScheduleSheet;
              const updatedData = {
                ...sheet,
                schoolInfo: config.schoolInfo,
                periodConfigs: config.periodConfigs,
                dayConfigs: config.dayConfigs,
              };
              await (prisma as any).$executeRaw`
                UPDATE "Schedules" 
                SET "data" = ${JSON.stringify(updatedData)}::jsonb, "updatedAt" = NOW()
                WHERE id = ${schedule.id}
              `;
            })
          );
        }
      } catch (updateError: any) {
        console.error('Update schedules failed:', updateError);
        return { success: false, error: `Failed to update schedules: ${updateError.message}` };
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Save config error:", error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}