import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isPremiumUser } from '@/lib/subscription';
import { getAuthUser } from '@/lib/mobileAuth';

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { isPremium, expirationDate } = body;

        const userId = authUser.id;
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return NextResponse.json({ message: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        // ⚠️ CRITICAL: Web'den gelen abonelikleri korumak için,
        // RevenueCat "premium değil" dediğinde mevcut veritabanı değerini EZMİYORUZ.
        // Sadece RevenueCat premium diyorsa → DB'yi güncelle.
        // RC premium değilse → DB'deki mevcut aboneliğe dokunma.

        // Mevcut DB'de geçerli bir abonelik var mı kontrol et
        const hasExistingValidSubscription = isPremiumUser(existingUser);

        if (!isPremium && hasExistingValidSubscription) {
            // RevenueCat premium değil AMA veritabanında geçerli bir abonelik var (web'den alınmış olabilir)
            // Bu durumda HİÇBİR ŞEY YAPMA — mevcut aboneliği koru
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
                subscriptionPlan: isPremium ? 'Premium' : (hasExistingValidSubscription ? existingUser.subscriptionPlan : null),
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
        console.error('Sync RevenueCat error:', error);
        return NextResponse.json({ message: 'Sunucu hatası' }, { status: 500 });
    }
}
