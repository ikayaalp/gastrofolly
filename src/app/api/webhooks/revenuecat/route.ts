import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * RevenueCat Webhook Endpoint
 * 
 * RevenueCat Dashboard → Project Settings → Integrations → Webhooks
 * URL: https://culinora.net/api/webhooks/revenuecat
 * Authorization Header: Bearer <REVENUECAT_WEBHOOK_SECRET>
 * 
 * Bu endpoint, RevenueCat'ten gelen tüm abonelik olaylarını yakalar:
 * - INITIAL_PURCHASE: Yeni satın alma
 * - RENEWAL: Otomatik yenileme
 * - CANCELLATION: İptal
 * - EXPIRATION: Süresi dolma
 * - BILLING_ISSUE: Ödeme sorunu
 * - PRODUCT_CHANGE: Plan değişikliği
 */

// RevenueCat event types that grant premium access
const PREMIUM_EVENTS = [
    'INITIAL_PURCHASE',
    'RENEWAL',
    'UNCANCELLATION',
    'NON_RENEWING_PURCHASE',
    'PRODUCT_CHANGE',
];

// RevenueCat event types that revoke premium access
const REVOKE_EVENTS = [
    'EXPIRATION',
    'BILLING_ISSUE',
];

// Events where user cancelled but still has access until period ends
const CANCELLATION_EVENTS = [
    'CANCELLATION',
];

export async function POST(request: NextRequest) {
    try {
        // 1. Webhook kimlik doğrulaması
        const authHeader = request.headers.get('authorization');
        const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

        if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
            console.warn('[RC Webhook] Unauthorized request');
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // 2. Request body'yi parse et
        const body = await request.json();
        const event = body.event;

        if (!event) {
            return NextResponse.json({ message: 'No event data' }, { status: 400 });
        }

        const eventType = event.type;
        const appUserId = event.app_user_id; // Bu, loginRevenueCat(userId) ile gönderdiğimiz ID
        const expirationAtMs = event.expiration_at_ms;
        const productId = event.product_id;

        console.log(`[RC Webhook] Event: ${eventType} | User: ${appUserId} | Product: ${productId}`);

        // 3. Kullanıcıyı bul
        if (!appUserId || appUserId.startsWith('$RCAnonymousID')) {
            // Anonim kullanıcı — veritabanında yok, yoksay
            console.log('[RC Webhook] Anonymous user, skipping');
            return NextResponse.json({ success: true, message: 'Anonymous user skipped' });
        }

        const user = await prisma.user.findUnique({
            where: { id: appUserId },
        });

        if (!user) {
            console.warn(`[RC Webhook] User not found: ${appUserId}`);
            return NextResponse.json({ success: true, message: 'User not found, skipping' });
        }

        // 4. Event türüne göre işlem yap
        if (PREMIUM_EVENTS.includes(eventType)) {
            // ✅ Premium erişim ver
            const expirationDate = expirationAtMs 
                ? new Date(expirationAtMs) 
                : null;

            // Eğer halihazırda premium değilse, başlangıç tarihi ata
            const startDate = user.subscriptionPlan !== 'Premium' 
                ? new Date() 
                : user.subscriptionStartDate;

            await prisma.user.update({
                where: { id: appUserId },
                data: {
                    subscriptionPlan: 'Premium',
                    subscriptionEndDate: expirationDate,
                    subscriptionStartDate: startDate,
                },
            });

            console.log(`[RC Webhook] ✅ User ${appUserId} → Premium (expires: ${expirationDate?.toISOString() || 'lifetime'})`);

        } else if (REVOKE_EVENTS.includes(eventType)) {
            // ❌ App Store aboneliği sona erdi/ödeme sorunu
            // Ama web'den (Iyzico) geçerli bir abonelik varsa, onu silme!
            const hasWebSubscription = user.subscriptionReferenceCode && 
                user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();

            if (hasWebSubscription) {
                console.log(`[RC Webhook] ⚠️ User ${appUserId} RC expired, but has valid web subscription — keeping Premium.`);
            } else {
                await prisma.user.update({
                    where: { id: appUserId },
                    data: {
                        subscriptionPlan: 'FREE',
                        subscriptionEndDate: null,
                        subscriptionStartDate: null,
                    },
                });
                console.log(`[RC Webhook] ❌ User ${appUserId} → FREE (${eventType})`);
            }

        } else if (CANCELLATION_EVENTS.includes(eventType)) {
            // ⚠️ İptal edildi ama mevcut dönem sonuna kadar erişim devam eder
            // subscriptionPlan'ı Premium olarak bırak, subscriptionEndDate ile kontrol et
            const expirationDate = expirationAtMs 
                ? new Date(expirationAtMs) 
                : user.subscriptionEndDate;

            await prisma.user.update({
                where: { id: appUserId },
                data: {
                    subscriptionEndDate: expirationDate,
                    // Plan hâlâ Premium — süre dolunca checkAccess() false dönecek
                },
            });

            console.log(`[RC Webhook] ⚠️ User ${appUserId} cancelled, access until: ${expirationDate?.toISOString()}`);

        } else {
            console.log(`[RC Webhook] Unhandled event type: ${eventType}`);
        }

        // 5. RevenueCat her zaman 200 bekler
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[RC Webhook] Error:', error);
        // RevenueCat 500'de retry yapar, bu yüzden 200 dönelim
        return NextResponse.json({ success: false, error: 'Internal error' }, { status: 200 });
    }
}
