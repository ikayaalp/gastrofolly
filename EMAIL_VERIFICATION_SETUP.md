# 📧 6 Haneli Email Doğrulama Sistemi

## 🎯 Sistem Nasıl Çalışıyor?

```
1. Kullanıcı kayıt olur
   ↓
2. Sistem 6 haneli rastgele kod oluşturur
   ↓
3. Kod email ile gönderilir (10 dakika geçerli)
   ↓
4. Kullanıcı doğrulama sayfasında kodu girer
   ↓
5. Kod doğruysa → Giriş sayfasına yönlendirilir
```

---

## 🚀 Kurulum Adımları

### 1️⃣ Gmail App Password Oluştur

Email göndermek için Gmail App Password kullanacağız:

1. Google hesabınıza gidin: https://myaccount.google.com
2. **Security** (Güvenlik) sekmesine tıklayın
3. **2-Step Verification** (2 Adımlı Doğrulama) aktif olmalı
4. **App passwords** (Uygulama şifreleri) arayın
5. **Select app** → **Mail** seçin
6. **Select device** → **Other** → "Chef2.0" yazın
7. **Generate** butonuna tıklayın
8. 16 haneli kodu kopyalayın (örn: `abcd efgh ijkl mnop`)

### 2️⃣ Environment Variables Ekle

`.env.local` dosyası oluştur:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Email Service (ZORUNLU)
EMAIL_USER="your-gmail@gmail.com"
EMAIL_PASSWORD="abcd efgh ijkl mnop"  # Gmail App Password (boşluksuz)
```

> ⚠️ **ÖNEMLİ**: Gmail App Password'u boşluksuz yazın!

### 3️⃣ Database Migration

```bash
# Prisma schema'yı güncelle
npx prisma migrate dev --name add_verification_code

# Veya development'ta
npx prisma db push
```

### 4️⃣ Test Et

```bash
npm run dev
```

1. `http://localhost:3000/auth/signup` → Kayıt ol
2. **Gerçek email** kullan (Gmail, Outlook, vb.)
3. Email kutunu kontrol et → 6 haneli kod gelecek
4. Doğrulama sayfasında kodu gir
5. Başarılı! → Giriş sayfasına yönlendirileceksin

---

## 📝 Vercel Production Setup

### Environment Variables (Vercel Dashboard)

```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
NEXTAUTH_SECRET=random-32-chars
NEXTAUTH_URL=https://your-app.vercel.app
DATABASE_URL=postgresql://...
```

### Güvenlik Notları

- ❌ Gmail şifrenizi **asla** kullanmayın, sadece **App Password**
- ✅ App Password sadece bu uygulama için
- ✅ Gerekirse App Password'u silebilir, yenisini oluşturabilirsiniz

---

## 🎨 Özellikler

### ✅ Ne Yapıldı?

1. ✅ **6 haneli rastgele kod** oluşturma
2. ✅ **Email servisi** (Nodemailer + Gmail SMTP)
3. ✅ **Güzel HTML email template** (profesyonel tasarım)
4. ✅ **Kod doğrulama API'si** (`/api/auth/verify-email`)
5. ✅ **Yeni kod gönderme API'si** (`/api/auth/resend-code`)
6. ✅ **Doğrulama sayfası** (6 kutucuk, otomatik focus)
7. ✅ **Kopyala-yapıştır desteği**
8. ✅ **10 dakika geçerlilik süresi**
9. ✅ **Prisma schema** güncellemesi

### 🎯 User Experience

- **Otomatik focus**: Kod girerken otomatik sonraki kutuya geçiş
- **Backspace support**: Geri tuşu ile önceki kutuya dönme
- **Paste support**: Kodu kopyala-yapıştır yapabilme
- **Visual feedback**: Hata/başarı mesajları
- **Resend button**: Yeni kod isteme butonu
- **Countdown**: 10 dakika süre göstergesi

---

## 📧 Email Template

