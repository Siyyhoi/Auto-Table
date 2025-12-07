// compunets/schedule-add/school.tsx
import React, { useState, useEffect } from 'react';
import { SchoolInfo, PeriodConfig } from '@/app/api/schedule/type/schedule';

interface SchoolTabProps {
  activeSheet: {
    schoolInfo: SchoolInfo;
    periodConfigs: PeriodConfig[];
  };
  updateSchoolInfo: (info: SchoolInfo) => void;
  isEditingHeader: string | null;
  editingHeaderKey: number | null;
  updatePeriodConfig: (periodId: number, config: PeriodConfig) => void;
  onClose: () => void;
  PERIODS: {
    id: number;
    name: string;
    minutesPerPeriod?: number;
    onClose: () => void;
  }[];
}

export default function SchoolTab({
  activeSheet,
  updateSchoolInfo,
  isEditingHeader,
  editingHeaderKey,
  updatePeriodConfig,
  PERIODS,
  onClose
}: SchoolTabProps) {
  // ฟอร์ม local state - ตรวจสอบว่ามีข้อมูลหรือไม่ ถ้าไม่มีให้ใช้ค่า default
  const getInitialForm = (): SchoolInfo => {
    const sheetInfo = activeSheet.schoolInfo;
    // ถ้ามี startTime และ endTime ที่ไม่ว่าง ให้ใช้
    if (sheetInfo?.startTime && sheetInfo?.endTime && 
        sheetInfo.startTime !== '' && sheetInfo.endTime !== '' &&
        sheetInfo.startTime !== '--:--' && sheetInfo.endTime !== '--:--') {
      return { ...sheetInfo };
    }
    // ถ้าไม่มี ให้ใช้ค่า default
    return {
      name: sheetInfo?.name || '',
      startTime: '08:00',
      endTime: '16:00',
      minutesPerPeriod: sheetInfo?.minutesPerPeriod || 60,
    };
  };

  const [form, setForm] = useState<SchoolInfo>(getInitialForm());

  // Sync ถ้ามีการเปลี่ยนแปลง activeSheet
  useEffect(() => {
    const newForm = getInitialForm();
    setForm(newForm);
  }, [activeSheet.schoolInfo]);

  // กดบันทึก -> ส่ง props updater
  const handleSave = () => {
    updateSchoolInfo(form);
    onClose();
  };

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
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        {/* เวลาเริ่ม-เลิก */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-black">เวลาเริ่มคาบแรก</label>
            <input
              type="time"
              className="w-full border p-2 rounded text-black"
              value={form.startTime || ''}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-black">เวลาเลิกคาบสุดท้าย</label>
            <input
              type="time"
              className="w-full border p-2 rounded text-black"
              value={form.endTime || ''}
              onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
            />
          </div>
        </div>
        {/* นาทีต่อคาบ */}
        <div>
          <label className="block text-sm font-medium mb-1 text-black">นาทีต่อคาบ (นาที)</label>
          <input
            type="number"
            className="w-full border p-2 rounded text-black"
            min={1}
            value={form.minutesPerPeriod}
            onChange={e => setForm(f => ({ ...f, minutesPerPeriod: Number(e.target.value) || 60 }))}
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
                const oldConfig = activeSheet.periodConfigs.find((p: PeriodConfig) => p.id === editingHeaderKey);
                if (!oldConfig) return;
                updatePeriodConfig(editingHeaderKey, { ...oldConfig, minutesPerPeriod: e.target.value ? parseInt(e.target.value) : undefined });
              }}
              placeholder="ถ้าไม่ระบุจะใช้ค่าจากโรงเรียน"
            />
          </div>
        )}
      </div>
      {/* ปุ่มบันทึก */}
      <div className="flex justify-end mt-8">
        <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 shadow transition-all">
          บันทึก
        </button>
      </div>
    </div>
  );
}
