import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/mobileAuth';
import { cancelSubscription } from '@/lib/iyzico';

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
        }

        const userId = authUser.id;

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

        // ⚠️ IAP (App Store / Play) aboneliği server-side iptal EDİLEMEZ. Aksi halde
        // kullanıcı "iptal ettim" sanır ama mağaza tahsilata devam eder. Bu tür
        // abonelikler (referenceCode yok = Iyzico değil) yalnızca mağaza abonelik
        // ayarlarından iptal edilir.
        if (!currentUser.subscriptionReferenceCode) {
            return NextResponse.json(
                { message: 'Bu abonelik App Store veya Google Play üzerinden başlatılmış. Lütfen iptal işlemini telefonunuzun abonelik ayarlarından yapın.' },
                { status: 400 }
            );
        }

        if (currentUser.subscriptionCancelled) {
            return NextResponse.json({ message: 'Aboneliğiniz zaten iptal edilmiş' }, { status: 400 });
        }

        // İyzico tarafında iptal işlemini yap (eğer iyzico aboneliği ise)
        if (currentUser.subscriptionReferenceCode) {
            try {
                const cancelResult = await cancelSubscription(currentUser.subscriptionReferenceCode);
                console.log(`[Mobile Cancel] Iyzico iptal sonucu:`, cancelResult.status);
            } catch (err) {
                console.error(`[Mobile Cancel] Iyzico iptal hatası:`, err);
                // Iyzico'da zaten iptal edilmiş veya bulunamamış olabilir, işlemi durdurma
            }
        }

        // Abonelik dönem süresi kontrol et
        const isExpired = !currentUser.subscriptionEndDate ||
            (currentUser.subscriptionEndDate && new Date(currentUser.subscriptionEndDate) <= new Date())

        let user;
        if (isExpired) {
            // Süre zaten dolmuş - hemen FREE'ye çevir
            user = await prisma.user.update({
                where: { id: userId },
                data: {
                    subscriptionPlan: null,
                    subscriptionStartDate: null,
                    subscriptionEndDate: null,
                    subscriptionReferenceCode: null,
                    subscriptionCancelled: false,
                }
            });
            console.log(`[Mobile Cancel] ✅ User ${userId} → FREE (süre zaten dolmuş)`);
        } else {
            // Süre hâlâ geçerli - dönem sonuna kadar erişim devam etsin
            user = await prisma.user.update({
                where: { id: userId },
                data: {
                    subscriptionCancelled: true
                }
            });
            console.log(`[Mobile Cancel] ⚠️ User ${userId} → Cancelled (erişim ${currentUser.subscriptionEndDate} tarihine kadar devam eder)`);
        }

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
