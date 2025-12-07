"use client";

import { motion, AnimatePresence, useMotionValue, useTransform, animate as mAnimate } from "framer-motion";
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // 1. เพิ่ม import useRouter
import Login from '../compunets/login';
import Register from '../compunets/register';

export default function Home() {
  const router = useRouter(); // 2. เรียกใช้ hook useRouter
  const [modalOpen, setModalOpen] = useState(false);
  const [isRegisterModal, setIsRegisterModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setIsLoggedIn(true);
      router.push('/');
    }
  }, [router]);

  const handleStartClick = () => {
    if (isLoggedIn) {
      router.push('/schedule'); 
    } else {
      setModalOpen(true);
      setIsRegisterModal(false);
    }
  };

  const handleToggleModal = () => {
    if (modalOpen) {
      setIsClosing(true);
      try { mAnimate(flip, 0, { duration: 0.45, ease: [0.25, 0.8, 0.25, 1] }); } catch {}
      setTimeout(() => {
        setModalOpen(false);
        setIsRegisterModal(false);
        setIsClosing(false);
      }, 350);
      return;
    }
    setModalOpen(true);
    setIsRegisterModal(false);
  };

  const flip = useMotionValue(0);
  const rotateY = useTransform(flip, (v) => `${v * 180}deg`);
  const frontOpacity = useTransform(flip, [0, 0.45, 0.55, 1], [1, 1, 0, 0]);
  const backOpacity = useTransform(flip, [0, 0.45, 0.55, 1], [0, 0, 1, 1]);
  const translateX = useTransform(flip, [0, 0.5, 1], ['0px', '10px', '0px']);

  useEffect(() => {
    mAnimate(flip, isRegisterModal ? 1 : 0, { duration: 0.7, ease: [0.25, 0.8, 0.25, 1] });
  }, [isRegisterModal]);

  const Portal = ({ children }: { children: React.ReactNode }) => {
    if (typeof document === 'undefined') return null;
    return createPortal(children, document.body);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 text-center px-6 overflow-hidden">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="text-3xl md:text-4xl font-bold text-blue-700 mb-6"
      >
        ระบบจัดตารางเรียนออนไลน์
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, delay: 0.6 }}
        className="text-gray-600 max-w-lg mb-8"
      >
        วางแผนตารางเรียนของคุณอย่างมีประสิทธิภาพ —  
        สร้าง แก้ไข และจัดการตารางได้ง่ายในไม่กี่คลิก
      </motion.p>

      <div className="flex space-x-4">
        <motion.button
          onClick={handleStartClick}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-lg shadow-md"
        >
          เริ่มจัดตารางเรียน
        </motion.button>
      </div>

      <Portal>
        <AnimatePresence>
          {modalOpen && (
            <motion.div
              key="modal"
              initial={{ opacity: 0 }}
              animate={isClosing ? { opacity: 0 } : { opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
              onClick={handleToggleModal}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                className="relative w-[400px] h-[450px]"
                style={{ perspective: 1000 }}
              >
                <motion.div
                  style={{ rotateY, transformStyle: 'preserve-3d', transformOrigin: 'center center', x: translateX }}
                  className="relative w-full h-full will-change-transform"
                >
                  <motion.div
                    className="absolute w-full h-full"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(0deg)', opacity: frontOpacity }}
                  >
                    <Login
                      setIsRegister={(v: boolean) => setIsRegisterModal(Boolean(v))}
                      onLoginSuccess={(u: { username: string }) => {
                        setCurrentUser({ username: u.username });
                        setIsLoggedIn(true);
                        setModalOpen(false);
                        try { localStorage.setItem('user', JSON.stringify({ username: u.username })); } catch {}
                      }}
                      setIsOpen={setModalOpen}
                    />
                  </motion.div>

                  <motion.div
                    className="absolute w-full h-full"
                    style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', opacity: backOpacity }}
                  >
                    <Register setIsRegister={setIsRegisterModal} />
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </main>
  );
}