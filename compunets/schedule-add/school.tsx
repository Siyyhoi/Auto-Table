// compunets/schedule-add/school.tsx
import React from 'react';
import { SchoolInfo, PeriodConfig } from '@/app/api/schedule/type/schedule';

interface SchoolTabProps {
  activeSheet: {
    // สมมติ activeSheet เป็น ScheduleSheet หรืออย่างน้อยมีส่วนที่ต้องการ
    schoolInfo: SchoolInfo;
    periodConfigs: PeriodConfig[];
  };

  updateSchoolInfo: (info: SchoolInfo) => void;

  isEditingHeader: string | null;
  editingHeaderKey: number | null;
  updatePeriodConfig: (periodId: number, config: PeriodConfig) => void;

  PERIODS: {
    id: number;
    name: string;
    minutesPerPeriod?: number;
  }[];
}

export default function SchoolTab({
  activeSheet,
  updateSchoolInfo,
  isEditingHeader,
  editingHeaderKey,
  updatePeriodConfig,
  PERIODS
}: SchoolTabProps) {
  return (
    <div>
      <h4 className="font-bold text-lg mb-4 text-black">ข้อมูลโรงเรียน</h4>

      <div className="space-y-4">
        {/* ชื่อโรงเรียน */}
        <div>
          <label className="block text-sm font-medium mb-1 text-black">ชื่อโรงเรียน</label>
          <input
            type="text"
            className="w-full border p-2 rounded text-black"
            value={activeSheet.schoolInfo.name}
            onChange={e =>
              updateSchoolInfo({ ...activeSheet.schoolInfo, name: e.target.value })
            }
          />
        </div>

        {/* วันที่เปิดเทอม */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-black">วันที่เริ่มเรียน</label>
            <input
              type="date"
              className="w-full border p-2 rounded text-black"
              value={activeSheet.schoolInfo.startDate}
              onChange={e =>
                updateSchoolInfo({ ...activeSheet.schoolInfo, startDate: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-black">วันที่สิ้นสุด</label>
            <input
              type="date"
              className="w-full border p-2 rounded text-black"
              value={activeSheet.schoolInfo.endDate}
              onChange={e =>
                updateSchoolInfo({ ...activeSheet.schoolInfo, endDate: e.target.value })
              }
            />
          </div>
        </div>

        {/* นาทีต่อคาบ */}
        <div>
          <label className="block text-sm font-medium mb-1 text-black">นาทีต่อคาบ (นาที)</label>
          <input
            type="number"
            className="w-full border p-2 rounded text-black"
            value={activeSheet.schoolInfo.minutesPerPeriod}
            onChange={e =>
              updateSchoolInfo({
                ...activeSheet.schoolInfo,
                minutesPerPeriod: parseInt(e.target.value) || 60
              })
            }
          />
        </div>

        {/* นาทีต่อคาบของคาบเฉพาะ */}
        {isEditingHeader === 'period' && editingHeaderKey !== null && (
          <div>
            <label className="block text-sm font-medium mb-1 text-black">
              นาทีต่อคาบสำหรับคาบนี้ (ไม่บังคับ)
            </label>

            <input
              type="number"
              className="w-full border p-2 rounded text-black"
              value={
                activeSheet.periodConfigs.find((p: PeriodConfig) => p.id === editingHeaderKey)
                  ?.minutesPerPeriod ?? ''
              }
              onChange={e => {
                const oldConfig = activeSheet.periodConfigs.find(
                  (p: PeriodConfig) => p.id === editingHeaderKey
                );

                if (!oldConfig) return;

                updatePeriodConfig(editingHeaderKey, {
                  ...oldConfig,
                  minutesPerPeriod: e.target.value ? parseInt(e.target.value) : undefined
                });
              }}
              placeholder="ถ้าไม่ระบุจะใช้ค่าจากโรงเรียน"
            />
          </div>
        )}
      </div>
    </div>
  );
}
