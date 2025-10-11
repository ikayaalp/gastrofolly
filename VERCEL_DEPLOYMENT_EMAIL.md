# 🚀 Vercel Deployment - 6 Haneli Email Doğrulama

## ✅ Sistem Hazır - Sadece Environment Variables Eklenecek

---

## 📋 VERCEL'E EKLENMESİ GEREKEN ENVIRONMENT VARIABLES

Vercel Dashboard → **Settings** → **Environment Variables** → **Add New**

### 🗄️ 1. DATABASE (ZORUNLU)

```
Name: DATABASE_URL
Value: postgresql://user:password@host:5432/database?sslmode=require
```

**Nereden alınır?**
- Vercel Postgres: Otomatik eklenir
- Supabase: https://supabase.com → Project → Settings → Database
- Railway: https://railway.app → Project → PostgreSQL → Connect
- Neon: https://neon.tech → Project → Connection string

---

### 🔑 2. NEXTAUTH (ZORUNLU)

```
Name: NEXTAUTH_SECRET
Value: [32+ karakterlik rastgele string]
```

**Nasıl oluşturulur?**
```bash
# Terminal'de çalıştır:
openssl rand -base64 32
```

veya online: https://generate-secret.vercel.app/32

```
Name: NEXTAUTH_URL
Value: https://your-app.vercel.app
```

> ⚠️ `your-app.vercel.app` yerine kendi Vercel URL'inizi yazın!

---

### 📧 3. EMAIL SERVICE (ZORUNLU - En Önemli!)

```
Name: EMAIL_USER
Value: your-gmail@gmail.com
```

> Gmail adresinizi yazın

```
Name: EMAIL_PASSWORD
Value: yrosjzjhuzwxcwdm
```

> Gmail App Password'ünüz (boşluksuz)

---

### 🔐 4. GOOGLE OAUTH (Opsiyonel)

Google ile giriş istiyorsanız:

```
Name: GOOGLE_CLIENT_ID
Value: 123456-abc.apps.googleusercontent.com
```

```
Name: GOOGLE_CLIENT_SECRET
Value: GOCSPX-abc123...
```

**Nereden alınır?**
- Google Cloud Console: https://console.cloud.google.com
- APIs & Services → Credentials
- OAuth 2.0 Client IDs oluştur
- Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`

---

### 🖼️ 5. CLOUDINARY (Opsiyonel)

Resim/Video upload için:

```
Name: CLOUDINARY_CLOUD_NAME
Value: your-cloud-name
```

```
Name: CLOUDINARY_API_KEY
Value: 123456789
```

```
Name: CLOUDINARY_API_SECRET
Value: abc123def456...
```

**Nereden alınır?**
- https://cloudinary.com → Dashboard → Account Details

---

### 💳 6. STRIPE (Opsiyonel)

Ödeme sistemi için:

```
Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_live_51Abc123...
```

```
Name: STRIPE_SECRET_KEY
Value: sk_live_51Abc123...
```

```
Name: STRIPE_WEBHOOK_SECRET
Value: whsec_abc123...
```

**Nereden alınır?**
- https://dashboard.stripe.com → Developers → API keys
- Production keys kullan (`pk_live_` ve `sk_live_`)

---

## 🎯 VERCEL DEPLOYMENT ADIMLARI

### 1️⃣ GitHub'a Push

```bash
git add .
git commit -m "6 haneli email doğrulama sistemi eklendi"
git push origin main
```

---

### 2️⃣ Vercel'e Bağlan

1. **Vercel'e git**: https://vercel.com/dashboard
2. **Add New** → **Project**
3. **Import Git Repository** → GitHub repo'nuzu seç
4. **Framework Preset**: Next.js (otomatik algılanır)
5. **Root Directory**: `.` (varsayılan)

---

### 3️⃣ Environment Variables Ekle

Deploy etmeden **ÖNCE**:

1. **Configure Project** ekranında
2. **Environment Variables** sekmesine git
3. Yukarıdaki tüm variable'ları ekle

**Her variable için:**
- Name: `DATABASE_URL`
- Value: `postgresql://...`
- Environment: ✅ **Production**, ✅ **Preview**, ✅ **Development** (hepsini seç)

> 💡 **Tavsiye**: Her variable için 3 environment'ı da seç

---

### 4️⃣ Deploy

**Deploy** butonuna tıkla!

Vercel otomatik:
- ✅ Prisma generate çalıştırır
- ✅ Migration deploy eder
- ✅ Next.js build yapar
- ✅ Production'a deploy eder

---

## 📋 ENVIRONMENT VARIABLES CHECKLIST

Deployment öncesi kontrol listesi:

### Zorunlu (Sisteminiz çalışmaz):
- [ ] `DATABASE_URL` - PostgreSQL bağlantı stringi
- [ ] `NEXTAUTH_SECRET` - 32+ karakter rastgele string
- [ ] `NEXTAUTH_URL` - `https://your-app.vercel.app`
- [ ] `EMAIL_USER` - Gmail adresiniz
- [ ] `EMAIL_PASSWORD` - `yrosjzjhuzwxcwdm`

