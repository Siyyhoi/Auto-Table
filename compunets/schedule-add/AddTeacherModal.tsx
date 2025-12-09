"use client";

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { Teacher, UnavailableTime } from '@/app/api/schedule/type/schedule';
import { X, Plus, Trash2 } from 'lucide-react';

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (teacher: Teacher) => void;
  editingTeacher?: Teacher | null; // เพิ่ม prop สำหรับแก้ไข
}

const modalVar = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
};

export default function AddTeacherModal({ isOpen, onClose, onSave, editingTeacher = null }: AddTeacherModalProps) {
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [maxHoursPerWeek, setMaxHoursPerWeek] = useState<number | ''>('');
  const [weekendAvailable, setWeekendAvailable] = useState(false);
  const [unavailableTimes, setUnavailableTimes] = useState<UnavailableTime[]>([]);
  const [newUnavailableDay, setNewUnavailableDay] = useState('');
  const [newUnavailablePeriod, setNewUnavailablePeriod] = useState<number | ''>('');

  // เมื่อ editingTeacher เปลี่ยน ให้โหลดข้อมูลเข้า form
  React.useEffect(() => {
    if (editingTeacher) {
      // ถ้ามี full_name แต่ไม่มี first_name, last_name ให้แยก
      if (editingTeacher.full_name && !editingTeacher.first_name && !editingTeacher.last_name) {
        const nameParts = editingTeacher.full_name.trim().split(/\s+/);
        const detectedTitle = nameParts[0].match(/^(ดร\.|ผศ\.|รศ\.|ศ\.|อ\.|อาจารย์)$/) ? nameParts[0] : '';
        const startIdx = detectedTitle ? 1 : 0;
        setTitle(detectedTitle);
        setFirstName(nameParts[startIdx] || '');
        setLastName(nameParts.slice(startIdx + 1).join(' ') || '');
      } else {
        setTitle(editingTeacher.title || '');
        setFirstName(editingTeacher.first_name || '');
        setLastName(editingTeacher.last_name || '');
      }
      setMaxHoursPerWeek(editingTeacher.max_hours_per_week ?? '');
      setWeekendAvailable(editingTeacher.weekend_available ?? false);
      setUnavailableTimes(editingTeacher.unavailable_times || []);
    } else {
      setTitle('');
      setFirstName('');
      setLastName('');
      setMaxHoursPerWeek('');
      setWeekendAvailable(false);
      setUnavailableTimes([]);
    }
    setNewUnavailableDay('');
    setNewUnavailablePeriod('');
  }, [editingTeacher, isOpen]);

  const handleAddUnavailableTime = () => {
    if (newUnavailableDay && newUnavailablePeriod) {
      setUnavailableTimes([...unavailableTimes, {
        day: newUnavailableDay,
        period: Number(newUnavailablePeriod)
      }]);
      setNewUnavailableDay('');
      setNewUnavailablePeriod('');
    }
  };

  const handleRemoveUnavailableTime = (index: number) => {
    setUnavailableTimes(unavailableTimes.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const fullName = [title, firstName, lastName].filter(Boolean).join(' ');

    const teacherData: Teacher = {
      id: editingTeacher?.id || `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title || undefined,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: fullName,
      max_hours_per_week: typeof maxHoursPerWeek === 'number' ? maxHoursPerWeek : undefined,
      unavailable_times: unavailableTimes.length > 0 ? unavailableTimes : undefined,
      weekend_available: weekendAvailable,
      availableRooms: editingTeacher?.availableRooms || []
    };

    onSave(teacherData);
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setFirstName('');
    setLastName('');
    setMaxHoursPerWeek('');
    setWeekendAvailable(false);
    setUnavailableTimes([]);
    setNewUnavailableDay('');
    setNewUnavailablePeriod('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div 
            variants={modalVar}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white p-6 rounded-xl shadow-2xl w-[90vw] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-black">
                {editingTeacher ? 'แก้ไขอาจารย์' : 'เพิ่มอาจารย์'}
              </h3>
              <motion.button 
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="text-black hover:text-gray-700 text-4xl font-light w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={24} />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  คำนำหน้า
                </label>
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border p-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">ไม่ระบุ</option>
                  <option value="ดร.">ดร.</option>
                  <option value="ผศ.">ผศ.</option>
                  <option value="รศ.">รศ.</option>
                  <option value="ศ.">ศ.</option>
                  <option value="อ.">อ.</option>
                  <option value="อาจารย์">อาจารย์</option>
                </select>
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    ชื่อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border p-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="สมชาย"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border p-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ใจดี"
                    required
                  />
                </div>
              </div>

              {/* Full Name Display */}
              {firstName && lastName && (
                <div className="bg-gray-50 p-2 rounded-lg">
                  <label className="block text-xs font-medium mb-1 text-gray-600">ชื่อเต็ม:</label>
                  <p className="text-sm text-black font-medium">
                    {[title, firstName, lastName].filter(Boolean).join(' ')}
                  </p>
                </div>
              )}

              {/* Max Hours Per Week */}
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  ชั่วโมงสูงสุดต่อสัปดาห์
                </label>
                <input
                  type="number"
                  min="0"
                  value={maxHoursPerWeek}
                  onChange={(e) => setMaxHoursPerWeek(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border p-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น 20"
                />
              </div>

              {/* Weekend Available */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="weekendAvailable"
                  checked={weekendAvailable}
                  onChange={(e) => setWeekendAvailable(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="weekendAvailable" className="text-sm font-medium text-black">
                  สอนวันหยุดได้
                </label>
              </div>

              {/* Unavailable Times */}
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  เวลาที่ไม่ว่าง
                </label>
                <div className="space-y-2">
                  {unavailableTimes.map((time, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                      <span className="flex-1 text-sm text-black">
                        {time.day} - คาบ {time.period}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUnavailableTime(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <select
                      value={newUnavailableDay}
                      onChange={(e) => setNewUnavailableDay(e.target.value)}
                      className="flex-1 border p-2 rounded-lg text-black text-sm"
                    >
                      <option value="">เลือกวัน</option>
                      <option value="Monday">จันทร์</option>
                      <option value="Tuesday">อังคาร</option>
                      <option value="Wednesday">พุธ</option>
                      <option value="Thursday">พฤหัส</option>
                      <option value="Friday">ศุกร์</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newUnavailablePeriod}
                      onChange={(e) => setNewUnavailablePeriod(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="คาบ"
                      className="w-20 border p-2 rounded-lg text-black text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddUnavailableTime}
                      disabled={!newUnavailableDay || !newUnavailablePeriod}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ยกเลิก
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled={!firstName.trim() || !lastName.trim()}
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

