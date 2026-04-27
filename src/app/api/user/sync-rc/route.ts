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

        const userId = decoded.userId || decoded.id || decoded.sub;
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return NextResponse.json({ message: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        // Mevcut DB'de geçerli bir abonelik var mı kontrol et
        const hasExistingValidSubscription = existingUser.subscriptionPlan === 'Premium' &&
            (!existingUser.subscriptionEndDate || new Date(existingUser.subscriptionEndDate) > new Date());

        if (!isPremium && hasExistingValidSubscription) {
            // RevenueCat premium değil AMA veritabanında geçerli bir abonelik var (web'den alınmış)
            // Mevcut aboneliği koru, ezme
            console.log(`[sync-rc] RC says not premium, but user ${userId} has valid DB subscription — keeping it.`);
            return NextResponse.json({ 
                success: true, 
                message: 'Mevcut web aboneliği korundu',
                user: {
                    subscriptionPlan: existingUser.subscriptionPlan,
                    subscriptionEndDate: existingUser.subscriptionEndDate
                }
            });
        }

        let newStartDate = existingUser.subscriptionStartDate;
        if (isPremium && existingUser.subscriptionPlan !== 'Premium') {
            newStartDate = new Date();
        } else if (!isPremium && !hasExistingValidSubscription) {
            newStartDate = null;
        }

        let newEndDate = existingUser.subscriptionEndDate;
        if (isPremium) {
            if (expirationDate) {
                newEndDate = new Date(expirationDate);
            } else if (!existingUser.subscriptionEndDate || new Date(existingUser.subscriptionEndDate) < new Date()) {
                const fallbackDate = new Date();
                fallbackDate.setMonth(fallbackDate.getMonth() + 1);
                newEndDate = fallbackDate;
            }
        } else if (!hasExistingValidSubscription) {
            newEndDate = null;
        }

        // Kullanıcıyı güncelle
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                subscriptionPlan: isPremium ? 'Premium' : (hasExistingValidSubscription ? existingUser.subscriptionPlan : 'FREE'),
                subscriptionEndDate: newEndDate,
                subscriptionStartDate: newStartDate,
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
        console.error('Sync RC error:', error);
        return NextResponse.json({ message: 'Sunucu hatası' }, { status: 500 });
    }
}
