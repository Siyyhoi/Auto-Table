import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // ลองดึงจาก token ก่อน
    const token = request.cookies.get('token')?.value;
    
    if (token) {
      try {
        const jwtSecret = process.env.JWT_SECRET || 'mysecret';
        const decoded = verify(token, jwtSecret) as { userId?: number; username?: string };
        
        if (decoded.userId) {
          return NextResponse.json({ userId: decoded.userId, username: decoded.username });
        }
      } catch (error) {
        // Token invalid, fallback to username
      }
    }

    // Fallback: ดึงจาก username ใน header
    const username = request.headers.get('x-username');
    
    if (username) {
      const user = await prisma.users.findFirst({
        where: { username },
        select: { user_id: true, username: true }
      });

      if (user) {
        return NextResponse.json({ userId: user.user_id, username: user.username });
      }
    }

    return NextResponse.json({ userId: null, username: null }, { status: 401 });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

