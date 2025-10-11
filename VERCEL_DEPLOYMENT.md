# 🚀 Vercel Deployment Kılavuzu

## 📊 Mimari: Firebase + Prisma Kombinasyonu

### ❓ Firebase mi Prisma mı?

**CEVAP**: **HER İKİSİ!** 🎯

```
┌─────────────────────────────────────────┐
│         KULLANICI KAYIT AKIŞI           │
└─────────────────────────────────────────┘
                    ↓
    ┌──────────────────────────────┐
    │  1. Firebase Authentication  │
    │     - Email doğrulama        │
    │     - Güvenli şifre hash     │
    └──────────────────────────────┘
                    ↓
    ┌──────────────────────────────┐
    │  2. Prisma Database (PostgreSQL) │
    │     - User bilgileri         │
    │     - Kurslar                │
    │     - Mesajlar               │
    │     - Tüm app verisi         │
    └──────────────────────────────┘
```

**Firebase**: Sadece email doğrulama için (**sendEmailVerification**)  
**Prisma**: Tüm kullanıcı ve uygulama verisi için

---

## 🔧 Vercel'e Deploy Adımları

### 1️⃣ GitHub'a Push

```bash
git add .
git commit -m "Firebase email verification eklendi"
git push origin main
```

### 2️⃣ Vercel'e Bağlan

1. https://vercel.com → **Add New Project**
2. GitHub repo'nuzu seçin: `gastrofolly`
3. **Framework Preset**: Next.js (otomatik algılanır)

### 3️⃣ Environment Variables Ekle

Vercel Dashboard → **Settings** → **Environment Variables**

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# ============================================
# NEXTAUTH
# ============================================
NEXTAUTH_SECRET=random-secret-key-min-32-karakter-uzunlugunda
NEXTAUTH_URL=https://your-app.vercel.app

# ============================================
# FIREBASE (Email Verification)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abc123

# ============================================
# GOOGLE OAUTH (Opsiyonel)
# ============================================
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret

# ============================================
# CLOUDINARY
# ============================================
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ============================================
# STRIPE
# ============================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

> ⚠️ **ÖNEMLİ**: Her environment variable'ı **Production**, **Preview**, ve **Development** için ayrı ayrı ekle!

### 4️⃣ Database Kurulumu

#### Option A: Vercel Postgres (Önerilen)

```bash
# Vercel CLI ile
vercel postgres create
```

Vercel Dashboard'dan:
1. **Storage** → **Create Database** → **Postgres**
2. Database oluşturulunca `DATABASE_URL` otomatik eklenecek

#### Option B: Başka Provider (Supabase, Railway, Neon)

1. Provider'dan PostgreSQL database oluştur
2. Connection string'i kopyala
3. Vercel'e `DATABASE_URL` olarak ekle

### 5️⃣ Prisma Migration

Vercel'de otomatik migration için `package.json`'u güncelle:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### 6️⃣ Firebase Authorized Domains

Firebase Console → **Authentication** → **Settings** → **Authorized domains**

Ekle:
- `your-app.vercel.app`
- `your-custom-domain.com` (eğer varsa)

### 7️⃣ Deploy

```bash
vercel --prod
```

veya

Vercel Dashboard'dan **Deploy** butonuna tıkla.

---

## 🔐 NEXTAUTH_SECRET Oluşturma

### Method 1: OpenSSL (Terminal)
```bash
openssl rand -base64 32
```

### Method 2: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Method 3: Online
https://generate-secret.vercel.app/32

---

## 🌍 Production Checklist

### Firebase

- [ ] Email/Password authentication aktif
- [ ] Authorized domains eklendi (Vercel domain)
- [ ] Email template Türkçe'ye çevrildi
- [ ] Production API keys kullanılıyor

### Database

- [ ] PostgreSQL database oluşturuldu
- [ ] `DATABASE_URL` environment variable eklendi
- [ ] Prisma migration çalıştırıldı
- [ ] Seed data eklendi (opsiyonel)

```bash
# Seed çalıştırmak için
npx prisma db seed
```

### Vercel

- [ ] Tüm environment variables eklendi
- [ ] Build başarılı
- [ ] Domain bağlandı (opsiyonel)
- [ ] HTTPS aktif

### Security

- [ ] `NEXTAUTH_SECRET` güçlü ve unique
- [ ] API keys production keys
- [ ] `.env` dosyaları `.gitignore`'da
- [ ] Sensitive data commit edilmedi

---

## 🐛 Sorun Giderme

### "Firebase: Error (auth/configuration-not-found)"
```bash
# Environment variables'ı kontrol et
vercel env ls

# Yeniden deploy
vercel --prod --force
```

### "Prisma Client initialization error"
```bash
# Build script'i kontrol et
"build": "prisma generate && prisma migrate deploy && next build"

# Manuel migration
npx prisma migrate deploy
```

### Email gelmiyor
- Spam klasörünü kontrol et
- Firebase Console → Email provider ayarları
- Authorized domains kontrolü

---

## 📱 Test Etme

### Production Test

1. `https://your-app.vercel.app/auth/signup` → Kayıt ol
2. **Gerçek email** kullan (test email değil)
3. Email kutunu kontrol et
4. Doğrulama linkine tıkla
5. Giriş yap

### Environment Check

```bash
# Vercel environment variables'ı göster
vercel env ls

# Specific env'i pull et
vercel env pull .env.local
```

---

## 🔄 Update Workflow

```bash
# 1. Değişiklik yap
git add .
git commit -m "Feature: new feature"

# 2. Push to GitHub
git push origin main

# 3. Vercel otomatik deploy eder
# Veya manuel:
vercel --prod
```

---

## 📊 Monitoring

### Vercel Dashboard
- **Deployments**: Build logs
- **Analytics**: Traffic & performance
- **Logs**: Runtime errors

### Firebase Console
- **Authentication → Users**: Kayıtlı kullanıcılar
- **Authentication → Usage**: Email gönderim sayısı

---

## 💰 Pricing

### Firebase (Free Tier)
- ✅ 10,000 email/ay
- ✅ 50,000 auth users
- ✅ Unlimited projects

### Vercel (Hobby - Free)
- ✅ 100GB bandwidth/ay
- ✅ Serverless functions
- ✅ Automatic HTTPS

### PostgreSQL
- **Vercel Postgres**: Free tier var
- **Supabase**: 500MB free
- **Railway**: $5/ay
- **Neon**: Free tier var

---

## 🎯 Production URLs

- **App**: https://your-app.vercel.app
- **API**: https://your-app.vercel.app/api/auth/signin
- **Admin**: https://your-app.vercel.app/admin

---

## 📞 Destek

- Vercel Docs: https://vercel.com/docs
- Firebase Docs: https://firebase.google.com/docs
- Prisma Docs: https://www.prisma.io/docs

---

**🎉 Deployment başarılı!** Kullanıcılar artık production'da email doğrulama ile kayıt olabilir.

