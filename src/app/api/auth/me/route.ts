import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
    try {
        // Get token from header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
        } catch (err) {
            return NextResponse.json({ message: 'Geçersiz token' }, { status: 401 });
        }

        // Fetch user from DB
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                createdAt: true,
                subscriptionPlan: true,
                subscriptionStartDate: true,
                subscriptionEndDate: true,
            }
        });

        if (!user) {
            return NextResponse.json({ message: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        // ⚠️ Süresi dolmuş aboneliği temizle (Lazy cleanup)
        if (user.subscriptionPlan === 'Premium' && user.subscriptionEndDate && new Date(user.subscriptionEndDate) < new Date()) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    subscriptionPlan: 'FREE',
                    subscriptionStartDate: null,
                    subscriptionEndDate: null
                }
            });
            user.subscriptionPlan = 'FREE';
            user.subscriptionStartDate = null;
            user.subscriptionEndDate = null;
            console.log(`[Lazy Cleanup] User ${user.id} subscription expired. Updated DB to FREE.`);
        }

        // Check subscription validity
        const isSubscriptionValid = user.subscriptionPlan === 'Premium' && 
            (!user.subscriptionEndDate || new Date(user.subscriptionEndDate) > new Date());

        return NextResponse.json({
            user: {
                ...user,
                isSubscriptionValid
            }
        });

    } catch (error) {
        console.error('Me endpoint error:', error);
        return NextResponse.json({ message: 'Sunucu hatası' }, { status: 500 });
    }
}
