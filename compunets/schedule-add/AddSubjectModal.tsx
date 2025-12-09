"use client";

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
// import Types ที่จำเป็น
import { Subject, Room, Teacher } from '@/app/api/schedule/type/schedule'; 
import { X, ChevronDown } from 'lucide-react';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subject: Subject) => void;
  teachers: Teacher[];
  rooms: Room[];
  editingSubject?: Subject | null; // เพิ่ม prop สำหรับแก้ไข
}

const modalVar = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
};

export default function AddSubjectModal({ 
  isOpen, 
  onClose, 
  onSave, 
  teachers = [], 
  rooms = [],
  editingSubject = null
}: AddSubjectModalProps) {
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [lectureHours, setLectureHours] = useState<number | ''>('');
  const [labHours, setLabHours] = useState<number | ''>('');
  const [totalHours, setTotalHours] = useState<number | ''>('');
  const [teacherId, setTeacherId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [labRoomId, setLabRoomId] = useState('');

  // เมื่อ editingSubject เปลี่ยน ให้โหลดข้อมูลเข้า form
  React.useEffect(() => {
    if (editingSubject) {
      setCode(editingSubject.code);
      setName(editingSubject.name);
      setNameEn(editingSubject.name_en || '');
      setLectureHours(editingSubject.lecture_hours ?? '');
      setLabHours(editingSubject.lab_hours ?? '');
      setTotalHours(editingSubject.total_hours ?? '');
      setTeacherId(editingSubject.teacherId || '');
      setRoomId(editingSubject.roomId || '');
      setLabRoomId(editingSubject.labRoomId || '');
    } else {
      setCode('');
      setName('');
      setNameEn('');
      setLectureHours('');
      setLabHours('');
      setTotalHours('');
      setTeacherId('');
      setRoomId('');
      setLabRoomId('');
    }
  }, [editingSubject, isOpen]);

  // คำนวณ total_hours อัตโนมัติ
  React.useEffect(() => {
    const lecture = typeof lectureHours === 'number' ? lectureHours : 0;
    const lab = typeof labHours === 'number' ? labHours : 0;
    const total = lecture + lab;
    if (total > 0) {
      setTotalHours(total);
    } else if (lectureHours === '' && labHours === '') {
      setTotalHours('');
    }
  }, [lectureHours, labHours]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    const subjectData: Subject = {
      id: editingSubject?.id || `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      code: code.trim(),
      name: name.trim(),
      name_en: nameEn.trim() || name.trim(), // ถ้าไม่มี name_en ให้ใช้ name แทน
      lecture_hours: typeof lectureHours === 'number' ? lectureHours : undefined,
      lab_hours: typeof labHours === 'number' ? labHours : undefined,
      total_hours: typeof totalHours === 'number' ? totalHours : undefined,
      teacherId: teacherId || undefined,
      roomId: roomId || undefined,
      labRoomId: labRoomId || undefined,
      color: editingSubject?.color || `bg-${['blue', 'green', 'purple', 'pink', 'yellow', 'orange'][Math.floor(Math.random() * 6)]}-500`
    };

    onSave(subjectData);
    handleClose();
  };

  const handleClose = () => {
    setCode('');
    setName('');
    setNameEn('');
    setLectureHours('');
    setLabHours('');
    setTotalHours('');
    setTeacherId('');
    setRoomId('');
    setLabRoomId('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={handleClose}
        >
          <motion.div
            variants={modalVar}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative border border-gray-200"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800">
                {editingSubject ? 'แก้ไขวิชา' : 'เพิ่มวิชา'}
              </h3>
              <motion.button
                whileHover={{ rotate: 90, scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                <X className="text-gray-700" size={26} />
              </motion.button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* CODE Input */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">รหัสวิชา <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="เช่น CS101"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition text-black"
                  required
                  autoFocus
                />
              </div>

              {/* NAME Input */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">ชื่อวิชา (ไทย) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น วิทยาการคอมพิวเตอร์"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition text-black"
                  required
                />
              </div>

              {/* NAME_EN Input */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">ชื่อวิชา (อังกฤษ)</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="เช่น Computer Science"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition text-black"
                />
              </div>

              {/* HOURS Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">ชั่วโมงบรรยาย</label>
                  <input
                    type="number"
                    min="0"
                    value={lectureHours}
                    onChange={(e) => setLectureHours(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition text-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">ชั่วโมงปฏิบัติการ</label>
                  <input
                    type="number"
                    min="0"
                    value={labHours}
                    onChange={(e) => setLabHours(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition text-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">ชั่วโมงรวม</label>
                  <input
                    type="number"
                    min="0"
                    value={totalHours}
                    onChange={(e) => setTotalHours(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition bg-gray-100 text-black"
                    readOnly
                  />
                </div>
              </div>

              {/* SELECT TEACHER */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">อาจารย์</label>
                <div className="relative">
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 appearance-none bg-gray-50 hover:bg-white transition text-black"
                  >
                    <option value="">ไม่ระบุ</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                </div>
              </div>

              {/* GRID: Lecture Room & Lab Room */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* SELECT LECTURE ROOM */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">ห้องบรรยาย</label>
                  <div className="relative">
                    <select
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 appearance-none bg-gray-50 hover:bg-white transition text-black"
                    >
                      <option value="">ไม่ระบุ</option>
                      {rooms.filter(room => room.room_type === 'ห้องเรียน' || !room.room_type?.includes('Lab')).map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                  </div>
                </div>

                {/* SELECT LAB ROOM */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">ห้องปฏิบัติการ</label>
                  <div className="relative">
                    <select
                      value={labRoomId}
                      onChange={(e) => setLabRoomId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 appearance-none bg-gray-50 hover:bg-white transition text-black"
                    >
                      <option value="">ไม่ระบุ</option>
                      {rooms.filter(room => room.room_type?.includes('Lab') || room.name?.includes('Lab')).map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                  </div>
                </div>

              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition text-black"
                >
                  ยกเลิก
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={!code.trim() || !name.trim()}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 text-black"
                >
                  บันทึก
                </motion.button>
              </div>

            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}