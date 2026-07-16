# CLAUDE.md

Bu dosya, Claude Code'un bu proje (gastrofolly / chef-course-platform) üzerinde çalışırken izlemesi gereken iş akışını, kuralları ve **projenin tam haritasını** tanımlar.

## Proje Özeti

- **Next.js** (App Router, v16) tabanlı bir yemek/şef kursu platformu (`chef-course-platform`), marka adı **Culinora**.
- **Prisma** + PostgreSQL (`prisma/schema.prisma`), **NextAuth** ile kimlik doğrulama.
- Ödeme: **Stripe** (web checkout) + **Iyzico** (TR abonelik) + **RevenueCat** (mobil IAP).
- Medya: **Cloudinary** + **Vercel Blob**; e-posta: **Resend**; realtime: **Pusher**.
- **Tailwind CSS v4**, **React 19**; testler **Vitest**.
- `mobile-app/` klasöründe ayrı bir Expo/React Native uygulaması (aynı backend API'yi kullanır).

### Komutlar
- `npm run dev` — geliştirme sunucusu (turbopack)
- `npm run build` — prisma generate + db push + next build (`vercel-build` db push yapmaz)
- `npm run lint` — eslint
- `npm test` / `npm run test:watch` — Vitest (72+ test)
- `npm run db:migrate` / `npm run db:push` / `npm run db:seed`
- `npm run create-admin` / `npm run backfill-usernames` / `npm run migrate`

### Detay dokümanları (gerektiğinde oku, hepsini baştan yükleme)
- `docs/CONVENTIONS.md` — API route/auth/test/bileşen kalıpları + güvenlik kuralları. **Kod yazmadan/review etmeden önce oku.**
- `docs/PAYMENTS.md` — Stripe/Iyzico/RevenueCat akışları, webhook event'leri, abonelik alanları. **Ödemeye dokunan her işte oku.**
- `mobile-app/CLAUDE.md` — mobil kurallar (SecureStore, apiClient, tema token'ları); mobile-app içinde çalışırken otomatik yüklenir.

---

# PROJE HARİTASI

## Üst düzey dizinler

| Yol | İçerik |
|---|---|
| `src/app/` | Next.js App Router — sayfalar + API route'ları |
| `src/components/` | Domain'e göre gruplanmış React bileşenleri |
| `src/lib/` | Paylaşılan iş mantığı (auth, ödeme, e-posta, AI, rate limit...) |
| `src/contexts/` | `CartContext.tsx`, `FavoritesContext.tsx` |
| `src/types/` | `next-auth.d.ts` (session tip genişletmesi) |
| `src/middleware.ts` | Güvenlik header'ları + CSP + prod'da dev route bloklama |
| `prisma/` | `schema.prisma` + seed |
| `scripts/` | Tek seferlik/operasyonel script'ler |
| `mobile-app/` | Expo/React Native uygulaması (ayrı package.json, kod paylaşmaz) |
| `public/` | Statik dosyalar |

Root config: `next.config.js`, `vercel.json`, `vitest.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `env.example`.

## Veritabanı modelleri (`prisma/schema.prisma`)

- **Auth**: `User` (rol enum: STUDENT/INSTRUCTOR/ADMIN/INFLUENCER; username alanı var), `Account`, `Session`, `VerificationToken`
- **Kurs**: `Category`, `Course` (`CourseLevel` enum), `Lesson`, `Enrollment`, `Progress`, `Review`, `Certificate`
- **Ticaret**: `Payment` (`PaymentStatus` enum; Stripe + Iyzico), `DiscountCode`, `Referral` (influencer komisyonu), `SubscriptionPlan`
- **Finans**: `FinanceRecord` (`FinanceType`: INCOME/EXPENSE) — admin Gelir/Gider modülü
- **Forum/Sosyal**: `ForumCategory`, `Topic`, `Post`, `TopicLike`/`PostLike`, `Hashtag`, `Poll`/`PollOption`/`PollVote`, `Follow`, `SavedTopic`, `Report`, `Block`, `Story`
- **Mesajlaşma**: `Message` (eğitmen↔öğrenci, eski), `Conversation`/`ConversationParticipant`/`DirectMessage` (DM sistemi)
- **Bildirim**: `Notification` (`NotificationType`: NEW_COURSE/COURSE_UPDATE/SYSTEM/FORUM_REPLY)
- **AI**: `AiConversation`, `AiMessage` (Culi geçmişi)
- **Anasayfa CMS**: `HomeCover`, `HomeInstructor`, `HomeSection`/`HomeSectionCourse`
- **Altyapı**: `WebhookEvent` (webhook idempotency)

## Domain bazlı harita (bir şeyi değiştirirken buradan bul)

### Auth & kullanıcı hesabı
- Sayfalar: `src/app/auth/` (signin, signup, forgot-password, reset-password, verify-email), `src/app/profile/`, `src/app/settings/`, `src/app/dashboard/`
- API: `src/app/api/auth/` — `[...nextauth]`, `register`, `verify-email`, `resend-code`, `forgot-password`, `reset-password`, `me`, `mobile-login`, `google-mobile`, `apple-mobile` (mobil token doğrulama)
- API (hesap): `src/app/api/user/` — `update-profile`, `change-password`, `delete-account`, `courses`, `certificates`, `role`, `report`, `push-token`
- Lib: `src/lib/auth.ts` (NextAuth config: Google + Credentials, Prisma adapter, bcrypt), `src/lib/mobileAuth.ts` (mobil JWT), `src/lib/passwordValidator.ts`, `src/lib/pendingUsers.ts` (e-posta doğrulama öncesi), `src/lib/generateUsername.ts`
- Bileşen: `src/components/auth/SignOutButton.tsx`, `src/components/ui/UserDropdown.tsx`

### Kurs kataloğu & öğrenme
- Sayfalar: `src/app/courses/`, `src/app/course/[id]/`, `src/app/category/[categoryId]/`, `src/app/instructors/`, `src/app/instructor/[id]/`, `src/app/learn/[courseId]/` (video izleme), `src/app/my-courses/`, `src/app/favorites/`, `src/app/home/` (üye anasayfası), `src/app/page.tsx` (landing)
- API: `api/courses/` (liste, `[id]`, `featured`), `api/categories/`, `api/instructors/`, `api/search/`, `api/enroll` yok — kayıt ödeme üzerinden; `api/progress/`, `api/video-progress/`, `api/reviews` → kurs detayında
- Bileşenler: `src/components/course/`, `src/components/home/` (landing + anasayfa satırları), `src/components/learn/CourseSidebar.tsx`, `src/components/video/VideoPlayer.tsx` + `YouTubePlayer.tsx`, `src/components/layout/` (Footer, HeaderSearch, MobileNavbar, SmartAppBanner)
- Lib: `src/lib/homeSections.ts` (anasayfa bölüm mantığı), `src/lib/cloudinaryVideo.ts`
- Context: `src/contexts/FavoritesContext.tsx`, `src/contexts/CartContext.tsx`

### Ödeme & abonelik
- Sayfalar: `src/app/cart/`, `src/app/checkout/`, `src/app/subscription/`
- API Stripe: `api/checkout/` (session oluşturma), `api/webhooks/stripe/`
- API Iyzico: `api/iyzico/` — `subscribe-non3d`, `callback`, `cancel-subscription`, `simple-test`, `test`; `api/webhooks/iyzico/`
- API RevenueCat (mobil IAP): `api/webhooks/revenuecat/`, `api/user/sync-revenuecat`, `api/user/subscription/cancel`
- API diğer: `api/discount/validate`, `api/referral/validate`, `api/cron/cleanup-subscriptions` (vercel.json cron)
- Lib: `src/lib/stripe.ts`, `src/lib/iyzico.ts`, `src/lib/subscription.ts` (premium erişim kontrolü), `src/lib/webhookIdempotency.ts`, `src/lib/revenueConfig.ts`, `src/lib/monthlyRevenue.ts`
- Bileşenler: `src/components/checkout/CustomCardForm.tsx`, `src/components/cart/DiscountCode.tsx`, `src/components/subscription/SubscriptionBanner.tsx`, `src/components/home/SubscriptionPopup.tsx`

### Forum / Chef Sosyal
- Sayfalar: `src/app/chef-sosyal/` (akış), `chef-sosyal/topic/[id]/`, `chef-sosyal/profil/[userId]/`
- API: `api/forum/` — `topics` (+`[id]`, `[id]/posts`, `[id]/delete`), `posts/[id]`, `like`, `post-like`, `topic-likers`, `post-likers`, `liked-posts`, `liked-topics`, `polls` (+`vote`), `hashtags/trending`, `follow`, `followers/[userId]`, `profile/[userId]`, `save`, `report`, `block`, `categories`, `users/check-usernames`
- Bileşenler: `src/components/forum/` — TopicCard, EditTopicModal, MediaUploader, ReportModal, LikersModal, FollowListModal, HashtagText, LeftSidebar, RightSidebar
- Lib: `src/lib/forumDelete.ts` (cascade silme), `src/lib/mentions.ts`, `src/lib/profanity.ts`, `src/lib/hashtag` mantığı topic route'larında

### DM / Mesajlaşma (Pusher)
- Sayfalar: `src/app/messages/`, `messages/[conversationId]/`
- API: `api/dm/conversations` (+`[id]`, `[id]/messages`, `[id]/read`), `api/pusher/auth`, `api/instructor/messages/reply`
- Lib: `src/lib/pusher.ts` (server), `src/lib/pusherClient.ts` (client)
- Bileşen: `src/components/ui/MessagesNavIcon.tsx`, `src/components/instructor/MessageButton.tsx` + `InstructorMessageButton.tsx`

### AI (Culi / Chef AI)
- Sayfalar: `src/app/culi/`, `src/app/chef-ai/`
- API: `api/culi/chat`, `api/culi/conversations` (+`[id]`), `api/ai-chat/` (eski endpoint)
- Lib: `src/lib/culiBot.ts` (**Groq API** kullanıyor — package.json'daki `openai`/`@google/genai` aktif değil)
- Bileşen: `src/components/ai/AIAssistantWidget.tsx`

### Bildirimler
- API: `api/notifications/` (+`[id]/read`, `read-all`), `api/admin/notifications/send`, `api/user/push-token`
- Lib: `src/lib/pushNotifications.ts` (Expo push), `src/lib/emailService.ts` (Resend)
- Bileşen: `src/components/ui/NotificationDropdown.tsx`, `src/components/admin/PushNotificationSender.tsx`

### Sertifika
- Sayfalar: `src/app/certificates/`, `certificates/[id]/`
- API: `api/certificates/generate`, `api/user/certificates`

### Admin paneli (`src/app/admin/`)
- Sayfalar: `page.tsx` (dashboard), `analytics/`, `categories/`, `courses/`, `finance/` (Gelir-Gider), `homepage/` (anasayfa CMS), `influencers/`, `mail/`, `notifications/`, `pool/`, `social/` (forum moderasyon), `stories/`, `subscriptions/`, `users/` (+`[userId]/` drill-down), `videos/`
- API: `api/admin/` — `courses` (+`[courseId]`, `toggle-publish`, `simple`), `lessons` (+`[lessonId]`), `categories` (+`[categoryId]`), `users` (+`[userId]/role`), `finance`, `influencers`, `subscriptions` (+`[id]`), `send-mail`, `notifications/send`, `home-covers`, `home-instructors`, `home-sections`, `forum/` (categories, topics, posts, hashtags, reports+`[id]`), `stories` → `api/stories/` (+`[id]`, `reorder`), `cloudinary-config`, `backfill-hashtags`
- Bileşenler: `src/components/admin/` — AdminSidebar, FinanceModal, ImageUpload/VideoUpload/DocumentUpload, HomepageManagerClient, ForumCategoryModal, PollCreationModal, PushNotificationSender, `analytics/` (RevenueChart, EnrollmentChart, DropoffFunnelChart)

### Instructor & Influencer panelleri
- Sayfalar: `src/app/instructor-dashboard/` (courses, courses/new, courses/[courseId], profile), `src/app/influencer-dashboard/`
- API: `api/instructor/` — `courses` (+`[courseId]`, `toggle-publish`), `lessons` (+`[lessonId]`), `messages/reply`, `[instructorId]/courses`; `api/influencer/stats`

### Medya upload
- API: `api/upload-image-cloud/`, `api/upload-document-cloud/`, `api/auth/cloudinary-params` (imzalı Cloudinary upload — forum MediaUploader da bunu kullanır), `api/admin/cloudinary-config`
- Lib: `src/lib/cloudinaryVideo.ts`, `src/lib/cropImage.ts`

### Mobil-özel API
- `api/mobile/home` (mobil anasayfa aggregate), `api/auth/mobile-login|google-mobile|apple-mobile`, `api/user/sync-revenuecat`, `api/user/push-token`

### Statik / yasal sayfalar
`about/`, `blog/` (+`[slug]`), `contact/`, `faq/`, `privacy/`, `terms/`, `iptal-iade/`, `mesafeli-satis-sozlesmesi/`, `on-bilgilendirme-formu/`, `teslimat-iade/`, `links/`; SEO: `src/app/sitemap.ts`, `src/app/robots.ts`

### Dev/debug route'ları (prod'da middleware bloklar)
`api/seed`, `api/migrate`, `api/debug-db`, `api/test-courses`, `api/iyzico/test`, `api/iyzico/simple-test`

## `src/lib/` dosya dosya

| Dosya | Ne işe yarar |
|---|---|
| `auth.ts` | NextAuth config (Google + Credentials, bcrypt) |
| `prisma.ts` | Prisma client singleton |
| `mobileAuth.ts` | Mobil JWT üretme/doğrulama |
| `stripe.ts` / `iyzico.ts` | Ödeme SDK sarmalayıcıları |
| `subscription.ts` | Premium/abonelik erişim kontrolü (testli) |
| `webhookIdempotency.ts` | WebhookEvent ile çift işleme koruması (testli) |
| `revenueConfig.ts` / `monthlyRevenue.ts` | Gelir hesap/konfig |
| `emailService.ts` | Resend e-posta şablonları |
| `pushNotifications.ts` | Expo push gönderimi |
| `pusher.ts` / `pusherClient.ts` | Realtime DM |
| `culiBot.ts` | AI chatbot (Groq) |
| `rateLimit.ts` | Rate limiting (testli) |
| `passwordValidator.ts` | Şifre kuralları (testli) |
| `profanity.ts` | Küfür filtresi (testli) |
| `pendingUsers.ts` | E-posta doğrulaması bekleyen kayıtlar |
| `forumDelete.ts` | Forum cascade silme |
| `mentions.ts` / `generateUsername.ts` | Sosyal yardımcılar |
| `homeSections.ts` | Anasayfa bölümleri (testli) |
| `cloudinaryVideo.ts` / `cropImage.ts` | Medya yardımcıları |
| `utils.ts` | Genel yardımcılar |

## Testler (Vitest, `npm test`)

- Route testleri: `api/checkout`, `api/webhooks/stripe`, `api/webhooks/revenuecat`, `api/iyzico/callback`, `api/auth/mobile-login|google-mobile|apple-mobile` (her biri route.ts yanında `route.test.ts`)
- Lib testleri: `subscription`, `webhookIdempotency`, `rateLimit`, `passwordValidator`, `profanity`, `homeSections`

## `scripts/`

`create-admin.js`, `make-admin.js`, `create-demo-user.ts`, `create_test_user.js`, `backfill-usernames.js`, `migrate.js`, `migrate-course-levels.js`, `migrate-premium-yearly.js`, `fix-today-payment.js` (tek seferlik), `poc-signed-video.js` (imzalı video PoC — ertelenen Fix B), `clear-user-data.sql`

## `mobile-app/` (Expo ~54, RN 0.81.5, React 19)

- Giriş: `App.js`, `index.js`, `app.config.js`, `eas.json` (EAS build), `metro.config.js`
- `src/api/` — `apiClient.js` (HTTP client + token), `config.js` (API base URL), servisler: `authService`, `courseService`, `forumService`, `dmService`, `aiService`, `homeService`, `notificationService`, `storyService`, `certificateService`, `revenueCatService` (IAP), `pusherClient`
- `src/screens/` (~28 ekran): Home, Courses, CourseDetail, Learn (video), Search, Favorites, Social + TopicDetail + EditTopic + ChefSocialProfile, Culi (AI), Messages + Chat (DM), Notifications, Certificates, Subscription, Profile + EditProfile + Account + Settings + ChangePassword, InstructorProfile, Login/Register/ForgotPassword/EmailVerification, Intro/Onboarding, Stories (`components/Stories.js`)
- `src/navigation/AppNavigator.js` — tüm navigasyon tek dosyada
- `src/components/` — FloatingTabBar, TopicCard, Skeleton, CustomAlert, ErrorBoundary, OfflineBanner, LoginRequiredModal, ImageViewerModal...
- `src/hooks/` — `useAppleAuth`, `useGoogleAuth`, `useTabBarClearance`
- `src/utils/tokenStorage.js` — **SecureStore** token saklama (tüm ekranlar bunu kullanmalı, AsyncStorage değil)
- `src/constants/theme.js` + `layout.js` — tema/spacing sabitleri
- Ödeme: **yalnızca RevenueCat** (Stripe/Iyzico mobilde yok)

## Config notları

- `src/middleware.ts` — güvenlik header'ları + CSP (Cloudinary, Iyzico, GA/GTM, Vercel, Firebase Storage allowlist); prod'da dev-only route'ları bloklar
- `vercel.json` — cron (`cleanup-subscriptions`) ve deploy ayarları
- Auth çift yönlü: web NextAuth session, mobil Bearer JWT (`mobileAuth.ts`) — API route'ları çoğunlukla ikisini de destekler
- Ödemede üç sistem paralel: Stripe (web tek seferlik), Iyzico (TR abonelik), RevenueCat (mobil IAP) — abonelik durumu `User` üzerinde senkronlanır

---

## Çalışma Akışı (Kullanıcı Tercihi)

Kullanıcının tanımladığı iş bölümü şu şekildedir:

1. **Karar gerektiren konular**: Mimari, kütüphane seçimi, önemli refactor gibi karar gerektiren bir durum ortaya çıkarsa, doğrudan uygulamaya geçmeden önce **derinlemesine araştırma (deep research)** yap ve kararı kullanıcıyla **birlikte** ver. Tek başına büyük kararlar alma.
2. **Claude'un rolü — karar mekanizması ve review**: Claude bu projede kodu bizzat yazan taraf değil, **karar mekanizması ve code review** rolündedir:
   - Kullanıcıya görev/talimat (prompt) önerir.
   - Kod, kullanıcı tarafından **Gemini 3.1 High**'a yazdırılır (Antigravity IDE içinde; 2026-07-12 içinde kısa süreliğine Opus 4.6'ya geçilmişti, aynı gün tekrar Gemini 3.1 High'a dönüldü).
   - Claude, Gemini'nin yazdığı kodu **review** eder (doğruluk, güvenlik, sadelik açısından).
3. **Sohbet uzunluğu**: Ortalama ~10 prompt sonrasında yeni bir sohbete geçilecek. Böyle bir geçiş öncesinde, o ana kadar yapılanların/konuşulanların **özetini** çıkar ki yeni sohbette bağlam kaybı olmasın.

### Pratikte bu şu anlama gelir:
- Kod yazma isteği geldiğinde önce net bir plan/prompt taslağı sun (Gemini'ye verilebilecek şekilde).
- Kullanıcı "yazdığı kodu review et" dediğinde, review'i normal bir code review gibi ele al: doğruluk hatası, güvenlik açığı, gereksiz karmaşıklık, proje kurallarına uygunluk.
- Önemli/belirsiz kararlarda ("bu şekilde mi yapalım?") doğrudan uygulamaya geçmek yerine önce araştır, seçenekleri kısaca sun, kullanıcıyla karara bağla.
- Sohbet uzadıkça (~10 prompt), kullanıcı özet isteyebilir — istenildiğinde kısa ve eyleme dönük bir özet ver (neler yapıldı, sırada ne var, açık kararlar neler).

### Gemini'ye verilecek prompt'ların formatı

Kodu **Gemini 3.1 High** yazacak — bu model kod tabanının geçmiş konuşma bağlamını görmüyor, sadece verilen prompt'u görüyor. Bu yüzden Claude'un ürettiği prompt'lar **kısa talimat değil, kendi başına yeterli, detaylı bir görev tanımı** olmalı. "Deep research" gerektiren (yani karar aşamasından implementasyona geçilen) her durumda prompt şu unsurları içermeli:

1. **Bağlam** — hangi proje, hangi modül (bkz. Proje Haritası bölümü), ilgili Prisma modelleri/alanları.
2. **Etkilenecek/oluşturulacak dosyalar** — tam yol (`src/app/api/...`, `src/components/...` vb.), yeni dosyaysa nereye konulacağı ve mevcut konvansiyona (örn. domain'e göre gruplanmış component klasörleri) nasıl uyacağı.
3. **Kesin gereksinimler** — ne yapılacağı, hangi edge case'lerin ele alınması gerektiği, hangi hata durumlarının handle edilmesi gerektiği.
4. **Proje konvansiyonları** — auth kontrolü nasıl yapılıyor (`src/lib/auth.ts`), Prisma client nasıl import ediliyor (`src/lib/prisma.ts`), var olan benzer route/component'lere referans (örnek dosya yolu vererek "şuna benzer şekilde yaz" de).
5. **Kapsam dışı olan** — neyin değiştirilmemesi/eklenmemesi gerektiği (gereksiz refactor, fazladan soyutlama vb. olmasın diye).
6. **Kabul kriteri** — değişikliğin "tamam" sayılması için ne çalışıyor olmalı (örn. "admin olmayan kullanıcı 403 almalı", "form boşken submit disabled olmalı").

Kısa/belirsiz prompt vermek yerine, Gemini'nin ekstra soru sormasına gerek kalmayacak kadar doygun bir prompt hedefle.
