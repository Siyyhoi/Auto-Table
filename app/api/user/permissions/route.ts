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

    // ถ้าใน Database เก็บเป็น String
    if (typeof allowedPages === 'string') {
        // ลอง parse เป็น JSON ก่อน (กรณีเก็บเป็น JSON string)
        try {
            const parsed = JSON.parse(allowedPages);
            allowedPages = Array.isArray(parsed) ? parsed : [allowedPages];
        } catch {
            // ถ้า parse ไม่ได้ แสดงว่าเป็น plain string
            // ถ้ามี comma ให้ split เป็น array
            if (allowedPages.includes(',')) {
                allowedPages = allowedPages.split(',').map(page => page.trim()).filter(page => page.length > 0);
            } else {
                // ถ้าไม่มี comma ให้แปลงเป็น array เดียว
                allowedPages = [allowedPages.trim()].filter(page => page.length > 0);
            }
        }
    } else if (Array.isArray(allowedPages)) {
        // ถ้าเป็น array อยู่แล้ว ให้ trim แต่ละ element
        allowedPages = allowedPages.map(page => typeof page === 'string' ? page.trim() : page).filter(page => page && page.length > 0);
    } else {

        allowedPages = [];
    }

    return NextResponse.json({
      allowedPages,
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