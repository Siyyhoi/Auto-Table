"use client";

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { Room } from '@/app/api/schedule/type/schedule';
import { X } from 'lucide-react';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (room: Room) => void;
  editingRoom?: Room | null; // เพิ่ม prop สำหรับแก้ไข
}

const modalVar = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
};

export default function AddRoomModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingRoom = null
}: AddRoomModalProps) {
  const [name, setName] = useState('');
  const [roomType, setRoomType] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');

  // เมื่อ editingRoom เปลี่ยน หรือ isOpen เปลี่ยน ให้โหลดข้อมูล
  React.useEffect(() => {
    if (editingRoom) {
      setName(editingRoom.name);
      setRoomType(editingRoom.room_type || '');
      setCapacity(editingRoom.capacity ?? '');
    } else {
      setName('');
      setRoomType('');
      setCapacity('');
    }
  }, [editingRoom, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomType.trim()) return;

    const roomData: Room = {
      id: editingRoom?.id || `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      room_type: roomType.trim(),
      capacity: typeof capacity === 'number' ? capacity : undefined
    };

    onSave(roomData);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setRoomType('');
    setCapacity('');
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
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800">
                {editingRoom ? 'แก้ไขห้องเรียน' : 'เพิ่มห้องเรียน'}
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
              {/* Room Name */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  ชื่อห้องเรียน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition text-black"
                  placeholder="เช่น 404, Lab 1"
                  required
                  autoFocus
                />
              </div>

              {/* Room Type */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  ประเภทห้อง <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 appearance-none bg-gray-50 hover:bg-white transition focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="เช่น ห้องเรียน, ห้องปฏิบัติการ, ห้องประชุม,"
                    required
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  ความจุ (ไม่บังคับ)
                </label>
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition text-black"
                  placeholder="เช่น 40"
                />
              </div>

              {/* Buttons */}
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
                  disabled={!name.trim() || !roomType.trim()}
                  className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50 text-black"
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