Gönderilen email'de:
- ✅ Profesyonel tasarım
- ✅ Büyük, okunaklı 6 haneli kod
- ✅ 10 dakika geçerlilik uyarısı
- ✅ Güvenlik uyarısı
- ✅ Responsive design (mobil uyumlu)

---

## 🔧 API Endpoints

### POST `/api/auth/register`
Kullanıcı kaydı + doğrulama kodu gönderimi

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "message": "Kullanıcı başarıyla oluşturuldu",
  "userId": "clxxx...",
  "email": "john@example.com",
  "requiresVerification": true
}
```

### POST `/api/auth/verify-email`
Doğrulama kodunu kontrol et

**Request:**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "Email başarıyla doğrulandı!",
  "verified": true
}
```

### POST `/api/auth/resend-code`
Yeni doğrulama kodu gönder

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "Yeni doğrulama kodu gönderildi!",
  "sent": true
}
```

---

## 🐛 Sorun Giderme

### Email gelmiyor?

1. **Spam klasörünü kontrol et**
2. **Gmail App Password'u kontrol et**:
   - Boşluksuz olmalı: `abcdefghijklmnop`
   - 16 karakter olmalı
   - 2-Step Verification aktif olmalı
3. **Console log'ları kontrol et**:
   ```bash
   # Terminal'de hata var mı?
   ```
4. **EMAIL_USER ve EMAIL_PASSWORD doğru mu?**

### "Invalid login" hatası

```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Çözüm**:
- Gmail App Password yeniden oluştur
- 2-Step Verification aktif mi kontrol et
- Less secure app access **KULLANMA** (App Password yeterli)

### Kod geçersiz diyor

- Kod 10 dakika içinde girilmeli
- Doğru kodu girdiğinizden emin olun
- "Yeni Kod Gönder" butonuna tıklayıp yeni kod alın

### Database hatası

```bash
# Migration'ı çalıştır
npx prisma migrate dev
# veya
npx prisma db push
```

---

## 📱 Ekran Görüntüleri Akışı

```
1. KAYIT SAYFASI
   ├─ Ad, Soyad, Email, Şifre
   └─ "Hesap Oluştur" butonu

2. BAŞARI MESAJI
   └─ "📧 6 haneli kod gönderildi..."

3. DOĞRULAMA SAYFASI
   ├─ 6 adet input kutusu
   ├─ "Doğrula" butonu
   └─ "Yeni Kod Gönder" linki

4. BAŞARILI DOĞRULAMA
   └─ "✓ Email doğrulandı!"

5. GİRİŞ SAYFASI
   └─ Artık giriş yapabilirsiniz
```

---

## 🎯 Production Checklist

- [ ] Gmail App Password oluşturuldu
- [ ] `.env.local` dosyası dolduruldu
- [ ] Prisma migration çalıştırıldı
- [ ] Local'de test edildi
- [ ] Vercel'e environment variables eklendi
- [ ] Production'da test edildi

---

## 🔐 Güvenlik

- ✅ Kodlar 10 dakika sonra geçersiz
- ✅ Kod doğrulandıktan sonra siliniyor
- ✅ Şifreler bcrypt ile hashlenmiş
- ✅ Rate limiting (opsiyonel olarak eklenebilir)

---

## 💡 İpuçları

1. **Test için Gmail kullan**: Spam'e düşme ihtimali düşük
2. **Gmail + trick**: `yourmail+test1@gmail.com`, `yourmail+test2@gmail.com`
3. **Development'ta**: Gerçek email kullan (fake email çalışmaz)
4. **Production'da**: SMTP ayarlarını kontrol et

---

## 📞 Destek

- Nodemailer Docs: https://nodemailer.com
- Gmail App Password: https://support.google.com/accounts/answer/185833
- Prisma Docs: https://www.prisma.io/docs

---

**🎉 Email doğrulama sistemi hazır!**

Artık kullanıcılar kayıt olduğunda 6 haneli kod alacak ve doğrulayacak.

