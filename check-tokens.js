const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    try {
        // Push token olan kullanıcı sayısı
        const count = await prisma.user.count({
            where: { pushToken: { not: null } }
        });
        console.log('Push token olan kullanıcı sayısı:', count);

        // Örnek tokenlar
        const sample = await prisma.user.findMany({
            where: { pushToken: { not: null } },
            take: 5,
            select: { email: true, pushToken: true, updatedAt: true }
        });
        console.log('Örnekler:', JSON.stringify(sample, null, 2));

        // Toplam kullanıcı sayısı
        const total = await prisma.user.count();
        console.log('Toplam kullanıcı sayısı:', total);

        // Son 5 dakikada güncellenen kullanıcılar
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentlyUpdated = await prisma.user.findMany({
            where: { updatedAt: { gte: fiveMinutesAgo } },
            select: { email: true, pushToken: true, updatedAt: true }
        });
        console.log('Son 5 dakikada güncellenen:', JSON.stringify(recentlyUpdated, null, 2));

    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);
