require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Cloudinary yapılandırması
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Kullanım: node scripts/poc-signed-video.js <yerel_video_yolu>');
    console.error('Örnek: node scripts/poc-signed-video.js ./test-video.mp4');
    process.exit(1);
  }

  const filePath = args[0];

  if (!fs.existsSync(filePath)) {
    console.error(`Hata: Belirtilen dosya bulunamadı: ${filePath}`);
    process.exit(1);
  }

  console.log('--- Cloudinary HLS Signed URL POC Testi ---');
  console.log('1. Video yükleniyor (type: "authenticated", folder: "poc-test")...');

  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      type: 'authenticated',
      folder: 'poc-test',
    });

    console.log('✔ Yükleme başarılı!');
    console.log(`  Public ID: ${uploadResult.public_id}`);
    console.log(`  Type: ${uploadResult.type}\n`);

    const publicId = uploadResult.public_id;

    console.log('2. URL\'ler Üretiliyor...\n');

    // a. İmzalı düz mp4 URL
    const signedMp4Url = cloudinary.url(publicId, {
      resource_type: 'video',
      type: 'authenticated',
      sign_url: true
    });

    // b. İmzalı HLS URL (format: m3u8, streaming_profile: auto)
    // "sp_auto" dönüşümü uygulanıp öyle imzalanması gerekiyor
    const signedHlsUrl = cloudinary.url(publicId, {
      resource_type: 'video',
      type: 'authenticated',
      format: 'm3u8',
      transformation: [
        { streaming_profile: 'auto' }
      ],
      sign_url: true
    });

    // c. İmzasız URL (Test kontrolü için)
    const unsignedUrl = cloudinary.url(publicId, {
      resource_type: 'video',
      type: 'authenticated'
    });

    console.log('--- SONUÇLAR ---');
    console.log('A) İMZALI MP4 URL (Çalışması beklenir):');
    console.log(signedMp4Url, '\n');

    console.log('B) İMZALI HLS URL (Testin asıl odak noktası - çalışması beklenir):');
    console.log(signedHlsUrl, '\n');

    console.log('C) İMZASIZ KONTROL URL\'i (401 veya 403 dönmesi beklenir):');
    console.log(unsignedUrl, '\n');

    console.log('--- TEST TALİMATI ---');
    console.log('A ve B URL\'lerini tarayıcıda (veya bir video player ile) açarak izlenebildiğini doğrulayın.');
    console.log('B (HLS) URL\'sinin Safari veya m3u8 destekleyen bir oynatıcıda (örneğin VLC) düzgün yayınlanıp yayınlanmadığını test edin.');
    console.log('C URL\'sini açtığınızda Cloudinary\'nin izinsiz erişim hatası (401 Unauthorized) verdiğini teyit edin.');

  } catch (error) {
    console.error('Test sırasında bir hata oluştu:');
    console.error(error);
  }
}

main();
