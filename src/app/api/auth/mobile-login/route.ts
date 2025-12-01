import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email ve şifre gereklidir' },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Geçersiz email veya şifre' },
                { status: 401 }
            );
        }

        // Check password
        if (!user.password) {
            return NextResponse.json(
                { message: 'Geçersiz email veya şifre' },
                { status: 401 }
            );
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return NextResponse.json(
                { message: 'Geçersiz email veya şifre' },
                { status: 401 }
            );
        }

        // Check email verification
        if (!user.emailVerified) {
            return NextResponse.json(
                { message: 'Email adresiniz doğrulanmamış' },
                { status: 403 }
            );
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
            },
            process.env.NEXTAUTH_SECRET!,
            { expiresIn: '30d' } // 30 days for mobile
        );

        // Return token and user data
        return NextResponse.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
            },
        });
    } catch (error) {
        console.error('Mobile login error:', error);
        return NextResponse.json(
            { message: 'Giriş yapılırken bir hata oluştu' },
            { status: 500 }
        );
    }
}
