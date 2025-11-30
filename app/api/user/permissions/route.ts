import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const username = request.headers.get('x-username');

    if (!username) {
      return NextResponse.json({ allowedPages: [] }, { status: 401 });
    }

    // 1. ค้นหา User เพื่อดูว่าเขามี role ชื่อว่าอะไร (เช่น 'USERS')
    const user = await prisma.users.findFirst({
      where: { username: username },
    });

    if (!user || !user.role) {
      return NextResponse.json({ allowedPages: [] }, { status: 404 });
    }

    // 2. เอาชื่อ Role ที่ได้ ไปค้นหาในตาราง Permissions (หรือ Role)
    // *** ต้องเช็คชื่อ Model ใน schema.prisma ว่าชื่อ permissions หรือ roles ***
    // สมมติว่าชื่อ permissions (ตามรูปที่มี permission_name)
    const permissionRecord = await prisma.permissions.findFirst({
      where: { 
        permission_name: user.role // ค้นหาด้วยคำว่า "USERS"
      },
    });

    if (!permissionRecord) {
      return NextResponse.json({ allowedPages: [] });
    }

    // 3. จัดการข้อมูล allow_pages (แปลงให้เป็น Array เสมอ)
    let allowedPages = permissionRecord.allow_pages;

    // ถ้าใน Database เก็บเป็น String ตัวเดียว เช่น "/schedule" ให้แปลงเป็น Array ["/schedule"]
    if (typeof allowedPages === 'string') {
        allowedPages = [allowedPages]; 
    } else if (!Array.isArray(allowedPages)) {
        // กรณีเป็น null หรือ format ผิด
        allowedPages = [];
    }

    return NextResponse.json({
      allowedPages, // ส่งกลับเป็น Array เช่น ["/schedule"]
      success: true,
    });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error', allowedPages: [] },
      { status: 500 }
    );
  }
}