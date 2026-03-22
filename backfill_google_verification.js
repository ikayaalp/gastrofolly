const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Google Kullanıcılarını Doğrulama (Backfill) Başlatıldı ---');
        
        // Google hesabı olan ama doğrulanmamış kullanıcıları bul
        const unverifiedGoogleUsers = await prisma.user.findMany({
            where: {
                emailVerified: null,
                accounts: {
                    some: { provider: 'google' }
                }
            }
        });

        console.log(`Bulunan doğrulanmamış Google kullanıcısı: ${unverifiedGoogleUsers.length}`);

        for (const user of unverifiedGoogleUsers) {
            await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: new Date() }
            });
            console.log(`Güncellendi: ${user.email}`);
        }

        console.log('--- İşlem Başarıyla Tamamlandı ---');
    } catch (e) {
        console.error('Hata:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
