'use client'
import { useState, FormEvent } from 'react';
import Swal from 'sweetalert2';

export default function Register({ setIsRegister }: { setIsRegister: (value: boolean) => void }) {
  const [password, setpassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setusername] = useState('');
  const [email, setemail] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      Swal.fire({
        title: 'รหัสผ่านไม่ตรงกัน',
        text: 'กรุณากรอกรหัสผ่านและยืนยันรหัสผ่านให้ตรงกัน',
        icon: 'warning',
        confirmButtonText: 'ตกลง'
      });
      return; // หยุดการทำงานถ้าไม่ตรงกัน
    }

    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, username, password }),
      });

      const result = await res.json();
      console.log(result);

      if (res.ok) {
        Swal.fire({
          title: 'สำเร็จ!',
          text: 'สมัครสมาชิกเรียบร้อยแล้ว',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          // ล้างข้อมูลหลังจาก Swal ปิด
          setusername('');
          setpassword('');
          setConfirmPassword(''); // ล้างช่อง confirm password ด้วย
          setemail('');
          // เปลี่ยนกลับไปแสดงหน้า login
          setIsRegister(false);
        });
      } else {
        Swal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: result.message || 'ไม่สามารถสมัครสมาชิกได้',
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
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">สร้างบัญชีใหม่</h1>
        <p className="text-gray-600 text-sm mt-2">กรอกข้อมูลด้านล่างเพื่อสร้างบัญชีของคุณ</p>
      </div>
      <div className="relative z-0 w-full mb-5 group">
        <input type="text" name="username" id="username" 
        value={username}
        onChange={(e) => setusername(e.target.value)}
        className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
        <label htmlFor="username" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Username</label>
      </div>
      <div className="relative z-0 w-full mb-5 group">
        <input type="password" name="password" id="password" 
          value={password}
          onChange={(e) => setpassword(e.target.value)}
        className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
        <label htmlFor="password" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Password</label>
      </div>
      <div className="relative z-0 w-full mb-5 group">
        <input 
          type="password" 
          name="confirmPassword" 
          id="confirmPassword" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" 
          placeholder=" " 
          required 
        />
        <label htmlFor="confirmPassword" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Confirm Password</label>
      </div>
     <div className="relative z-0 w-full mb-5 group">
        <input type="email" name="email" id="email" 
          value={email}
          onChange={(e) => setemail(e.target.value)}
        className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
        <label htmlFor="email" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Email</label>
      </div>

      <div className="mt-8 space-y-6">
        <button type="submit" className="w-full py-3 px-4 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm transition duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-opacity-50">
          สมัครสมาชิก
        </button>
        <p className="text-center text-sm text-gray-500">
          การสมัครสมาชิกถือว่าคุณยอมรับ{" "}
          <a href="#" className="text-blue-600 hover:underline">เงื่อนไขการใช้งาน</a>
          {" "}และ{" "}
          <a href="#" className="text-blue-600 hover:underline">นโยบายความเป็นส่วนตัว</a>
        </p>
      </div>

      <div className="flex justify-center pt-5">
            <p className="text-sm text-gray-600">
              หากมีบัญชีแล้ว{" "}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-blue-600 hover:underline font-medium"
              >
                ล็อกอิน
              </button>
            </p>
          </div>
    </form>
  );
}