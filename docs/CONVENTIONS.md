# Kod Konvansiyonları (web / Next.js tarafı)

Bu dosya, yeni kod yazarken/review ederken uyulacak kalıpları içerir. Gemini'ye verilecek prompt'larda buradaki kalıplara referans ver.

## API route kalıpları (`src/app/api/**/route.ts`)

### 1. Sadece web (NextAuth session) — admin örneği
```ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  // ... prisma sorguları
}
```
Örnek: `src/app/api/admin/finance/route.ts`. Instructor route'larında rol kontrolü `INSTRUCTOR` (veya ADMIN) olur.

### 2. Web + mobil (çift auth) — kullanıcıya açık endpoint'ler
Mobil uygulamanın da çağırdığı her endpoint `getAuthUser` kullanmalı:
```ts
import { getAuthUser } from "@/lib/mobileAuth"

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request) // önce NextAuth session, yoksa Bearer JWT
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```
`getAuthUser` ayrıca: kullanıcının hâlâ var olduğunu doğrular, **tek cihaz oturumu** kontrolü yapar (`currentSessionId` vs token'daki `sessionId`), süresi dolan aboneliği lazy temizler. Mobil JWT `NEXTAUTH_SECRET` ile imzalanır.

### 3. Genel kurallar
- Prisma: her zaman `import { prisma } from "@/lib/prisma"` (yeni client oluşturma).
- Hata dönüşü: `NextResponse.json({ error: "..." }, { status: 4xx })`; beklenmeyen hatada try/catch + 500 + `console.error`.
- Rate limit gereken yerlerde (auth, public POST) `src/lib/rateLimit.ts`.
- Kullanıcı girdisi metinlerde küfür filtresi: `src/lib/profanity.ts` (forum/sosyal içerikte kullanılıyor).
- Premium içerik kontrolü: `isPremiumUser(user)` — `src/lib/subscription.ts`. Kural: `subscriptionPlan === 'Premium'` ve `subscriptionEndDate` gelecekte (null endDate premium sayılır).
- Webhook route'larında idempotency: `claimWebhookEvent(source, dedupeKey)` — `src/lib/webhookIdempotency.ts` (false dönerse hiçbir şey yapmadan 200 dön).

## Sayfa/bileşen kalıpları

- Sayfalar `src/app/<route>/page.tsx`; client component gerekiyorsa `"use client"` ile ya sayfanın kendisi ya da `src/components/<domain>/XClient.tsx` olarak ayrılır (örn. `HomepageManagerClient.tsx`).
- Bileşenler domain klasörüne gider: `admin/`, `course/`, `forum/`, `home/`, `instructor/`, `learn/`, `checkout/`, `layout/`, `ui/`, `video/`. Genel amaçlıysa `ui/`.
- Stil: Tailwind v4 utility class'ları; tema koyu (siyah zemin, turuncu `#ea580c`/`orange-600` vurgu).
- Global state: sepet `src/contexts/CartContext.tsx`, favoriler `src/contexts/FavoritesContext.tsx` (ikisi de localStorage senkronlu).
- Session erişimi client'ta `useSession()` (SessionProvider `src/components/providers/`).

## Test kalıpları (Vitest)

- Test dosyası, test ettiği dosyanın YANINA konur: `route.ts` → `route.test.ts`, `subscription.ts` → `subscription.test.ts`.
- Route testlerinde `vi.mock` ile `@/lib/prisma`, `@/lib/auth` vb. mock'lanır; `NextRequest` elle kurulur. Örnek: `src/app/api/checkout/route.test.ts`.
- Çalıştırma: `npm test` (CI'da da bu). Yeni kritik para/auth akışına test eklemek zorunlu kabul edilir.

## Güvenlik kuralları (geçmiş kararlardan)

- Mobil sosyal login: Apple/Google token'ları **doğrulanarak** işlenir (`jwt.decode` tek başına YASAK — geçmişte açıktı, kapatıldı). Apple: imza + aud kontrolü; Google: `aud` bizim client ID olmalı.
- Video URL'leri ödeme yapmamış kullanıcıya sayfa payload'ında sızdırılmaz (kurs detayı yalnızca hak sahibine `videoUrl` döner).
- Dev route'ları (`/api/seed`, `/api/migrate`, `/api/debug-db`, `/api/test-*`) prod'da `src/middleware.ts` tarafından bloklanır — yeni dev route eklersen middleware listesine ekle.
- CSP allowlist `src/middleware.ts` içinde; yeni dış kaynak (script/img/frame) eklerken oraya da ekle.
