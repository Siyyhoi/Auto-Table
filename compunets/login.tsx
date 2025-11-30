"use client";
import axios from 'axios';
import { useState } from 'react';
import Swal from 'sweetalert2';

type LoginSuccessUser = { username: string; token?: string };

export default function Login({ setIsRegister, onLoginSuccess, setIsOpen }: { setIsRegister: (value: boolean) => void; onLoginSuccess: (user: LoginSuccessUser) => void; setIsOpen: (value: boolean) => void }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setMessage("");

            const res = await axios.post('/api/user/login', {
                username,
                password
            });
            const result = await res.data as { user?: { username?: string }; message?: string };
            if (res.status === 200 && result.user?.username) {
                Swal.fire({
                  title: 'สำเร็จ!',
                  text: 'เข้าสู่ระบบเรียบร้อยแล้ว',
                  icon: 'success',
                  timer: 2000,
                  showConfirmButton: false
                }).then(() => {
                  // ล้างข้อมูลหลังจาก Swal ปิด
                  setUsername('');
                  setPassword('');
                  // เรียกใช้ callback เพื่อส่งข้อมูลผู้ใช้กลับไป (token ถูกเก็บใน HttpOnly cookie โดย server)
                  const userData: LoginSuccessUser = { username: result.user?.username || "" };
                  onLoginSuccess(userData);
                  // ไม่ต้องบันทึก token ใน localStorage เพราะใช้ HttpOnly cookie
                  localStorage.setItem('user', JSON.stringify({ username: userData.username }));

                  // ปิด modal
                  setIsOpen(false);
                });
              } else {
                Swal.fire({
                  title: 'เกิดข้อผิดพลาด',
                  text: result.message || 'ไม่สามารถเข้าสู่ระบบได้',
                  icon: 'error',
                  confirmButtonText: 'ตกลง'
                });
              }
            } catch (error) {
              const err = error as Error;
              Swal.fire({
                title: 'ข้อผิดพลาดของระบบ',
                text: err.message,
                icon: 'error',
                confirmButtonText: 'ตกลง'
              });
            } finally {
              setLoading(false);
            }
    }

    return (
      <div className="flex items-center justify-center">
  <form onSubmit={handleSubmit} className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">เข้าสู่ระบบ</h1>
            <p className="text-gray-600 text-sm mt-2">ยินดีต้อนรับกลับ! กรุณาลงชื่อเข้าใช้เพื่อดำเนินการต่อ</p>
          </div>

          <div className="relative flex items-center justify-center">
              <div className="absolute w-full border-t border-gray-300"></div>
              <div className="relative bg-white px-4">
                <span className="text-sm text-gray-500">หรือ</span>
              </div>
            </div>
  
          <div className="relative z-0 w-full mb-5 group">
            <input
              type="username"
              name="floating_username"
              id="floating_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              placeholder=" "
              required
            />
            <label
              htmlFor="floating_username"
              className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              ชื่อผู้ใช้
            </label>
          </div>
  
          <div className="relative z-0 w-full mb-5 group">
            <input
              type="password"
              name="floating_password"
              id="floating_password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              placeholder=" "
              required
            />
            <label
              htmlFor="floating_password"
              className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              รหัสผ่าน
            </label>
          </div>
  
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                จดจำฉันไว้
              </label>
            </div>
            <a href="#" className="text-sm text-blue-600 hover:underline">
              ลืมรหัสผ่าน?
            </a>
          </div>
  
          <div className="space-y-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm transition duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
  
  
          <div className="flex justify-center">
            <p className="text-sm text-gray-600">
              ยังไม่มีบัญชี?{" "}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-blue-600 hover:underline font-medium"
              >
                สมัครสมาชิก
              </button>
            </p>
          </div>
          </div>
        </form>
      </div>
    );
  }