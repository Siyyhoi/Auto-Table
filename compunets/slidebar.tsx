"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, useTransform, animate as mAnimate } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  ClipboardClock,
  HelpCircle,
  LogIn,
  User,
} from 'lucide-react';
import Swal from 'sweetalert2'; 
import Login from './login';
import Register from './register';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isRegisterModal, setIsRegisterModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
    loadUserPermissions();
  }, []);

  const loadUserPermissions = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setAllowedPages([]);
        setCurrentUser(null); // เพิ่มความชัวร์ว่า state เป็น null ถ้าไม่มีใน storage
        return;
      }

      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setLoading(true);

      const response = await fetch('/api/user/permissions', {
        headers: {
          'x-username': user.username,
          'x-user-id': '1',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Permission Data from API:", data);
        setAllowedPages(data.allowedPages || []);
      } else {
        setAllowedPages([]);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      setAllowedPages([]);
    } finally {
      setLoading(false);
    }
  };

  // 3. เพิ่มฟังก์ชัน Logout
  const handleLogout = () => {
    Swal.fire({
      title: 'ต้องการออกจากระบบ?',
      text: "คุณต้องการออกจากบัญชีนี้ใช่หรือไม่",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ใช่, ออกจากระบบ',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        // ล้างข้อมูล
        localStorage.removeItem('user');
        // localStorage.removeItem('token'); // อย่าลืมลบ token ด้วยถ้ามี
        
        // Reset State
        setCurrentUser(null);
        setAllowedPages([]);

        Swal.fire({
            title: 'ออกจากระบบสำเร็จ',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
        
        // Optional: window.location.reload(); // ถ้าระบบรวนให้เปิดบรรทัดนี้เพื่อรีโหลดหน้า
      }
    });
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

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

    const allMenuItems = [
    { name: 'Dashboard', href: '/', icon: <LayoutDashboard size={22} /> },
    { name: 'Schedule', href: '/schedule', icon: <ClipboardClock size={22} /> },
    { name: 'Help', href: '/help', icon: <HelpCircle size={22} /> },
    ];

    const conditionallyHidden = ['/schedule'];

    const menuItems = allMenuItems.filter((item) => {
    if (conditionallyHidden.includes(item.href)) {
        return allowedPages.includes(item.href);
    }
    return true;
    });

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl transition-all duration-500 ease-in-out z-50 flex flex-col justify-between ${
        isOpen ? 'w-64' : 'w-20'
      } ${isInitialized ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-4 top-8 bg-gray-800 p-2 rounded-full hover:bg-gray-700 transform transition-transform hover:scale-110 text-xl w-10 h-10 flex items-center justify-center shadow-lg border border-gray-700"
      >
        {isOpen ? '◀' : '▶'}
      </button>

      {/* Logo Section */}
      <div className="p-6 flex items-center justify-center">
        <h1
          className={`text-2xl font-semibold transition-all duration-500 font-kanit ${
            isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5'
          }`}
        >
          Menu
        </h1>
      </div>

      {/* Modal */}
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
                  {/* Front face (Login) */}
                  <motion.div
                    className="absolute w-full h-full"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(0deg)', opacity: frontOpacity }}
                  >
                    <Login
                      setIsRegister={(v: boolean) => setIsRegisterModal(Boolean(v))}
                      onLoginSuccess={(u: { username: string }) => {
                        // อัปเดต State ทันทีที่ Login สำเร็จ (หน้าเว็บจะเปลี่ยนทันทีโดยไม่ต้อง Refresh)
                        setCurrentUser(u);
                        try { localStorage.setItem('user', JSON.stringify(u)); } catch {} // บันทึก u ทั้งก้อนแทน
                        loadUserPermissions();
                        setModalOpen(false);
                      }}
                      setIsOpen={setModalOpen}
                    />
                  </motion.div>

                  {/* Back face (Register) */}
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

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li
              key={item.name}
              className={`transition-all duration-300 ${
                isInitialized ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <Link
                href={item.href}
                className="group flex items-center gap-4 p-3 rounded-xl hover:bg-gray-700/70 transition-all duration-300 hover:shadow-md"
              >
                <div className="text-gray-300 group-hover:text-white transition-all duration-300 transform group-hover:scale-110">
                  {item.icon}
                </div>
                <span
                  className={`text-sm font-medium transition-all duration-500 ease-in-out font-prompt
                    ${isOpen ? 'opacity-100 translate-x-0 delay-200' : 'opacity-0 -translate-x-3 delay-0'}
                    ${!isOpen && 'pointer-events-none'}
                  `}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* 4. Login / User Section (Modified) */}
      <div className="border-t border-gray-700 p-4">
        {currentUser ? (
             // === กรณีล็อกอินแล้ว: แสดงชื่อ + กดแล้ว Logout ===
            <button
            onClick={handleLogout}
            className="group flex items-center gap-4 p-3 rounded-xl hover:bg-red-500/20 transition-all duration-300 hover:shadow-md w-full text-left"
            >
            <div className="text-blue-400 group-hover:text-red-400 transition-all duration-300 transform group-hover:scale-110">
                <User size={22} />
            </div>
            <span
                className={`text-sm font-medium transition-all duration-500 ease-in-out font-prompt truncate text-blue-200 group-hover:text-red-300
                ${isOpen ? 'opacity-100 translate-x-0 delay-200' : 'opacity-0 -translate-x-3 delay-0'}
                ${!isOpen && 'pointer-events-none'}
                `}
            >
                {currentUser.username}
            </span>
            </button>
        ) : (
             // === กรณียังไม่ล็อกอิน: แสดงปุ่ม Login เดิม ===
            <button
            onClick={() => { setModalOpen(true); setIsRegisterModal(false); }}
            className="group flex items-center gap-4 p-3 rounded-xl hover:bg-gray-700/70 transition-all duration-300 hover:shadow-md w-full text-left"
            >
            <div className="text-gray-300 group-hover:text-white transition-all duration-300 transform group-hover:scale-110">
                <LogIn size={22} />
            </div>
            <span
                className={`text-sm font-medium transition-all duration-500 ease-in-out font-prompt
                ${isOpen ? 'opacity-100 translate-x-0 delay-200' : 'opacity-0 -translate-x-3 delay-0'}
                ${!isOpen && 'pointer-events-none'}
                `}
            >
                เข้าสู่ระบบ
            </span>
            </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;