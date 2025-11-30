import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

interface LoginBody {
    username: string;
    password: string;
}

export async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      const hashPassword = createHash('sha256').update(body.password).digest('hex');
  
      const user = await prisma.users.findFirst({
        where: { username: body.username },
      });
  
      if (!user || user.password !== hashPassword) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }
  
      // สร้าง JWT
      const jwtSecret = process.env.JWT_SECRET || 'mysecret';
      const token = sign({ userId: user.user_id, username: user.username }, jwtSecret, {
        expiresIn: '1h',
      });
  
      // ส่ง token กลับไปใน cookie (HttpOnly)
      const response = NextResponse.json({
        message: 'Login successful',
        user: { username: user.username },
      });
  
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60,
        path: '/',
      });
  
      return response;
    } catch (error) {
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  }