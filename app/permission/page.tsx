"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Plus, Trash2, Edit2 } from 'lucide-react';
import { getPermissionKey } from '@/lib/permission-config';
import { loadUserPermissions, checkPageAccess } from '@/lib/permission-utils';

interface Permission {
  permission_id: number;
  permission_name: string;
  allow_pages: string[];
}

export default function PermissionPage() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  // ตรวจสอบสิทธิ์การเข้าถึงหน้า
  const checkUserPermission = async () => {
    try {
      setIsCheckingPermission(true);
      const storedUser = localStorage.getItem('user');
      
      if (!storedUser) {
        // ถ้าไม่มี user ให้ redirect กลับหรือไปหน้าแรก
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push('/');
        }
        return;
      }

      const user = JSON.parse(storedUser);
      const allowedPages = await loadUserPermissions(user.username);
      
      // ตรวจสอบว่ามีสิทธิ์เข้าหน้า /permission หรือไม่
      const hasPermissionAccess = checkPageAccess(allowedPages, '/permission');
      
      if (!hasPermissionAccess) {
        // ถ้าไม่มีสิทธิ์ ให้ redirect กลับไปหน้าล่าสุดหรือไปหน้าแรก
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push('/');
        }
        return;
      }
      
      setHasAccess(true);
    } catch (err) {
      console.error('Error checking permission:', err);
      // ถ้าเกิด error ให้ redirect กลับหรือไปหน้าแรก
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/');
      }
      return;
    } finally {
      setIsCheckingPermission(false);
    }
  };

  // ดึงข้อมูล permissions
  const fetchPermissions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/permission');
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setPermissions(data.data || []);
        setError(null);
      } else {
        setError(data.message || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUserPermission();
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchPermissions();
    }
  }, [hasAccess]);

  if (isCheckingPermission) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans ml-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // จะ redirect ไปแล้ว
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans ml-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans ml-20"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-md rounded-lg mb-6 p-4"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold text-black flex items-center gap-2">
            <Shield className="text-blue-600" size={28} />
            จัดการ Permission
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md font-medium flex items-center gap-2"
          >
            <Plus size={20} />
            เพิ่ม Permission
          </motion.button>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4"
        >
          {error}
        </motion.div>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">
                  ลำดับ
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">
                  ชื่อ Permission
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">
                  หน้าที่ได้รับอนุญาติ
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 border-b">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {permissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Shield size={48} className="text-gray-300" />
                      <p>ยังไม่มีข้อมูล Permission</p>
                    </div>
                  </td>
                </tr>
              ) : (
                permissions.map((permission, index) => (
                  <motion.tr
                    key={permission.permission_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield size={18} className="text-blue-600" />
                        <span className="font-medium text-gray-900">
                          {permission.permission_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {permission.allow_pages && permission.allow_pages.length > 0 ? (
                          permission.allow_pages.map((page, pageIndex) => (
                            <span
                              key={pageIndex}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                            >
                              {page}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">ไม่มีหน้าที่ได้รับอนุญาติ</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

