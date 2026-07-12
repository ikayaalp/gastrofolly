import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email ve şifre gereklidir' },
                { status: 400 }
            );
        }

        // Brute-force koruması: hem IP hem e-posta bazında sınırla.
        const ip = getClientIp(request);
        if (!(await checkRateLimit(`mobile-login-ip:${ip}`, RATE_LIMITS.AUTH)).success ||
            !(await checkRateLimit(`mobile-login-email:${email.trim().toLowerCase()}`, RATE_LIMITS.AUTH)).success) {
            return NextResponse.json(
                { message: 'Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin.' },
                { status: 429 }
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

        // Generate a new session ID for concurrent login prevention
        const newSessionId = randomUUID();

        // Update currentSessionId in DB
        await prisma.user.update({
            where: { id: user.id },
            data: { currentSessionId: newSessionId }
        });

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                sessionId: newSessionId,
            },
            process.env.NEXTAUTH_SECRET!,
            { expiresIn: '30d' } // 30 days for mobile
        );

        // Check subscription validity
        const isSubscriptionValid = user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();

        // Return token and user data
        return NextResponse.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
                createdAt: user.createdAt,
                subscriptionPlan: user.subscriptionPlan,
                subscriptionStartDate: user.subscriptionStartDate,
                subscriptionEndDate: user.subscriptionEndDate,
                isSubscriptionValid: isSubscriptionValid,
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
