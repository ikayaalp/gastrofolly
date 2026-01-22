import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
    try {
        // Get token from header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];

        // Verify token (Mobile app JWT)
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
        } catch (err) {
            return NextResponse.json({ message: 'Geçersiz token' }, { status: 401 });
        }

        const userId = decoded.userId;

        // Mevcut kullanıcıyı bul
        const currentUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!currentUser) {
            return NextResponse.json({ message: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        if (!currentUser.subscriptionPlan) {
            return NextResponse.json({ message: 'Aktif aboneliğiniz bulunmuyor' }, { status: 400 });
        }

        if (currentUser.subscriptionCancelled) {
            return NextResponse.json({ message: 'Aboneliğiniz zaten iptal edilmiş' }, { status: 400 });
        }

        // Aboneliği iptal olarak işaretle (dönem sonuna kadar erişim devam eder)
        // Yeni Kural:
        // 1. subscriptionCancelled = true yap
        // 2. subscriptionEndDate'e kadar premium erişim devam eder
        // 3. Dönem sonunda cron job ile subscription temizlenecek
        // 4. Progress kayıtları KORUNUR (dönem sonuna kadar erişim var)
        // 5. Enrollment kayıtları KORUNUR (kursiyer sayısı değişmez)

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                subscriptionCancelled: true
            }
        });

        // Calculate if subscription is still valid (until endDate)
        const isSubscriptionValid = user.subscriptionEndDate
            ? new Date(user.subscriptionEndDate) > new Date()
            : false;

        const endDate = user.subscriptionEndDate
            ? new Date(user.subscriptionEndDate).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            : null;

        return NextResponse.json({
            success: true,
            message: endDate
                ? `Premium üyelik iptal edildi. Premium erişiminiz ${endDate} tarihine kadar devam edecek.`
                : 'Premium üyelik iptal edildi.',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
                subscriptionPlan: user.subscriptionPlan,
                subscriptionStartDate: user.subscriptionStartDate,
                subscriptionEndDate: user.subscriptionEndDate,
                subscriptionCancelled: user.subscriptionCancelled,
                isSubscriptionValid: isSubscriptionValid
            }
        });

    } catch (error) {
        console.error('Subscription cancel error:', error);
        return NextResponse.json({ message: 'İptal işlemi başarısız oldu' }, { status: 500 });
    }
}
