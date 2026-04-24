import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
    try {
        // Token'ı başlık (header) kısmından al
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];

        // Token'ı doğrula
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
        } catch (err) {
            return NextResponse.json({ message: 'Geçersiz token' }, { status: 401 });
        }

        const body = await request.json();
        const { isPremium, expirationDate } = body;

        // Kullanıcıyı güncelle
        const updatedUser = await prisma.user.update({
            where: { id: decoded.userId || decoded.id || decoded.sub },
            data: {
                subscriptionPlan: isPremium ? 'Premium' : 'FREE',
                subscriptionEndDate: expirationDate ? new Date(expirationDate) : null,
                subscriptionStartDate: isPremium ? new Date() : null,
            },
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Abonelik durumu güncellendi',
            user: {
                subscriptionPlan: updatedUser.subscriptionPlan,
                subscriptionEndDate: updatedUser.subscriptionEndDate
            }
        });

    } catch (error) {
        console.error('Sync RevenueCat error:', error);
        return NextResponse.json({ message: 'Sunucu hatası' }, { status: 500 });
    }
}
