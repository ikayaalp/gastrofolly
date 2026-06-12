const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupExpired() {
    const now = new Date();
    
    const result = await prisma.user.updateMany({
        where: {
            subscriptionPlan: { not: null },
            subscriptionEndDate: { lt: now }
        },
        data: {
            subscriptionPlan: null,
            subscriptionStartDate: null,
            subscriptionEndDate: null,
            subscriptionReferenceCode: null,
            subscriptionCancelled: false,
        }
    });

    console.log(`✅ ${result.count} süresi dolmuş abonelik temizlendi → normal kullanıcıya döndürüldü`);
    await prisma.$disconnect();
}

cleanupExpired().catch(e => {
    console.error('Hata:', e);
    process.exit(1);
});