### Opsiyonel (Özellik kullanıyorsanız):
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth için
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth için
- [ ] `CLOUDINARY_CLOUD_NAME` - Upload için
- [ ] `CLOUDINARY_API_KEY` - Upload için
- [ ] `CLOUDINARY_API_SECRET` - Upload için
- [ ] `STRIPE_PUBLISHABLE_KEY` - Ödeme için
- [ ] `STRIPE_SECRET_KEY` - Ödeme için
- [ ] `STRIPE_WEBHOOK_SECRET` - Ödeme için

---

## 🗄️ DATABASE KURULUMU

### Option A: Vercel Postgres (Önerilen)

```bash
# Vercel CLI ile
vercel postgres create
```

veya

Vercel Dashboard:
1. **Storage** → **Create Database**
2. **Postgres** seç
3. Database oluşturulunca `DATABASE_URL` otomatik eklenir ✅

### Option B: Supabase (Ücretsiz)

1. https://supabase.com → New Project
2. Project Settings → Database → Connection string
3. Copy → Vercel'e `DATABASE_URL` olarak ekle

### Option C: Railway

1. https://railway.app → New Project
2. PostgreSQL ekle
3. Variables → `DATABASE_URL` → Copy
4. Vercel'e yapıştır

### Option D: Neon (Ücretsiz)

1. https://neon.tech → New Project
2. Connection string'i kopyala
3. Vercel'e ekle

---

## 🔄 DEPLOYMENT SONRASI

### 1. Build Loglarını Kontrol Et

Vercel Dashboard → **Deployments** → En son deployment → **View Build Logs**

Şunları kontrol et:
```
✓ Prisma generate
✓ Prisma migrate deploy
✓ Next.js build
✓ Deployment successful
```

### 2. Runtime Loglarını İzle

Vercel Dashboard → **Deployments** → **Functions** → Logs

İlk kayıt denemesinde:
```
✓ Verification email sent to user@example.com
```

görmeli

### 3. Test Et

```
1. https://your-app.vercel.app/auth/signup
2. Gerçek email ile kayıt ol
3. Email kutunu kontrol et
4. 6 haneli kodu gir
5. ✓ Başarılı!
```

---

## 🐛 SORUN GİDERME

### Email gelmiyor?

**Vercel Logs'u kontrol et:**

```bash
vercel logs --follow
```

**Hata: "Invalid login: 535-5.7.8"**
- Gmail App Password yanlış
- Boşluklu girmiş olabilirsiniz: `yros jzjh uzwx cwdm` ❌
- Doğru: `yrosjzjhuzwxcwdm` ✅

**Hata: "EAUTH"**
- `EMAIL_USER` doğru değil
- Gmail adresi tam olmalı: `yourmail@gmail.com`

### Build başarısız?

**Prisma hatası:**
```
Error: Prisma schema not found
```

**Çözüm**: `prisma/schema.prisma` dosyası commit edilmiş mi?

```bash
git add prisma/schema.prisma
git commit -m "Add prisma schema"
git push
```

### Runtime hatası?

**Vercel Functions Logs:**

```
Cannot find module '@prisma/client'
```

**Çözüm**: `package.json` kontrol et:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

---

## 📊 PRODUCTION CHECKLIST

Deploy sonrası kontrol:

- [ ] Ana sayfa açılıyor
- [ ] Signup sayfası çalışıyor
- [ ] Email gönderiliyor
- [ ] Kod doğrulanıyor
- [ ] Login çalışıyor
- [ ] Database bağlantısı OK
- [ ] SSL/HTTPS aktif
- [ ] Domain bağlı (opsiyonel)

---

## 🎯 ÖZELLİKLER

Deployment sonrası çalışacak:

✅ **Kullanıcı Kayıt**: 6 haneli kod ile
✅ **Email Doğrulama**: Otomatik gönderim
✅ **Kod Geçerlilik**: 10 dakika
✅ **Yeni Kod Gönder**: Çalışıyor
✅ **Login**: Email doğrulandıktan sonra
✅ **Kurslar**: Tüm özellikler
✅ **Mesajlaşma**: Çalışıyor
✅ **Forum**: Çalışıyor
✅ **Admin Panel**: Çalışıyor

---

## 📞 DESTEK

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Gmail App Password: https://myaccount.google.com/apppasswords

---

## 🎉 ÖZET

1. ✅ Kod hazır
2. ✅ Gmail App Password aldınız: `yrosjzjhuzwxcwdm`
3. ⏳ GitHub'a push yapın
4. ⏳ Vercel'de environment variables ekleyin
5. ⏳ Deploy edin
6. ✅ Test edin

---

**🚀 Hemen deploy edebilirsiniz!**

### Son Adımlar:

```bash
# 1. Commit
git add .
git commit -m "Email verification system ready for production"

# 2. Push
git push origin main

# 3. Vercel'de environment variables ekle
# 4. Deploy!
```

---

## 💡 ÖNEMLİ NOTLAR

### Gmail App Password
- ✅ Boşluksuz: `yrosjzjhuzwxcwdm`
- ❌ Boşluklu değil: `yros jzjh uzwx cwdm`

### NEXTAUTH_URL
- ✅ Production: `https://your-app.vercel.app`
- ❌ Local değil: `http://localhost:3000`

### DATABASE_URL
- ✅ PostgreSQL production
- ❌ SQLite çalışmaz Vercel'de

---

**Başka soru var mı? Yoksa deploy edebilirsiniz! 🎉**

