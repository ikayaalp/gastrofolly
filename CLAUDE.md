# CLAUDE.md

Bu dosya, Claude Code'un bu proje (gastrofolly / chef-course-platform) üzerinde çalışırken izlemesi gereken iş akışını ve kuralları tanımlar.

## Proje Özeti

- **Next.js** (App Router, v16) tabanlı bir yemek/şef kursu platformu (`chef-course-platform`).
- **Prisma** + veritabanı (`prisma/`), **NextAuth** ile kimlik doğrulama.
- **Stripe** ile ödeme, **Cloudinary** / **Vercel Blob** ile medya, **Resend** ile e-posta.
- **Tailwind CSS v4**, **React 19**.
- `mobile-app/` klasöründe ayrı bir mobil uygulama bulunuyor.
- Admin/instructor paneli: `src/app/api/admin`, `src/app/api/instructor`.

### Sık kullanılan komutlar
- `npm run dev` — geliştirme sunucusu (turbopack)
- `npm run build` — prisma generate + db push + next build
- `npm run lint` — eslint
- `npm run db:migrate` / `npm run db:push` — prisma migration
- `npm run create-admin` — admin kullanıcı oluşturma script'i

## Mimari Haritası

### Veritabanı (`prisma/schema.prisma`, PostgreSQL)
- **Auth**: `User` (rol: STUDENT/INSTRUCTOR/ADMIN/INFLUENCER), NextAuth tabloları (`Account`, `Session`, `VerificationToken`)
- **Kurs sistemi**: `Category`, `Course`, `Lesson`, `Enrollment`, `Progress`, `Review`, `Certificate`, `Message` (eğitmen↔öğrenci)
- **Ticaret**: `Payment` (Stripe + Iyzico), `DiscountCode`, `Referral` (influencer komisyonu), `SubscriptionPlan`
- **Finans**: `FinanceRecord` (INCOME/EXPENSE, `createdBy` ile User'a bağlı) — admin Gelir/Gider modülü
- **Forum/Sosyal**: `ForumCategory`, `Topic`, `Post`, `PostLike`/`TopicLike`, `Hashtag`, `Poll`/`PollOption`/`PollVote`, `Follow`, `Story`
- **Bildirim**: `Notification` (NEW_COURSE/COURSE_UPDATE/SYSTEM/FORUM_REPLY)
- **AI**: `AiConversation`, `AiMessage` (Culi asistan geçmişi)

### Web app (`src/app/`)
- `admin/` — courses, finance (Gelir-Gider), influencers, mail, notifications, pool, social, stories, subscriptions, users, videos
- `instructor-dashboard/` — kurs/ders yönetimi; `influencer-dashboard/` — referans istatistikleri
- `auth/` — login/register/forgot-password
- `courses/`, `course/`, `category/`, `instructors/`, `instructor/` — public katalog/detay
- `learn/` — video izleme UI
- `chef-ai/`, `culi/` — AI asistan sohbet UI
- `chef-sor/`, `chef-sosyal/` — forum/sosyal (soru-cevap, akış, `topic/[id]/`)
- `checkout/`, `cart/`, `subscription/`, `my-courses/`, `favorites/`, `profile/`, `settings/`, `certificates/[id]/`, `dashboard/`
- Statik/yasal: `about/`, `blog/`, `contact/`, `faq/`, `privacy/`, `terms/`, `iptal-iade/`, `mesafeli-satis-sozlesmesi/`, `on-bilgilendirme-formu/`, `teslimat-iade/`

### API (`src/app/api/`, 111+ route)
- `auth/`, `admin/`, `instructor/`, `courses/`, `categories/`, `search/`, `progress/`, `video-progress/`, `enroll/`, `reviews/`
- Ödeme: `checkout/`, `webhooks/stripe/`, `iyzico/*` (initialize, subscribe, callback, cancel-subscription, complete-payment), `webhooks/iyzico/`, `discount/validate`, `referral/validate`, `cron/cleanup-subscriptions`
- Mobil IAP: `webhooks/revenuecat/`, `user/sync-rc`, `user/sync-revenuecat`, `user/subscription/cancel`
- Forum: `forum/topics`, `forum/posts`, `forum/like`, `forum/post-like`, `forum/polls`, `forum/hashtags/trending`, `forum/follow`, `forum/profile/[userId]`, `forum/upload-media`
- Upload/medya: `upload-image-cloud/`, `upload-video/`, `video/sign`, `auth/cloudinary-params`
- AI: `chef-sor/instructors`, `culi/chat`, `culi/conversations`, `ai-chat/`
- Bildirim: `notifications/`, `notifications/[id]/read`, `notifications/read-all`
- Sertifika: `certificates/generate`
- Dev/debug (prod'da middleware ile bloklanıyor): `seed/`, `migrate/`, `test-courses/`, `debug-db/`

### Paylaşılan kod (`src/components/`, `src/lib/`)
- Bileşenler domain'e göre gruplu: `admin/`, `course/`, `forum/`, `home/`, `instructor/`, `learn/`, `checkout/`, `ai/AIAssistantWidget.tsx`, `layout/`, `ui/`, `video/`, `providers/SessionProvider.tsx`
- `src/lib/auth.ts` — NextAuth config (Google + Credentials, Prisma adapter, bcrypt)
- `src/lib/prisma.ts` — Prisma client singleton
- `src/lib/stripe.ts`, `src/lib/iyzico.ts` — ödeme SDK sarmalayıcıları
- `src/lib/emailService.ts`, `src/lib/pushNotifications.ts` — bildirim yardımcıları
- `src/lib/culiBot.ts` — AI chatbot mantığı (**Groq API** kullanıyor, OpenAI/Gemini değil — `package.json`'daki `openai`/`@google/genai` paketleri aktif kullanılmıyor gibi görünüyor)
- `src/lib/mobileAuth.ts`, `src/lib/rateLimit.ts`, `src/lib/passwordValidator.ts`, `src/lib/profanity.ts`, `src/lib/pendingUsers.ts`, `src/lib/utils.ts`

### `mobile-app/`
- Expo/React Native (Expo ~54, RN 0.81.5, React 19), ayrı `package.json`/`node_modules`, web ile kod paylaşmıyor
- `src/api/` (authService, courseService, forumService, aiService, revenueCatService...), `src/screens/` (~30 ekran, web özelliklerinin karşılığı), `src/navigation/AppNavigator.js`
- Aynı backend API'yi HTTP üzerinden çağırıyor; ödemede Stripe/Iyzico yerine **RevenueCat** (IAP) kullanıyor

### Root script'ler
- `make-admin.js`, `scripts/create-admin.js` — kullanıcıyı ADMIN yapma / admin oluşturma
- `migrate-to-production.js` — SQLite (dev.db) → Postgres (prod) tek seferlik taşıma
- `quick-fix-video.js` — belirli bir dersin `videoUrl`'ini null'layan tek seferlik patch (muhtemelen artık gereksiz)
- `scripts/migrate.js`, `scripts/migrate-course-levels.js`, `scripts/create-demo-user.ts`, `scripts/clear-user-data.sql`, `scripts/create_test_user.js`

### Config notları
- `src/middleware.ts` — güvenlik header'ları + CSP (Cloudinary, Iyzico, GA/GTM, Vercel, Firebase Storage allowlist); prod'da dev-only route'ları bloklar (`/api/seed`, `/api/migrate`, `/api/test-courses`, `/api/debug-db`, `/api/test-email`, `/api/test`)
- Ödeme: hem **Stripe** (web checkout) hem **Iyzico** (TR abonelik faturalama) aktif
- Medya: Cloudinary (upload/sign) + Vercel Blob
- Mobil IAP: RevenueCat webhook + sync endpoint'leri

## Çalışma Akışı (Kullanıcı Tercihi)

Kullanıcının tanımladığı iş bölümü şu şekildedir:

1. **Karar gerektiren konular**: Mimari, kütüphane seçimi, önemli refactor gibi karar gerektiren bir durum ortaya çıkarsa, doğrudan uygulamaya geçmeden önce **derinlemesine araştırma (deep research)** yap ve kararı kullanıcıyla **birlikte** ver. Tek başına büyük kararlar alma.
2. **Claude'un rolü — karar mekanizması ve review**: Claude bu projede kodu bizzat yazan taraf değil, **karar mekanizması ve code review** rolündedir:
   - Kullanıcıya görev/talimat (prompt) önerir.
   - Kod, kullanıcı tarafından **Gemini 3.1 High**'a yazdırılır.
   - Claude, Gemini'nin yazdığı kodu **review** eder (doğruluk, güvenlik, sadelik açısından).
3. **Sohbet uzunluğu**: Ortalama ~10 prompt sonrasında yeni bir sohbete geçilecek. Böyle bir geçiş öncesinde, o ana kadar yapılanların/konuşulanların **özetini** çıkar ki yeni sohbette bağlam kaybı olmasın.

### Pratikte bu şu anlama gelir:
- Kod yazma isteği geldiğinde önce net bir plan/prompt taslağı sun (Gemini'ye verilebilecek şekilde).
- Kullanıcı "Gemini'nin yazdığı kodu review et" dediğinde, review'i normal bir code review gibi ele al: doğruluk hatası, güvenlik açığı, gereksiz karmaşıklık, proje kurallarına uygunluk.
- Önemli/belirsiz kararlarda ("bu şekilde mi yapalım?") doğrudan uygulamaya geçmek yerine önce araştır, seçenekleri kısaca sun, kullanıcıyla karara bağla.
- Sohbet uzadıkça (~10 prompt), kullanıcı özet isteyebilir — istenildiğinde kısa ve eyleme dönük bir özet ver (neler yapıldı, sırada ne var, açık kararlar neler).

### Gemini'ye verilecek prompt'ların formatı

Kodu **Gemini 3.1 High** yazacak — bu model kod tabanının geçmiş konuşma bağlamını görmüyor, sadece verilen prompt'u görüyor. Bu yüzden Claude'un ürettiği prompt'lar **kısa talimat değil, kendi başına yeterli, detaylı bir görev tanımı** olmalı. "Deep research" gerektiren (yani karar aşamasından implementasyona geçilen) her durumda prompt şu unsurları içermeli:

1. **Bağlam** — hangi proje, hangi modül (bkz. Mimari Haritası bölümü), ilgili Prisma modelleri/alanları.
2. **Etkilenecek/oluşturulacak dosyalar** — tam yol (`src/app/api/...`, `src/components/...` vb.), yeni dosyaysa nereye konulacağı ve mevcut konvansiyona (örn. domain'e göre gruplanmış component klasörleri) nasıl uyacağı.
3. **Kesin gereksinimler** — ne yapılacağı, hangi edge case'lerin ele alınması gerektiği, hangi hata durumlarının handle edilmesi gerektiği.
4. **Proje konvansiyonları** — auth kontrolü nasıl yapılıyor (`src/lib/auth.ts`), Prisma client nasıl import ediliyor (`src/lib/prisma.ts`), var olan benzer route/component'lere referans (örnek dosya yolu vererek "şuna benzer şekilde yaz" de).
5. **Kapsam dışı olan** — neyin değiştirilmemesi/eklenmemesi gerektiği (gereksiz refactor, fazladan soyutlama vb. olmasın diye).
6. **Kabul kriteri** — değişikliğin "tamam" sayılması için ne çalışıyor olmalı (örn. "admin olmayan kullanıcı 403 almalı", "form boşken submit disabled olmalı").

Kısa/belirsiz prompt vermek yerine, Gemini'nin ekstra soru sormasına gerek kalmayacak kadar doygun bir prompt hedefle.
