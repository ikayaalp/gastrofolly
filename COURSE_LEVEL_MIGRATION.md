# Course Level Migration Guide

## Problem
Vercel deployment'ta enum değişikliği hatası alıyorsunuz çünkü production veritabanında hala eski değerler (BEGINNER, INTERMEDIATE, ADVANCED) var.

## Çözüm Adımları

### Seçenek 1: Manuel SQL ile Güncelleme (Önerilen)

Vercel Dashboard'dan veya production veritabanınıza bağlanarak şu SQL komutlarını çalıştırın:

```sql
-- 1. Önce mevcut değerleri yeni değerlere çevir
UPDATE "Course" SET level = 'COMMIS' WHERE level = 'BEGINNER';
UPDATE "Course" SET level = 'CHEF_DE_PARTIE' WHERE level = 'INTERMEDIATE';
UPDATE "Course" SET level = 'EXECUTIVE' WHERE level = 'ADVANCED';

-- 2. Ardından enum'u güncelle (Prisma otomatik yapacak)
```

### Seçenek 2: Migration Script ile

1. Production DATABASE_URL'inizi local .env dosyasına ekleyin (geçici olarak)
2. Migration scriptini çalıştırın:
   ```bash
   node scripts/migrate-course-levels.js
   ```
3. Ardından Vercel'de yeniden deploy edin

### Seçenek 3: Veritabanını Sıfırlama (Sadece Development için)

Eğer production verisi önemli değilse:

1. Vercel Dashboard > Storage > Postgres > Data > Query
2. Tüm tabloları sil:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
3. Yeniden deploy edin (Prisma otomatik tablo oluşturacak)
4. Seed endpoint'ini çağırın: `POST https://your-app.vercel.app/api/seed`

## Önerilen Yaklaşım

**Seçenek 1**'i kullanmanızı öneririm. Vercel Postgres dashboard'undan SQL Query çalıştırabilirsiniz:

1. Vercel Dashboard'a gidin
2. Storage > Your Database > Data > Query
3. Yukarıdaki UPDATE komutlarını çalıştırın
4. Yeniden deploy edin

Bu şekilde mevcut verileriniz korunur ve enum güvenli bir şekilde güncellenir.
