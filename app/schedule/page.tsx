"use client";

import React, { useState, useEffect } from 'react';
import { useMultiSchedule } from '../api/schedule/hooks/multischedule';
import { ClassSlot, Subject, Teacher, Room, PeriodConfig, SchoolInfo } from '../api/schedule/type/schedule';
import { X, School, GraduationCap, UserRound, Book } from "lucide-react";
import { useRouter } from 'next/navigation';


// Import Framer Motion
import { motion, AnimatePresence, Variants } from 'framer-motion';

// TAB
import RoomTab from '@/compunets/schedule-add/room';
import SubjectTab from '@/compunets/schedule-add/subject';
import TeacherTab from '@/compunets/schedule-add/teacher';
import SchoolTab from '@/compunets/schedule-add/school';
import ScheduleTable from '@/compunets/schedule-add/ScheduleTable';
import AddRoomModal from '@/compunets/schedule-add/AddRoomModal';
import AddSubjectModal from '@/compunets/schedule-add/AddSubjectModal';
import AddTeacherModal from '@/compunets/schedule-add/AddTeacherModal';
import ConfirmDeleteModal from '@/compunets/schedule-add/ConfirmDeleteModal';

const containerVar: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 } 
  }
};

const itemVar: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const modalVar: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
};

export default function SchedulePage() {
  const { 
    sheets, activeSheet, activeSheetId, setActiveSheetId, 
    createSheet, deleteSheet, updateSlot, removeSlot, isLoaded,
    addSubject, updateSubject, deleteSubject,
    addTeacher, updateTeacher, deleteTeacher,
    addRoom, updateRoom, deleteRoom,
    updateSchoolInfo, updatePeriodConfig, updateDayConfig,
    getAllRooms, getSheetByRoomId, setPeriodConfigs
  } = useMultiSchedule();

  const [isEditing, setIsEditing] = useState<{day: string, period: number} | null>(null);
  const [isEditingHeader, setIsEditingHeader] = useState<'day' | 'period' | null>(null);
  const [editingHeaderKey, setEditingHeaderKey] = useState<string | number | null>(null);
  const [tempData, setTempData] = useState({ 
    code: '', name: '', teacherId: '', roomId: '' 
  });
  const [activeTab, setActiveTab] = useState<'subject' | 'teacher' | 'school' | 'room'>('subject');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'subject' | 'teacher' | 'room' | null;
    id: string | null;
    name: string | null;
  }>({
    isOpen: false,
    type: null,
    id: null,
    name: null
  });

    // ฟังก์ชันเปิด Modal จาก Navbar
  const openNavbarModal = (tab: 'subject' | 'teacher' | 'school' | 'room') => {
    setIsEditingHeader('day');
    setEditingHeaderKey('navbar');
    setActiveTab(tab);
  };

  // ดึงข้อมูลห้องทั้งหมด (ต้องประกาศก่อน useEffect)
  const allRooms = getAllRooms();

  // เมื่อโหลดเสร็จ ให้เลือกห้องแรกสุดอัตโนมัติ
  useEffect(() => {
    if (isLoaded && allRooms.length > 0 && !selectedRoomId) {
      const firstRoom = allRooms[0];
      const roomSheet = getSheetByRoomId(firstRoom.id);
      if (roomSheet) {
        setSelectedRoomId(firstRoom.id);
        setActiveSheetId(roomSheet.id);
      }
    }
  }, [isLoaded, allRooms.length, selectedRoomId, getSheetByRoomId, setActiveSheetId]);

  // เมื่อเลือกห้อง ให้เปลี่ยนไปตารางที่เชื่อมกับห้องนั้น
  useEffect(() => {
    if (selectedRoomId) {
      const roomSheet = getSheetByRoomId(selectedRoomId);
      if (roomSheet) {
        setActiveSheetId(roomSheet.id);
      }
    }
  }, [selectedRoomId, getSheetByRoomId, setActiveSheetId]);

  if (!isLoaded || !activeSheet) return (
    <div className="p-10 text-center ml-20 animate-pulse">
      กำลังโหลดข้อมูล...
    </div>
  );

  const DAYS = activeSheet.dayConfigs || [];
  const PERIODS = activeSheet.periodConfigs || [];

  // NOTE: don't early-return when there are no rooms — keep rendering the
  // page so modals (the Navbar modal) can open even when `allRooms` is empty.

  // ฟังก์ชันเปิด Modal แก้ไขช่องตาราง
  const openEdit = (day: string, period: number) => {
    const existing = activeSheet.slots.find(s => s.day === day && s.period === period);
    if (existing) {
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
    const openHeaderEdit = (type: string, id: number) => {
      setIsEditingHeader(type as "day" | "period");
      setEditingHeaderKey(id);
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
  const handleAddSubject = (subject: Subject) => {
    if (editingSubject) {
      updateSubject(subject);
      setEditingSubject(null);
    } else {
      addSubject(subject);
    }
    setIsAddSubjectModalOpen(false);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setIsAddSubjectModalOpen(true);
  };

  // จัดการอาจารย์
  const handleAddTeacher = (teacher: Teacher) => {
    if (editingTeacher) {
      updateTeacher(teacher);
      setEditingTeacher(null);
    } else {
      addTeacher(teacher);
    }
    setIsAddTeacherModalOpen(false);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsAddTeacherModalOpen(true);
  };

  // เปิด Modal ยืนยันการลบ
  const openDeleteModal = (type: 'subject' | 'teacher' | 'room', id: string, name: string) => {
    setDeleteModal({ isOpen: true, type, id, name });
  };

  // ยืนยันการลบ
  const handleConfirmDelete = () => {
    if (!deleteModal.id || !deleteModal.type) return;

    switch (deleteModal.type) {
      case 'subject':
        deleteSubject(deleteModal.id);
        break;
      case 'teacher':
        deleteTeacher(deleteModal.id);
        break;
      case 'room':
        deleteRoom(deleteModal.id);
        break;
    }

    setDeleteModal({ isOpen: false, type: null, id: null, name: null });
  };

  // จัดการห้องเรียน
  const handleAddRoom = (room: Room) => {
    if (editingRoom) {
      updateRoom(room);
      setEditingRoom(null);
      setIsAddRoomModalOpen(false);
    } else {
      addRoom(room);
      // หลังจากสร้างห้องแล้ว ให้เลือกห้องนั้น
      setTimeout(() => {
        const roomSheet = getSheetByRoomId(room.id);
        if (roomSheet) {
          setSelectedRoomId(room.id);
          setActiveSheetId(roomSheet.id);
        }
      }, 100);
      setIsAddRoomModalOpen(false);
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setIsAddRoomModalOpen(true);
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

  function generatePeriodConfigs(startTime: string, endTime: string, minutesPerPeriod: number) {
    const configs: { id: number; time: string; minutesPerPeriod: number }[] = [];
    if (!startTime || !endTime || !minutesPerPeriod) return configs;
    let id = 1;
    let [sh, sm] = startTime.split(':').map(Number);
    let [eh, em] = endTime.split(':').map(Number);
    let start = new Date(2000, 0, 1, sh, sm);
    let end = new Date(2000, 0, 1, eh, em);
  
    while (start < end) {
      const periodStart = new Date(start.getTime());
      start.setMinutes(start.getMinutes() + minutesPerPeriod);
      if (start > end) break;
      configs.push({
        id,
        time: `${periodStart.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})} - ${start.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}`,
        minutesPerPeriod
      });
      id++;
    }
    return configs;
  }

  const handleUpdateSchoolInfo = (info: SchoolInfo) => {
    updateSchoolInfo(info);
    const newPeriods = generatePeriodConfigs(info.startTime, info.endTime, info.minutesPerPeriod);
    // setPeriodConfigs จะจัดการลบ slots ที่อยู่นอกช่วงเวลาใหม่อัตโนมัติ
    setPeriodConfigs(newPeriods);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans ml-20"
    >
      
      {/* Navbar ด้านบน */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-md rounded-lg mb-6 p-4"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold text-black flex items-center gap-2">
            <motion.span 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, repeatDelay: 5, duration: 1 }}
            >
              📅
            </motion.span> 
            ตารางเรียน
          </h1>
          
          {/* Navbar Menu */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'subject', label: 'วิชา', color: 'blue', icon: <Book size={20} /> },
              { id: 'teacher', label: 'อาจารย์', color: 'purple', icon: <UserRound size={20} /> },
              { id: 'school', label: 'โรงเรียน', color: 'orange', icon: <School size={20} /> },
              { id: 'room', label: 'ห้องเรียน', color: 'green', icon: <GraduationCap size={20} /> },
            ].map((btn) => (
              <motion.button
                key={btn.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openNavbarModal(btn.id as any)}
                className={`min-w-[120px] px-4 py-2.5 rounded-lg text-sm bg-${btn.color}-100 text-black hover:bg-${btn.color}-200 border border-${btn.color}-300 transition-colors font-medium flex items-center justify-center gap-2`}
              >
                {btn.icon}
                <span>{btn.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col gap-4 w-full">
          {/* Room Selector */}
          {allRooms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-black self-center">เลือกห้อง:</span>
              {allRooms.map(room => {
                const roomSheet = getSheetByRoomId(room.id);
                return (
                  <motion.button
                    key={room.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedRoomId(room.id);
                      if (roomSheet) {
                        setActiveSheetId(roomSheet.id);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm transition-all relative ${
                      selectedRoomId === room.id && activeSheet?.roomId === room.id
                        ? 'bg-green-600 text-white shadow-md' 
                        : 'bg-white text-black hover:bg-gray-100 border'
                    }`}
                  >
                    {room.name}
                    {selectedRoomId === room.id && activeSheet?.roomId === room.id && (
                      <motion.div
                        layoutId="activeRoomIndicator"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-full"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
          
          {/* Room Selector Button */}
          <div className="flex flex-wrap gap-2">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openNavbarModal('room')}
              className="px-4 py-2 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 shadow-md font-medium flex items-center gap-2"
            >
              เพิ่มห้องเรียน
            </motion.button>
          </div>
        </div>
      </div>

    {allRooms.length === 0 ? (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[60vh] bg-gray-50 p-4 md:p-8 font-sans ml-20 flex items-center justify-center"
      >
        <div className="text-center w-full max-w-lg">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="bg-white p-8 rounded-xl shadow-lg"
          >
            <GraduationCap size={64} className="mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">ยังไม่มีห้องเรียน</h2>
            <p className="text-gray-600 mb-6">กรุณาเพิ่มห้องเรียนก่อนเพื่อเริ่มใช้งานตารางเรียน</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openNavbarModal('room')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md font-medium flex items-center gap-2 mx-auto"
            >
              <GraduationCap size={20} />
              เพิ่มห้องเรียน
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    ) : (
      <ScheduleTable
        PERIODS={PERIODS}
        DAYS={DAYS}
        activeSheet={activeSheet}
        openHeaderEdit={openHeaderEdit}
        openEdit={openEdit}
        containerVar={containerVar}
        itemVar={itemVar}
      />
    )}



      {/* Modal แก้ไขหัวข้อ (วัน/เวลา) หรือจาก Navbar */}
      <AnimatePresence>
      {isEditingHeader && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
        >
          <motion.div 
            variants={modalVar}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white p-6 rounded-xl shadow-2xl w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-black">
                {editingHeaderKey === 'navbar'
                  ? 'จัดการข้อมูลตารางเรียน'
                  : isEditingHeader === 'day' 
                    ? `ตั้งค่า: ${DAYS.find(d => d.key === editingHeaderKey)?.label}`
                    : `ตั้งค่า: คาบ ${editingHeaderKey}`
                }
              </h3>
              <motion.button 
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setIsEditingHeader(null);
                  setEditingHeaderKey(null);
                }}
                className="text-black hover:text-gray-700 text-4xl font-light w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b">
              {([
                { id: 'subject', label: 'วิชา', icon: <Book size={18} /> },
                { id: 'teacher', label: 'อาจารย์', icon: <UserRound size={18} /> },
                { id: 'school', label: 'โรงเรียน', icon: <School size={18} /> },
                { id: 'room', label: 'ห้องเรียน', icon: <GraduationCap size={18} /> },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 font-medium transition-colors relative flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'text-black'
                      : 'text-black hover:text-gray-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600"
                    />
                  )}
                </button>
              ))}
            </div>
            
            {/* Tab Content Wrappers with Animation */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
                {activeTab === 'subject' && (
                <SubjectTab 
                    activeSheet={activeSheet}
                    handleAddSubject={() => {
                      setEditingSubject(null);
                      setIsAddSubjectModalOpen(true);
                    }} 
                    handleEditSubject={handleEditSubject}
                    deleteSubject={(id) => {
                      const subject = activeSheet.subjects.find(s => s.id === id);
                      openDeleteModal('subject', id, subject ? `${subject.code} - ${subject.name}` : '');
                    }}
                    teachers={activeSheet.teachers || []}
                />
                )}

                {activeTab === 'teacher' && (
                <TeacherTab 
                    activeSheet={activeSheet}
                    handleAddTeacher={() => {
                      setEditingTeacher(null);
                      setIsAddTeacherModalOpen(true);
                    }}
                    handleEditTeacher={handleEditTeacher}
                    deleteTeacher={(id) => {
                      const teacher = activeSheet.teachers.find(t => t.id === id);
                      openDeleteModal('teacher', id, teacher?.name || '');
                    }}
                    handleTeacherRoomToggle={handleTeacherRoomToggle}
                />
                )}

                {activeTab === 'school' && (
                  <SchoolTab
                    activeSheet={activeSheet}
                    updateSchoolInfo={handleUpdateSchoolInfo}
                    
                    // ❌ ของเดิม (ผิด): เพราะ Modal นี้ไม่ได้ใช้ state นี้
                    // onClose={() => setIsSchoolModalOpen(false)} 

                    // ✅ แก้เป็น (ถูก): สั่งปิดตัวแปร isEditingHeader ที่คุม Modal นี้อยู่
                    onClose={() => {
                      setIsEditingHeader(null);
                      setEditingHeaderKey(null);
                    }}

                    isEditingHeader={isEditingHeader as string | null}
                    editingHeaderKey={
                      typeof editingHeaderKey === 'number'
                        ? editingHeaderKey
                        : editingHeaderKey != null && !Number.isNaN(Number(editingHeaderKey))
                        ? Number(editingHeaderKey)
                        : null
                    }
                    updatePeriodConfig={updatePeriodConfig}
                    PERIODS={
                      (activeSheet.periodConfigs ?? []).map((p: PeriodConfig) => ({
                        id: p.id,
                        name: p.time ?? `Period ${p.id}`,
                        minutesPerPeriod: p.minutesPerPeriod,
                        onClose: () => {
                          setIsEditingHeader(null);
                          setEditingHeaderKey(null);
                        }
                      }))
                    }
                  />
                )}
                
                {activeTab === 'room' && (
                <RoomTab 
                    activeSheet={activeSheet}
                    handleAddRoom={handleAddRoom}
                    handleEditRoom={handleEditRoom}
                    deleteRoom={(id) => {
                      const room = activeSheet.rooms.find(r => r.id === id);
                      openDeleteModal('room', id, room?.name || '');
                    }}
                    getSheetByRoomId={getSheetByRoomId}
                    onOpenAddRoomModal={() => {
                      setEditingRoom(null);
                      setIsAddRoomModalOpen(true);
                    }}
                />
                )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Modal สำหรับเพิ่ม/แก้ไขห้องเรียน */}
      <AddRoomModal
        isOpen={isAddRoomModalOpen}
        onClose={() => {
          setIsAddRoomModalOpen(false);
          setEditingRoom(null);
        }}
        onSave={handleAddRoom}
        allRooms={allRooms}
        getSheetByRoomId={getSheetByRoomId}
        editingRoom={editingRoom}
        onSelectRoom={(roomId) => {
          setSelectedRoomId(roomId);
          const roomSheet = getSheetByRoomId(roomId);
          if (roomSheet) {
            setActiveSheetId(roomSheet.id);
          }
          setIsAddRoomModalOpen(false);
          setEditingRoom(null);
        }}
      />

      {/* Modal สำหรับเพิ่ม/แก้ไขวิชา */}
      <AddSubjectModal
        isOpen={isAddSubjectModalOpen}
        onClose={() => {
          setIsAddSubjectModalOpen(false);
          setEditingSubject(null);
        }}
        onSave={handleAddSubject}
        teachers={activeSheet?.teachers || []}
        rooms={allRooms}
        editingSubject={editingSubject}
      />

      {/* Modal สำหรับเพิ่ม/แก้ไขอาจารย์ */}
      <AddTeacherModal
        isOpen={isAddTeacherModalOpen}
        onClose={() => {
          setIsAddTeacherModalOpen(false);
          setEditingTeacher(null);
        }}
        onSave={handleAddTeacher}
        editingTeacher={editingTeacher}
      />

      {/* Modal ยืนยันการลบ */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, id: null, name: null })}
        onConfirm={handleConfirmDelete}
        title={
          deleteModal.type === 'subject' ? 'ยืนยันการลบวิชา' :
          deleteModal.type === 'teacher' ? 'ยืนยันการลบอาจารย์' :
          deleteModal.type === 'room' ? 'ยืนยันการลบห้องเรียน' :
          'ยืนยันการลบ'
        }
        message={
          deleteModal.type === 'subject' ? 'คุณแน่ใจหรือไม่ว่าต้องการลบวิชานี้?' :
          deleteModal.type === 'teacher' ? 'คุณแน่ใจหรือไม่ว่าต้องการลบอาจารย์คนนี้?' :
          deleteModal.type === 'room' ? 'คุณแน่ใจหรือไม่ว่าต้องการลบห้องเรียนนี้? การลบจะลบตารางเรียนที่เกี่ยวข้องด้วย' :
          'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?'
        }
        itemName={deleteModal.name || undefined}
      />

    </motion.div>
  );
}