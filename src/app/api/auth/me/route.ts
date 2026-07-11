import { NextRequest, NextResponse } from 'next/server';
import { isPremiumUser, lazyCleanupExpiredSubscription } from '@/lib/subscription';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/mobileAuth';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Fetch user from DB
        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
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
        await lazyCleanupExpiredSubscription(prisma, user);

        // Check subscription validity
        const isSubscriptionValid = isPremiumUser(user);

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
