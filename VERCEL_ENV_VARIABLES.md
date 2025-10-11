# 🔐 Vercel Environment Variables - Kopyala Yapıştır

## 📋 Tüm Environment Variables (Vercel Dashboard'a eklenecek)

Vercel Dashboard → **Settings** → **Environment Variables** → **Add**

---

### 🗄️ Database (ZORUNLU)

```
DATABASE_URL
```
**Value**: 
```
postgresql://user:password@host:5432/database?sslmode=require
```

> 💡 **Not**: Vercel Postgres kullanıyorsanız otomatik eklenir

---

### 🔑 NextAuth (ZORUNLU)

```
NEXTAUTH_SECRET
```
**Value**: 
```bash
# Terminal'de çalıştır:
openssl rand -base64 32
# Çıktıyı buraya yapıştır (örn: xKf9dJ2mP4sL8wQ3nY7...)
```

```
NEXTAUTH_URL
```
**Value**:
```
https://your-app.vercel.app
```

---

### 🔥 Firebase (Email Verification - ZORUNLU)

Firebase Console → Project Settings → Your apps → Web app config

```
NEXT_PUBLIC_FIREBASE_API_KEY
```
**Value**: `AIzaSyAbc123...`

```
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
```
**Value**: `your-project.firebaseapp.com`

```
NEXT_PUBLIC_FIREBASE_PROJECT_ID
```
**Value**: `your-project-id`

```
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
```
**Value**: `your-project.appspot.com`

```
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
```
**Value**: `123456789`

```
NEXT_PUBLIC_FIREBASE_APP_ID
```
**Value**: `1:123456789:web:abc123`

---

### 🔐 Google OAuth (Opsiyonel)

Google Cloud Console → APIs & Services → Credentials

```
GOOGLE_CLIENT_ID
```
**Value**: `123456-abc.apps.googleusercontent.com`

```
GOOGLE_CLIENT_SECRET
```
**Value**: `GOCSPX-abc123...`

---

### 🖼️ Cloudinary (Image/Video Upload)

Cloudinary Dashboard → Account Details

```
CLOUDINARY_CLOUD_NAME
```
**Value**: `your-cloud-name`

```
CLOUDINARY_API_KEY
```
**Value**: `123456789`

```
CLOUDINARY_API_SECRET
```
**Value**: `abc123def456...`

---

### 💳 Stripe (Payment - Opsiyonel)

Stripe Dashboard → Developers → API keys

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```
**Value**: `pk_live_51Abc123...` (Production için `pk_live_`, test için `pk_test_`)

```
STRIPE_SECRET_KEY
```
**Value**: `sk_live_51Abc123...` (Production için `sk_live_`, test için `sk_test_`)

```
STRIPE_WEBHOOK_SECRET
```
**Value**: `whsec_abc123...`

---

## ✅ Checklist

Deploy etmeden önce kontrol et:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_SECRET` - 32+ karakter random string
- [ ] `NEXTAUTH_URL` - Vercel app URL'i (https://)
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase config
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase domain
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase sender
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID

### Opsiyonel (Eğer kullanıyorsanız):

- [ ] `GOOGLE_CLIENT_ID` - Google OAuth
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth
- [ ] `CLOUDINARY_CLOUD_NAME` - Cloudinary
- [ ] `CLOUDINARY_API_KEY` - Cloudinary
- [ ] `CLOUDINARY_API_SECRET` - Cloudinary
- [ ] `STRIPE_PUBLISHABLE_KEY` - Stripe
- [ ] `STRIPE_SECRET_KEY` - Stripe
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe

---

## 🎯 Environment Seçimi

Her variable için **3 environment** seçebilirsiniz:

- ✅ **Production** - Ana site (önerilen)
- ✅ **Preview** - PR ve branch deploys (önerilen)
- ✅ **Development** - Local development (`vercel env pull` için)

> 💡 **Tavsiye**: Hepsini seçin, böylece her ortamda çalışır.

---

## 🔄 Update Etme

Environment variable değiştirdiğinizde:

```bash
# Yeniden deploy et
vercel --prod
```

veya

Vercel Dashboard → **Deployments** → **Redeploy**

---

## 🧪 Test Etme

Deploy sonrası:

```bash
# Production'daki env'leri göster (sadece isimler)
vercel env ls

# Local'e çek (development env)
vercel env pull .env.local
```

---

## 🚨 Güvenlik

- ❌ `.env` dosyalarını **asla** GitHub'a push etme
- ❌ Environment variable'ları **asla** kodda hardcode etme
- ✅ Sadece Vercel Dashboard'dan ekle
- ✅ Production için farklı keys kullan (Stripe, Firebase)

---

## 📱 Quick Copy Template

```env
# Copy this to Vercel Environment Variables (tek tek)
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<random-32-chars>
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abc123
```

---

**✨ Tüm variable'ları ekledikten sonra Deploy butonuna bas!**

