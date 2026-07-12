import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { claimWebhookEvent, hashPayload } from '@/lib/webhookIdempotency';

/**
 * Iyzico bu endpoint'e imza göndermiyor (Stripe/RevenueCat'in aksine). Bu yüzden
 * IYZICO_WEBHOOK_SECRET tanımlıysa, Iyzico panelindeki webhook URL'sinin sonuna
 * eklenen ?secret=<deger> ile eşleşme aranır. Env değişkeni henüz set edilmediyse
 * (bootstrap aşaması) istek reddedilmez — mevcut davranış korunur, ama set
 * edildiği andan itibaren eşleşmeyen istekler reddedilir.
 * ÖNEMLİ: Bu korumanın devreye girmesi için hem .env'de IYZICO_WEBHOOK_SECRET
 * tanımlanmalı hem de Iyzico merchant panelindeki webhook URL'si
 * https://.../api/webhooks/iyzico?secret=<AYNI_DEGER> şeklinde güncellenmeli.
 */
export async function POST(request: NextRequest) {
    try {
        const webhookSecret = process.env.IYZICO_WEBHOOK_SECRET;
        if (webhookSecret) {
            const providedSecret = request.nextUrl.searchParams.get('secret');
            if (providedSecret !== webhookSecret) {
                console.warn('[Iyzico Webhook] Unauthorized request (secret mismatch)');
                return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
            }
        } else {
            console.warn('[Iyzico Webhook] IYZICO_WEBHOOK_SECRET tanımlı değil — istek doğrulanmadan kabul ediliyor.');
        }

        const body = await request.json();
        console.log('[Iyzico Webhook] Received payload:', body);

        const eventType = body.iyziEventType;
        const subscriptionReferenceCode = body.subscriptionReferenceCode;

        if (!subscriptionReferenceCode) {
            console.log('[Iyzico Webhook] Missing subscriptionReferenceCode');
            return NextResponse.json({ success: false, message: 'Missing subscriptionReferenceCode' }, { status: 400 });
        }

        // Iyzico ayni event'i birden fazla kez teslim edebilir (retry). Bu
        // payload'da bize ait, garanti benzersiz bir event id alanı olmadığı
        // için tüm body'nin hash'i deterministik dedupe anahtarı olarak
        // kullanılıyor — aynı olay tekrar gelirse body de aynı olacağından
        // hash de aynı olur.
        const isNewEvent = await claimWebhookEvent('iyzico', hashPayload(body));
        if (!isNewEvent) {
            console.log('[Iyzico Webhook] Duplicate event ignored');
            return NextResponse.json({ success: true, duplicate: true });
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
            
            switch (user.subscriptionBillingPeriod) {
                case 'YEARLY': newEndDate.setFullYear(newEndDate.getFullYear() + 1); break;
                case 'SIXMONTHLY': newEndDate.setMonth(newEndDate.getMonth() + 6); break;
                default: newEndDate.setMonth(newEndDate.getMonth() + 1); // MONTHLY veya bilinmiyorsa
            }

            // Abonelik guncellemesi + odeme kaydi tek transaction'da: biri
            // basarisiz olursa hicbiri uygulanmaz.
            await prisma.$transaction(async (tx) => {
                await tx.user.update({
                    where: { id: user.id },
                    data: {
                        subscriptionEndDate: newEndDate,
                        subscriptionCancelled: false, // Eğer iptal edip geri açtıysa düzelt
                        subscriptionPlan: 'Premium'
                    }
                });

                // Ödeme kaydı da oluştur (isteğe bağlı, admin panelindeki istatistikler için)
                await tx.payment.create({
                    data: {
                        userId: user.id,
                        amount: 0, // Webhook'ta miktar gelmiyorsa 0, veya plan türüne göre sabit miktar yazılabilir
                        currency: 'TRY',
                        status: 'COMPLETED',
                        subscriptionPlan: 'Premium'
                    }
                });
            });

            console.log(`[Iyzico Webhook] ✅ User ${user.id} subscription extended to ${newEndDate}`);
            
        } else if (eventType === 'subscription.order.failure') {
            console.log(`[Iyzico Webhook] ❌ Failure event for user ${user.id}`);
            
            const now = new Date();
            const isExpired = !user.subscriptionEndDate || user.subscriptionEndDate <= now;

            if (!isExpired) {
                // Dönem hâlâ geçerliyse, iptal olarak işaretle ama alanları null yapma
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        subscriptionCancelled: true
                    }
                });
                console.log(`[Iyzico Webhook] User ${user.id} payment failed, subscription set to cancelled (period still active)`);
            } else {
                // Ödeme başarısız olduysa ve süre gerçekten dolmuşsa aboneliği tamamen sonlandır
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        subscriptionPlan: null,
                        subscriptionBillingPeriod: null,
                        subscriptionStartDate: null,
                        subscriptionEndDate: null,
                        subscriptionReferenceCode: null,
                        subscriptionCancelled: false
                    }
                });
                console.log(`[Iyzico Webhook] User ${user.id} subscription removed due to payment failure and expiration`);
            }
        } else {
            console.log(`[Iyzico Webhook] Unhandled event type: ${eventType}`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Iyzico Webhook] Error processing webhook:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
