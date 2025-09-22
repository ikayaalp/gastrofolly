# Chef2.0 Deployment Guide

## 🚀 Production Deployment Seçenekleri

### 1. **Vercel (En Kolay)**
```bash
# Vercel CLI ile deploy
npm i -g vercel
vercel

# Veya GitHub'a push edip vercel.com'da connect
```

### 2. **Railway**
```bash
# Railway CLI ile deploy
npm install -g @railway/cli
railway login
railway deploy
```

### 3. **Netlify**
```bash
# Netlify CLI ile deploy
npm install -g netlify-cli
netlify deploy --prod
```

## 📁 Video Storage Seçenekleri

### **A) Cloudinary (Önerilen)**
- Ücretsiz 25GB
- Video optimization
- CDN ile hızlı erişim

### **B) AWS S3**
- Scalable storage
- Pay-as-you-use
- Global CDN

### **C) Google Cloud Storage**
- Google'ın altyapısı
- Competitive pricing

## 🔧 Environment Variables

Production'da şunları ayarlayın:
```env
DATABASE_URL="your-production-db"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="https://your-domain.com"
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
```

## 📊 Database

Production database için:
- **PlanetScale** (MySQL)
- **Supabase** (PostgreSQL)
- **Railway** (PostgreSQL)
- **MongoDB Atlas**

## 🎬 Video Upload Setup

1. Cloudinary hesabı açın
2. Upload preset oluşturun
3. API keys'i environment'a ekleyin
4. Upload API'sini güncelleyin

## 🔒 Security

- Environment variables'ları güvenli tutun
- HTTPS kullanın
- Admin panelini koruyun
- Rate limiting ekleyin