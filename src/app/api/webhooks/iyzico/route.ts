import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('[Iyzico Webhook] Received payload:', body);

        const eventType = body.iyziEventType;
        const subscriptionReferenceCode = body.subscriptionReferenceCode;

        if (!subscriptionReferenceCode) {
            console.log('[Iyzico Webhook] Missing subscriptionReferenceCode');
            return NextResponse.json({ success: false, message: 'Missing subscriptionReferenceCode' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: { subscriptionReferenceCode }
        });

        if (!user) {
            console.log(`[Iyzico Webhook] User not found for ref: ${subscriptionReferenceCode}`);
            return NextResponse.json({ success: true, message: 'User not found, ignoring' });
        }

        if (eventType === 'subscription.order.success') {
            console.log(`[Iyzico Webhook] Success event for user ${user.id}`);
            
            // Kullanıcının mevcut endDate'i geçerliyse onun üzerine ekle, yoksa bugünden itibaren ekle
            const currentDate = new Date();
            let newEndDate = new Date();
            
            // Eğer hala aktifse, mevcut bitiş tarihinden itibaren 1 ay uzat (veya plan bazlı). Değilse bugünden 1 ay.
            if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) > currentDate) {
                newEndDate = new Date(user.subscriptionEndDate);
            }
            
            // Varsayılan olarak 1 ay uzatıyoruz (Eğer yıllık plan varsa burada iyileştirme yapılabilir)
            if (user.subscriptionPlan === 'EXECUTIVE') {
                newEndDate.setMonth(newEndDate.getMonth() + 6);
            } else {
                newEndDate.setMonth(newEndDate.getMonth() + 1);
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    subscriptionEndDate: newEndDate,
                    subscriptionCancelled: false, // Eğer iptal edip geri açtıysa düzelt
                    subscriptionPlan: user.subscriptionPlan || 'Premium'
                }
            });

            // Ödeme kaydı da oluştur (isteğe bağlı, admin panelindeki istatistikler için)
            await prisma.payment.create({
                data: {
                    userId: user.id,
                    amount: 0, // Webhook'ta miktar gelmiyorsa 0, veya plan türüne göre sabit miktar yazılabilir
                    currency: 'TRY',
                    status: 'COMPLETED',
                    subscriptionPlan: user.subscriptionPlan || 'Premium'
                }
            });

            console.log(`[Iyzico Webhook] ✅ User ${user.id} subscription extended to ${newEndDate}`);
            
        } else if (eventType === 'subscription.order.failure') {
            console.log(`[Iyzico Webhook] ❌ Failure event for user ${user.id}`);
            
            // Ödeme başarısız olduysa aboneliği sonlandır veya iptal olarak işaretle
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    subscriptionPlan: null,
                    subscriptionStartDate: null,
                    subscriptionEndDate: null,
                    subscriptionReferenceCode: null,
                    subscriptionCancelled: false
                }
            });
            console.log(`[Iyzico Webhook] User ${user.id} subscription removed due to payment failure`);
        } else {
            console.log(`[Iyzico Webhook] Unhandled event type: ${eventType}`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Iyzico Webhook] Error processing webhook:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
