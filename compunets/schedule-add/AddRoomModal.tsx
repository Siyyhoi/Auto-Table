"use client";

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { Room } from '@/app/api/schedule/type/schedule';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (room: Room) => void;
  allRooms: Room[];
  getSheetByRoomId?: (roomId: string) => any;
  onSelectRoom?: (roomId: string) => void;
  editingRoom?: Room | null; // เพิ่ม prop สำหรับแก้ไข
}

const modalVar = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
};

export default function AddRoomModal({ 
  isOpen, 
  onClose, 
  onSave, 
  allRooms, 
  getSheetByRoomId,
  onSelectRoom,
  editingRoom = null
}: AddRoomModalProps) {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [showForm, setShowForm] = useState(false);

  // เมื่อ editingRoom เปลี่ยน หรือ isOpen เปลี่ยน ให้โหลดข้อมูลหรือแสดง form
  React.useEffect(() => {
    if (editingRoom) {
      setName(editingRoom.name);
      setCapacity(editingRoom.capacity?.toString() || '');
      setShowForm(true);
    } else if (isOpen && !editingRoom) {
      // ถ้าเปิด modal โดยไม่มีการแก้ไข ให้แสดงรายการห้อง
      setShowForm(false);
      setName('');
      setCapacity('');
    }
  }, [editingRoom, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const roomData: Room = {
      id: editingRoom?.id || `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      capacity: capacity ? parseInt(capacity) : undefined
    };

    onSave(roomData);
    setName('');
    setCapacity('');
    setShowForm(false);
  };

  const handleClose = () => {
    setName('');
    setCapacity('');
    setShowForm(false);
    onClose();
  };

  const handleSelectRoom = (roomId: string) => {
    if (onSelectRoom) {
      onSelectRoom(roomId);
    }
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
            className="bg-white p-6 rounded-xl shadow-2xl w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-black">
                {editingRoom ? 'แก้ไขห้องเรียน' : 'จัดการห้องเรียน'}
              </h3>
              <motion.button 
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="text-black hover:text-gray-700 text-4xl font-light w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ×
              </motion.button>
            </div>

            {!showForm ? (
              <div className="space-y-4">
                {/* รายการห้องเรียนที่มีอยู่ */}
                {allRooms.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-3 text-black">ห้องเรียนที่มีอยู่</h4>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {allRooms.map((room) => {
                        const hasSchedule = getSheetByRoomId && getSheetByRoomId(room.id);
                        return (
                          <motion.div
                            key={room.id}
                            whileHover={{ scale: 1.02 }}
                            className="border p-3 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSelectRoom(room.id)}
                          >
                            <div className="flex-1">
                              <div className="font-bold text-black flex items-center gap-2">
                                {room.name}
                                {hasSchedule && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    📅 มีตารางเรียน
                                  </span>
                                )}
                              </div>
                              {room.capacity && (
                                <div className="text-sm text-gray-600">ความจุ: {room.capacity} คน</div>
                              )}
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              ดูตาราง →
                            </motion.button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ปุ่มเพิ่มห้องเรียนใหม่ */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowForm(true)}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <span className="text-xl">+</span>
                  เพิ่มห้องเรียนใหม่
                </motion.button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    ชื่อห้องเรียน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border p-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="เช่น 404, Lab 1"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    ความจุ (ไม่บังคับ)
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full border p-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="เช่น 40"
                    min="1"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowForm(false);
                      setName('');
                      setCapacity('');
                    }}
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
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

