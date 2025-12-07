"use client";

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { Teacher } from '@/app/api/schedule/type/schedule';
import { X } from 'lucide-react';

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (teacher: Teacher) => void;
  editingTeacher?: Teacher | null; // เพิ่ม prop สำหรับแก้ไข
}

const modalVar = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
};

export default function AddTeacherModal({ isOpen, onClose, onSave, editingTeacher = null }: AddTeacherModalProps) {
  const [name, setName] = useState('');

  // เมื่อ editingTeacher เปลี่ยน ให้โหลดข้อมูลเข้า form
  React.useEffect(() => {
    if (editingTeacher) {
      setName(editingTeacher.name);
    } else {
      setName('');
    }
  }, [editingTeacher, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const teacherData: Teacher = {
      id: editingTeacher?.id || `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      availableRooms: editingTeacher?.availableRooms || []
    };

    onSave(teacherData);
    setName('');
    onClose();
  };

  const handleClose = () => {
    setName('');
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  ชื่ออาจารย์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border p-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น อาจารย์สมชาย ใจดี"
                  required
                  autoFocus
                />
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
                  disabled={!name.trim()}
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

