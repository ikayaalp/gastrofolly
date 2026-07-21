# Ödeme Sistemleri Haritası

Üç ödeme sistemi paralel çalışır; hepsi sonuçta `User` üzerindeki abonelik alanlarını ve/veya `Payment` + `Enrollment` kayıtlarını günceller.

## User üzerindeki abonelik alanları
`subscriptionPlan` ('Premium' | null), `subscriptionStartDate`, `subscriptionEndDate`, `subscriptionBillingPeriod` (MONTHLY/SIXMONTHLY/YEARLY), `subscriptionReferenceCode` (Iyzico), `subscriptionCancelled`, `currentSessionId` (tek cihaz), RC tarafında `appUserId` eşlemesi.

Erişim kontrolü: `isPremiumUser()` (`src/lib/subscription.ts`) — plan 'Premium' VE endDate gelecekte (null endDate premium sayılır). Süresi dolanlar `lazyCleanupExpiredSubscription` (her mobil auth'ta) + `api/cron/cleanup-subscriptions` (vercel.json cron) ile temizlenir.

## 1. Stripe — web tek seferlik kurs satın alma
- Akış: `cart` → `api/checkout` (Stripe Checkout Session; indirim `api/discount/validate`, referral `api/referral/validate`) → Stripe hosted page → `api/webhooks/stripe`.
- Webhook event'leri: `checkout.session.completed` (Payment kaydı + Enrollment oluşturur, referral komisyonu işler), `payment_intent.payment_failed`.
- Lib: `src/lib/stripe.ts`. Test: `api/checkout/route.test.ts`, `api/webhooks/stripe/route.test.ts`.

## 2. Iyzico — web TR abonelik (Premium)
- Akış: `subscription` sayfası → `api/iyzico/subscribe-non3d` (kart formu `components/checkout/CustomCardForm.tsx`) → başarılıysa User abonelik alanları set edilir; `api/iyzico/callback` 3DS dönüşü için.
- **Bilinen borç**: ilk tahsilat non-3D; hosted-form 3DS'e geçiş launch öncesine ertelendi (2026-07-16 kararı, yarı kurulu durumda).
- Yenileme webhook'u: `api/webhooks/iyzico` — `subscription.order.success` (endDate'i perioda göre uzatır: MONTHLY +1 ay, SIXMONTHLY +6 ay, YEARLY +1 yıl; Payment kaydı ekler), `subscription.order.failure`.
- İptal: `api/iyzico/cancel-subscription` (`subscriptionCancelled=true`, dönem sonuna kadar erişim sürer).
- Lib: `src/lib/iyzico.ts`. Test: `api/iyzico/callback/route.test.ts`.

## 3. RevenueCat — mobil IAP (App Store / Play)
- Mobil taraf: `mobile-app/src/api/revenueCatService.js` (satın alma/paywall), login/logout'ta RC kullanıcı eşleme.
- Sunucu senkron: `api/user/sync-revenuecat` (client tetikler) + asıl kaynak `api/webhooks/revenuecat`:
  - PREMIUM_EVENTS (INITIAL_PURCHASE, RENEWAL, UNCANCELLATION...) → Premium set; INITIAL_PURCHASE/RENEWAL'da Payment kaydı (store'a göre Apple/Google ayrımı).
  - REVOKE_EVENTS (EXPIRATION, REFUND...) → anında FREE'ye düşür.
  - CANCELLATION → `cancel_reason === 'CUSTOMER_SUPPORT'` ise iade gibi işlenir (anında düşür), normal iptalse dönem sonuna kadar erişim + `subscriptionCancelled=true` (UI "iptal edildi, X'e kadar geçerli" gösterebilsin).
  - BILLING_ISSUE → erişim KESİLMEZ (grace period); `grace_period_expiration_at_ms` varsa endDate ona uzatılır, yoksa dokunulmaz (lapse olursa EXPIRATION keser).
- İptal (mobil IAP): mağaza ayarlarından iptal edilir (`revenueCatService.openSubscriptionManagement` → App Store/Play abonelik sayfası). `api/user/subscription/cancel` YALNIZCA mobilden başlatılan Iyzico aboneliğini iptal eder; IAP aboneliğinde (referenceCode yok) 400 döner ve kullanıcıyı mağazaya yönlendirir (yanlış "iptal edildi" + tahsilat devam riski engellenir).
- Test: `api/webhooks/revenuecat/route.test.ts`.

## Ortak kurallar
- **Idempotency**: tüm webhook'lar `claimWebhookEvent(source, dedupeKey)` ile çift işlemeye karşı korunur (`WebhookEvent` tablosu, unique constraint). Duplicate'te state değiştirmeden 200 dön.
- **Signature doğrulama**: Stripe imza header'ı, RC Authorization header'ı doğrulanır — yeni webhook eklerken aynısını yap.
- Gelir raporlama: `Payment` kayıtları → admin `finance`/`analytics`; yardımcılar `src/lib/monthlyRevenue.ts`, `src/lib/revenueConfig.ts`.
- Influencer komisyonu: `Referral` modeli, satın almada `api/referral/validate` ile doğrulanan kod üzerinden işlenir; istatistik `api/influencer/stats`.
