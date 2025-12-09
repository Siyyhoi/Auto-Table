"use client";

import React, { useState, useEffect } from 'react';
import { useMultiSchedule } from '../api/schedule/hooks/multischedule';
import { ClassSlot, Subject, Teacher, Room, PeriodConfig, SchoolInfo } from '../api/schedule/type/schedule';
import { X, School, GraduationCap, UserRound, Book, Save, Loader2, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
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
import CreateScheduleModal from '@/compunets/schedule-add/CreateScheduleModal';

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
  const [userId, setUserId] = useState<number | null>(null);

  // ดึง userId เมื่อ component mount
  useEffect(() => {
    async function getCurrentUserId() {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const response = await fetch('/api/user/current', {
            headers: {
              'x-username': user.username,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.userId) {
              setUserId(data.userId);
              console.log('User ID loaded:', data.userId);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user ID:', error);
      }
    }
    getCurrentUserId();
  }, []);

  const { 
    sheets, activeSheet, activeSheetId, setActiveSheetId, 
    createSheet, deleteSheet, updateSlot, removeSlot, isLoaded,
    addSubject, updateSubject, deleteSubject,
    addTeacher, updateTeacher, deleteTeacher,
    addRoom, updateRoom, deleteRoom,
    updateSchoolInfo, updatePeriodConfig, updateDayConfig,
    getAllRooms, setPeriodConfigs,
    saveStatus
  } = useMultiSchedule(userId);


  const [isEditing, setIsEditing] = useState<{day: string, period: number} | null>(null);
  const [isEditingHeader, setIsEditingHeader] = useState<'day' | 'period' | null>(null);
  const [editingHeaderKey, setEditingHeaderKey] = useState<string | number | null>(null);
  const [tempData, setTempData] = useState({ 
    code: '', name: '', teacherId: '', roomId: '' 
  });
  const [activeTab, setActiveTab] = useState<'subject' | 'teacher' | 'school' | 'room'>('subject');
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isCreateScheduleModalOpen, setIsCreateScheduleModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'subject' | 'teacher' | 'room' | 'schedule' | null;
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

  const DAYS = activeSheet?.dayConfigs || [];
  const PERIODS = activeSheet?.periodConfigs || [];

  // NOTE: don't early-return when there are no rooms — keep rendering the
  // page so modals (the Navbar modal) can open even when `allRooms` is empty.

  // ฟังก์ชันเปิด Modal แก้ไขช่องตาราง
  const openEdit = (day: string, period: number) => {
    if (!activeSheet) return;
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
    if (!isEditing || !activeSheet) return;
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
  const openDeleteModal = (type: 'subject' | 'teacher' | 'room' | 'schedule', id: string, name: string) => {
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
      case 'schedule':
        if (sheets.length <= 1) {
          alert('ไม่สามารถลบตารางเรียนได้ ต้องมีอย่างน้อย 1 ตารางเรียน');
          setDeleteModal({ isOpen: false, type: null, id: null, name: null });
          return;
        }
        deleteSheet(deleteModal.id);
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
      setIsAddRoomModalOpen(false);
    }
  };

  // สร้างตารางเรียนใหม่ (ไม่เชื่อมกับห้อง)
  const handleCreateSchedule = (scheduleName: string, grade?: string) => {
    console.log('Creating schedule:', scheduleName, grade);
    createSheet(scheduleName, grade);
    console.log('Schedule created, sheets count:', sheets.length + 1);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setIsAddRoomModalOpen(true);
  };

  // อัปเดตห้องที่อาจารย์สอนได้
  const handleTeacherRoomToggle = (teacherId: string, roomId: string) => {
    if (!activeSheet) return;
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
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-black flex items-center gap-2">
              <motion.span 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, repeatDelay: 5, duration: 1 }}
              >
                📅
              </motion.span> 
              ตารางเรียน
            </h1>
            
            {/* Save Status Indicator */}
            {userId && (
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === 'saving' && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="animate-spin" size={16} />
                    <span>กำลังบันทึก...</span>
                  </div>
                )}
                {saveStatus === 'saved' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 size={16} />
                    <span>บันทึกแล้ว</span>
                  </div>
                )}
                {saveStatus === 'unsaved' && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Save size={16} />
                    <span>ยังไม่บันทึก</span>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle size={16} />
                    <span>บันทึกไม่สำเร็จ</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
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
          {/* Schedule List Tabs */}
          {sheets.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-black">ตารางเรียน:</span>
              {sheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className={`relative group flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-all ${
                    activeSheetId === sheet.id
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-gray-100 border'
                  }`}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveSheetId(sheet.id)}
                    className="flex items-center gap-1"
                  >
                    {sheet.name}
                    {sheet.grade && (
                      <span className="ml-1 text-xs opacity-75">
                        ({sheet.grade})
                      </span>
                    )}
                  </motion.button>
                  {sheets.length > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal('schedule', sheet.id, sheet.name);
                      }}
                      className={`ml-1 p-1 rounded hover:bg-opacity-20 transition-colors ${
                        activeSheetId === sheet.id
                          ? 'hover:bg-white/30 text-white'
                          : 'hover:bg-red-100 text-red-600'
                      }`}
                      title="ลบตารางเรียน"
                    >
                      <X size={14} />
                    </motion.button>
                  )}
                  {activeSheetId === sheet.id && (
                    <motion.div
                      layoutId="activeScheduleIndicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-full"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Create Schedule Button */}
          <div className="flex flex-wrap gap-2">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreateScheduleModalOpen(true)}
              className="px-4 py-2 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 shadow-md font-medium flex items-center gap-2"
            >
              <Calendar size={18} />
              เพิ่มตารางเรียน
            </motion.button>
          </div>
        </div>
      </div>

    {sheets.length === 0 ? (
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
            <Calendar size={64} className="mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">ยังไม่มีตารางเรียน</h2>
            <p className="text-gray-600 mb-6">กรุณาสร้างตารางเรียนเพื่อเริ่มใช้งาน</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreateScheduleModalOpen(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md font-medium flex items-center gap-2 mx-auto"
            >
              <Calendar size={20} />
              สร้างตารางเรียน
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
                {activeTab === 'subject' && activeSheet && (
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

                {activeTab === 'teacher' && activeSheet && (
                <TeacherTab 
                    activeSheet={activeSheet}
                    handleAddTeacher={() => {
                      setEditingTeacher(null);
                      setIsAddTeacherModalOpen(true);
                    }}
                    handleEditTeacher={handleEditTeacher}
                    deleteTeacher={(id) => {
                      const teacher = activeSheet.teachers.find(t => t.id === id);
                      const teacherName = teacher?.full_name || (teacher ? `${teacher.first_name} ${teacher.last_name}` : '');
                      openDeleteModal('teacher', id, teacherName);
                    }}
                    handleTeacherRoomToggle={handleTeacherRoomToggle}
                />
                )}

                {activeTab === 'school' && activeSheet && (
                  <SchoolTab
                    activeSheet={activeSheet}
                    updateSchoolInfo={handleUpdateSchoolInfo}
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
                
                {activeTab === 'room' && activeSheet && (
                <RoomTab 
                    activeSheet={activeSheet}
                    handleAddRoom={handleAddRoom}
                    handleEditRoom={handleEditRoom}
                    deleteRoom={(id) => {
                      const room = activeSheet.rooms.find(r => r.id === id);
                      openDeleteModal('room', id, room?.name || '');
                    }}
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
        editingRoom={editingRoom}
      />

      {/* Modal สำหรับสร้างตารางเรียน */}
      <CreateScheduleModal
        isOpen={isCreateScheduleModalOpen}
        onClose={() => setIsCreateScheduleModalOpen(false)}
        onCreateSchedule={handleCreateSchedule}
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
          deleteModal.type === 'schedule' ? 'ยืนยันการลบตารางเรียน' :
          'ยืนยันการลบ'
        }
        message={
          deleteModal.type === 'subject' ? 'คุณแน่ใจหรือไม่ว่าต้องการลบวิชานี้?' :
          deleteModal.type === 'teacher' ? 'คุณแน่ใจหรือไม่ว่าต้องการลบอาจารย์คนนี้?' :
          deleteModal.type === 'room' ? 'คุณแน่ใจหรือไม่ว่าต้องการลบห้องเรียนนี้? การลบจะลบตารางเรียนที่เกี่ยวข้องด้วย' :
          deleteModal.type === 'schedule' ? 'คุณแน่ใจหรือไม่ว่าต้องการลบตารางเรียนนี้?' :
          'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?'
        }
        itemName={deleteModal.name || undefined}
      />

    </motion.div>
  );
}