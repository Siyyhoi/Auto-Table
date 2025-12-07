import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

interface PermissionBody {
  permission_name: string;
  allow_pages: string[];
}

// GET - ดึงข้อมูล permissions ทั้งหมด
export async function GET(req: NextRequest) {
  try {
    const permissions = await prisma.permissions.findMany({
      orderBy: {
        permission_id: 'asc'
      }
    });

    // แปลง allow_pages จาก JSON string เป็น array
    const formattedPermissions = permissions.map(permission => {
      let allowPages = permission.allow_pages;
      
      // ถ้าเป็น string ให้ลอง parse
      if (typeof allowPages === 'string') {
        try {
          // ลอง parse เป็น JSON ก่อน
          const parsed = JSON.parse(allowPages);
          allowPages = Array.isArray(parsed) ? parsed : allowPages;
        } catch {
          // ถ้า parse ไม่ได้ แสดงว่าเป็น plain string
          // ถ้ามี comma ให้ split เป็น array
          if (allowPages.includes(',')) {
            allowPages = allowPages.split(',').map(page => page.trim()).filter(page => page.length > 0);
          } else {
            // ถ้าไม่มี comma ให้แปลงเป็น array เดียว
            allowPages = [allowPages.trim()].filter(page => page.length > 0);
          }
        }
      } else if (Array.isArray(allowPages)) {
        // ถ้าเป็น array อยู่แล้ว ให้ trim แต่ละ element
        allowPages = allowPages.map(page => typeof page === 'string' ? page.trim() : page).filter(page => page && (typeof page === 'string' ? page.length > 0 : true));
      } else {
        allowPages = [];
      }
      
      return {
        permission_id: permission.permission_id,
        permission_name: permission.permission_name,
        allow_pages: allowPages
      };
    });

    return NextResponse.json(
      {
        status: 'success',
        data: formattedPermissions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Permission fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - สร้าง permission ใหม่
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PermissionBody;

    if (!body?.permission_name || !body?.allow_pages) {
      return NextResponse.json(
        { message: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    const permission = await prisma.permissions.findFirst({
      where: { permission_name: body.permission_name },
    });

    if (permission) {
      return NextResponse.json(
        { message: 'Permission already exists' },
        { status: 409 }
      );
    }

    await prisma.permissions.create({
      data: {
        permission_name: body.permission_name,
        allow_pages: JSON.stringify(body.allow_pages)
      },
    });

    return NextResponse.json(
      {
        status: 'success',
        message: 'Permission created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Permission creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
