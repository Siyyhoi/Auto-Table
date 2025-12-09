"use client";

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSchedule: (scheduleName: string, grade?: string) => void;
}

const modalVar = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
};

export default function CreateScheduleModal({
  isOpen,
  onClose,
  onCreateSchedule
}: CreateScheduleModalProps) {
  const [scheduleName, setScheduleName] = useState<string>('');
  const [grade, setGrade] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleName.trim()) return;

    onCreateSchedule(scheduleName.trim(), grade.trim() || undefined);
    handleClose();
  };

  const handleClose = () => {
    setScheduleName('');
    setGrade('');
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
              <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="text-green-600" size={24} />
                สร้างตารางเรียน
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

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Schedule Name */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  ชื่อตารางเรียน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition text-black"
                  placeholder="เช่น ตารางเรียนเทอม 1"
                  required
                  autoFocus
                />
              </div>

              {/* Grade */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  ชั้นเรียน (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition text-black"
                  placeholder="เช่น ม.1, ม.2/1, ป.4, ม.6/2"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
                >
                  ยกเลิก
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={!scheduleName.trim()}
                  className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50"
                >
                  สร้างตาราง
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

