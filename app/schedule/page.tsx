"use client";

import React, { useState, useEffect } from 'react';
import { useMultiSchedule } from '../api/schedule/hooks/multischedule.ts';
import { ClassSlot, Subject, Teacher, Room } from '../api/schedule/type/schedule';

export default function SchedulePage() {
  const { 
    sheets, activeSheet, activeSheetId, setActiveSheetId, 
    createSheet, deleteSheet, updateSlot, removeSlot, isLoaded,
    addSubject, updateSubject, deleteSubject,
    addTeacher, updateTeacher, deleteTeacher,
    addRoom, updateRoom, deleteRoom,
    updateSchoolInfo, updatePeriodConfig, updateDayConfig
  } = useMultiSchedule();

  const [isEditing, setIsEditing] = useState<{day: string, period: number} | null>(null);
  const [isEditingHeader, setIsEditingHeader] = useState<'day' | 'period' | null>(null);
  const [editingHeaderKey, setEditingHeaderKey] = useState<string | number | null>(null);
  const [tempData, setTempData] = useState({ 
    code: '', name: '', teacherId: '', roomId: '' 
  });
  const [activeTab, setActiveTab] = useState<'subject' | 'teacher' | 'school' | 'room'>('subject');

  if (!isLoaded || !activeSheet) return (
    <div className="p-10 text-center ml-20">
      กำลังโหลดข้อมูล...
    </div>
  );

  const DAYS = activeSheet.dayConfigs || [];
  const PERIODS = activeSheet.periodConfigs || [];

  // ฟังก์ชันเปิด Modal แก้ไขช่องตาราง
  const openEdit = (day: string, period: number) => {
    const existing = activeSheet.slots.find(s => s.day === day && s.period === period);
    if (existing) {
      const subject = activeSheet.subjects.find(s => s.code === existing.subjectCode);
      setTempData({ 
        code: existing.subjectCode, 
        name: existing.subjectName, 
        teacherId: existing.teacherId || '',
        roomId: existing.roomId || ''
      });
    } else {
      setTempData({ code: '', name: '', teacherId: '', roomId: '' });
    }
    setIsEditing({ day, period });
  };

  // ฟังก์ชันเปิด Modal แก้ไขหัวข้อ (วัน/เวลา)
  const openHeaderEdit = (type: 'day' | 'period', key: string | number) => {
    setIsEditingHeader(type);
    setEditingHeaderKey(key);
    setActiveTab('subject');
  };

  // บันทึกข้อมูลช่องตาราง
  const handleSave = () => {
    if (!isEditing) return;
    if (!tempData.name && !tempData.code) {
      removeSlot(isEditing.day, isEditing.period);
    } else {
      const subject = activeSheet.subjects.find(s => s.code === tempData.code);
      const newSlot: ClassSlot = {
        id: `${isEditing.day}-${isEditing.period}`,
        day: isEditing.day,
        period: isEditing.period,
        subjectCode: tempData.code,
        subjectName: tempData.name,
        teacherId: tempData.teacherId || undefined,
        roomId: tempData.roomId || undefined,
        color: subject?.color || 'bg-blue-500'
      };
      updateSlot(newSlot);
    }
    setIsEditing(null);
  };

  // จัดการวิชา
  const handleAddSubject = () => {
    const code = prompt("รหัสวิชา:");
    const name = prompt("ชื่อวิชา:");
    if (code && name) {
      const newSubject: Subject = {
        id: `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        code,
        name,
        color: `bg-${['blue', 'green', 'purple', 'pink', 'yellow', 'orange'][Math.floor(Math.random() * 6)]}-500`
      };
      addSubject(newSubject);
    }
  };

  // จัดการอาจารย์
  const handleAddTeacher = () => {
    const name = prompt("ชื่ออาจารย์:");
    if (name) {
      const newTeacher: Teacher = {
        id: `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        availableRooms: []
      };
      addTeacher(newTeacher);
    }
  };

  // จัดการห้องเรียน
  const handleAddRoom = () => {
    const name = prompt("ชื่อห้องเรียน:");
    if (name) {
      const capacity = prompt("ความจุ (ไม่บังคับ):");
      const newRoom: Room = {
        id: `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        capacity: capacity ? parseInt(capacity) : undefined
      };
      addRoom(newRoom);
    }
  };

  // อัปเดตห้องที่อาจารย์สอนได้
  const handleTeacherRoomToggle = (teacherId: string, roomId: string) => {
    const teacher = activeSheet.teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    
    const newAvailableRooms = teacher.availableRooms.includes(roomId)
      ? teacher.availableRooms.filter(r => r !== roomId)
      : [...teacher.availableRooms, roomId];
    
    updateTeacher({ ...teacher, availableRooms: newAvailableRooms });
  };

  // ฟังก์ชันเปิด Modal จาก Navbar
  const openNavbarModal = (tab: 'subject' | 'teacher' | 'school' | 'room') => {
    setIsEditingHeader('day'); // ใช้ type ใดก็ได้เพื่อเปิด modal
    setEditingHeaderKey('navbar'); // ใช้ key พิเศษ
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans ml-20">
      
      {/* Navbar ด้านบน */}
      <div className="bg-white shadow-md rounded-lg mb-6 p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold text-black">📅 ตารางเรียน</h1>
          
          {/* Navbar Menu */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openNavbarModal('subject')}
              className="px-4 py-2 rounded-lg text-sm bg-blue-100 text-black hover:bg-blue-200 border border-blue-300 transition-all font-medium"
            >
              📚 วิชา
            </button>
            <button
              onClick={() => openNavbarModal('teacher')}
              className="px-4 py-2 rounded-lg text-sm bg-purple-100 text-black hover:bg-purple-200 border border-purple-300 transition-all font-medium"
            >
              👨‍🏫 อาจารย์
            </button>
            <button
              onClick={() => openNavbarModal('school')}
              className="px-4 py-2 rounded-lg text-sm bg-orange-100 text-black hover:bg-orange-200 border border-orange-300 transition-all font-medium"
            >
              🏫 โรงเรียน
            </button>
            <button
              onClick={() => openNavbarModal('room')}
              className="px-4 py-2 rounded-lg text-sm bg-green-100 text-black hover:bg-green-200 border border-green-300 transition-all font-medium"
            >
              🚪 ห้องเรียน
            </button>
          </div>
        </div>
      </div>

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-wrap gap-2">
          {sheets.map(sheet => (
            <button
              key={sheet.id}
              onClick={() => setActiveSheetId(sheet.id)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                activeSheetId === sheet.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-black hover:bg-gray-100 border'
              }`}
            >
              {sheet.name}
            </button>
          ))}
          <button 
            onClick={() => {
              const name = prompt("ตั้งชื่อตารางใหม่ (เช่น ปี 1 เทอม 2):");
              if (name) createSheet(name);
            }}
            className="px-3 py-2 rounded-lg text-sm bg-green-100 text-black hover:bg-green-200 border border-green-300"
          >
            + เพิ่มตาราง
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white p-4 rounded-xl shadow-lg overflow-x-auto">
        <div className="min-w-[800px]">
          
          {/* Header Row (คาบ) */}
          <div className="grid grid-cols-[100px_repeat(8,1fr)] gap-1 mb-2">
            <div className="bg-gray-200 p-2 rounded-lg text-center font-bold text-black flex items-center justify-center">
              วัน / เวลา
            </div>
            {PERIODS.map(p => (
              <div 
                key={p.id} 
                onClick={() => openHeaderEdit('period', p.id)}
                className="bg-blue-50 p-2 rounded-lg text-center border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <div className="font-bold text-black">คาบ {p.id}</div>
                <div className="text-xs text-black">{p.time}</div>
              </div>
            ))}
          </div>

          {/* Rows (วัน) */}
          {DAYS.map((day) => (
            <div key={day.key} className="grid grid-cols-[100px_repeat(8,1fr)] gap-1 mb-1">
              {/* ชื่อวัน (ซ้ายสุด) */}
              <div 
                className={`${day.color} p-2 rounded-lg flex items-center justify-center font-bold shadow-sm`}
              >
                <span className="text-black">{day.label}</span>
              </div>

              {/* ช่องคาบเรียน */}
              {PERIODS.map((period) => {
                const slotData = activeSheet.slots.find(s => s.day === day.key && s.period === period.id);
                const subject = slotData ? activeSheet.subjects.find(s => s.code === slotData.subjectCode) : null;
                const teacher = slotData?.teacherId ? activeSheet.teachers.find(t => t.id === slotData.teacherId) : null;
                const room = slotData?.roomId ? activeSheet.rooms.find(r => r.id === slotData.roomId) : null;
                
                return (
                  <div 
                    key={period.id}
                    className={`
                      relative min-h-[80px] rounded-lg border cursor-pointer transition-all hover:shadow-md
                      flex flex-col items-center justify-center text-center p-1
                      ${slotData ? 'bg-white border-blue-400' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}
                    `}
                  >
                    {slotData ? (
                      <>
                        <div className="font-bold text-sm text-black wrap-break-word w-full">{slotData.subjectCode}</div>
                        <div className="text-xs text-black line-clamp-2">{slotData.subjectName}</div>
                        {teacher && <div className="text-[10px] text-black mt-1">{teacher.name}</div>}
                        {room && <div className="text-[10px] bg-gray-200 px-1 rounded mt-1">{room.name}</div>}
                      </>
                    ) : (
                      <span className="text-black text-2xl opacity-0 hover:opacity-100">+</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

        </div>
      </div>

      {activeSheet && (
         <div className="mt-4 text-right">
           <button 
             onClick={() => {
                if(confirm('คุณแน่ใจหรือไม่ว่าจะลบตารางนี้?')) deleteSheet(activeSheet.id);
             }}
             className="text-black text-sm underline hover:text-gray-700"
           >
             ลบตารางนี้ทิ้ง
           </button>
         </div>
      )}

      {/* Modal แก้ไขหัวข้อ (วัน/เวลา) หรือจาก Navbar */}
      {isEditingHeader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-black">
                {editingHeaderKey === 'navbar'
                  ? 'จัดการข้อมูลตารางเรียน'
                  : isEditingHeader === 'day' 
                    ? `ตั้งค่า: ${DAYS.find(d => d.key === editingHeaderKey)?.label}`
                    : `ตั้งค่า: คาบ ${editingHeaderKey}`
                }
              </h3>
              <button 
                onClick={() => {
                  setIsEditingHeader(null);
                  setEditingHeaderKey(null);
                }}
                className="text-black hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b">
              {(['subject', 'teacher', 'school', 'room'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-600 text-black'
                      : 'text-black hover:text-gray-800'
                  }`}
                >
                  {tab === 'subject' && '📚 วิชา'}
                  {tab === 'teacher' && '👨‍🏫 อาจารย์'}
                  {tab === 'school' && '🏫 โรงเรียน'}
                  {tab === 'room' && '🚪 ห้องเรียน'}
                </button>
              ))}
            </div>

            {/* Tab Content: วิชา */}
            {activeTab === 'subject' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-lg text-black">รายการวิชา</h4>
                  <button
                    onClick={handleAddSubject}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    + เพิ่มวิชา
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeSheet.subjects.map(subject => (
                    <div key={subject.id} className="border p-3 rounded flex justify-between items-center">
                      <div>
                        <div className="font-bold text-black">{subject.code} - {subject.name}</div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('ลบวิชานี้?')) deleteSubject(subject.id);
                        }}
                        className="text-black hover:text-gray-700"
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Content: อาจารย์ */}
            {activeTab === 'teacher' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-lg text-black">รายการอาจารย์</h4>
                  <button
                    onClick={handleAddTeacher}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    + เพิ่มอาจารย์
                  </button>
                </div>
                <div className="space-y-4">
                  {activeSheet.teachers.map(teacher => (
                    <div key={teacher.id} className="border p-4 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-lg text-black">{teacher.name}</div>
                        <button
                          onClick={() => {
                            if (confirm('ลบอาจารย์นี้?')) deleteTeacher(teacher.id);
                          }}
                          className="text-black hover:text-gray-700"
                        >
                          ลบ
                        </button>
                      </div>
                      <div className="mt-2">
                        <div className="text-sm font-medium mb-2">ห้องที่สอนได้:</div>
                        <div className="flex flex-wrap gap-2">
                          {activeSheet.rooms.map(room => (
                            <button
                              key={room.id}
                              onClick={() => handleTeacherRoomToggle(teacher.id, room.id)}
                              className={`px-3 py-1 rounded text-sm ${
                                teacher.availableRooms.includes(room.id)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-black hover:bg-gray-300'
                              }`}
                            >
                              {room.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Content: โรงเรียน */}
            {activeTab === 'school' && (
              <div>
                <h4 className="font-bold text-lg mb-4 text-black">ข้อมูลโรงเรียน</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-black">ชื่อโรงเรียน</label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded text-black"
                      value={activeSheet.schoolInfo.name}
                      onChange={e => updateSchoolInfo({ ...activeSheet.schoolInfo, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-black">วันที่เริ่มเรียน</label>
                      <input
                        type="date"
                        className="w-full border p-2 rounded text-black"
                        value={activeSheet.schoolInfo.startDate}
                        onChange={e => updateSchoolInfo({ ...activeSheet.schoolInfo, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-black">วันที่สิ้นสุด</label>
                      <input
                        type="date"
                        className="w-full border p-2 rounded text-black"
                        value={activeSheet.schoolInfo.endDate}
                        onChange={e => updateSchoolInfo({ ...activeSheet.schoolInfo, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-black">นาทีต่อคาบ (นาที)</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded text-black"
                      value={activeSheet.schoolInfo.minutesPerPeriod}
                      onChange={e => updateSchoolInfo({ ...activeSheet.schoolInfo, minutesPerPeriod: parseInt(e.target.value) || 60 })}
                    />
                  </div>
                  {isEditingHeader === 'period' && (
                    <div>
                      <label className="block text-sm font-medium mb-1 text-black">นาทีต่อคาบสำหรับคาบนี้ (ไม่บังคับ)</label>
                      <input
                        type="number"
                        className="w-full border p-2 rounded text-black"
                        value={PERIODS.find(p => p.id === editingHeaderKey)?.minutesPerPeriod || ''}
                        onChange={e => updatePeriodConfig(editingHeaderKey as number, { 
                          minutesPerPeriod: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        placeholder="ถ้าไม่ระบุจะใช้ค่าจากโรงเรียน"
                      />
                    </div>
                  )}  
                </div>
              </div>
            )}

            {/* Tab Content: ห้องเรียน */}
            {activeTab === 'room' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-lg text-black">รายการห้องเรียน</h4>
                  <button
                    onClick={handleAddRoom}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    + เพิ่มห้องเรียน
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeSheet.rooms.map(room => (
                    <div key={room.id} className="border p-3 rounded flex justify-between items-center">
                      <div>
                        <div className="font-bold text-black">{room.name}</div>
                        {room.capacity && <div className="text-sm text-black">ความจุ: {room.capacity} คน</div>}
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('ลบห้องเรียนนี้?')) deleteRoom(room.id);
                        }}
                        className="text-black hover:text-gray-700"
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
