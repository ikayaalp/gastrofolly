// Bugünkü yanlış fiyatlı ödeme kaydını düzelt
const { PrismaClient } = require('@prisma/client');

async function fixTodayPayment() {
    const prisma = new PrismaClient();
    
    try {
        // Bugünün başlangıcı (UTC)
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        
        // Bugün oluşturulan RevenueCat ödemelerini bul
        const todayPayments = await prisma.payment.findMany({
            where: {
                createdAt: { gte: todayStart },
                status: 'COMPLETED',
                stripePaymentId: { startsWith: 'rc_' }, // RevenueCat ödemeleri
            },
            include: {
                user: { select: { name: true, email: true } }
            }
        });
        
        console.log(`Bugün ${todayPayments.length} RevenueCat ödeme kaydı bulundu:\n`);
        
        for (const p of todayPayments) {
            console.log(`ID: ${p.id}`);
            console.log(`Kullanıcı: ${p.user.name} (${p.user.email})`);
            console.log(`Mevcut tutar: ${p.amount} ${p.currency}`);
            console.log(`Periyot: ${p.billingPeriod}`);
            console.log(`Tarih: ${p.createdAt}`);
            console.log(`Ref: ${p.stripePaymentId}`);
            
            // Yanlış fiyatla kaydedilmiş ödemeyi düzelt
            // Eski: 279.30 (399 * 0.70) → Yeni: 175.00 (249.99 * 0.70) Apple aylık
            // Eski: 2799.30 (3999 * 0.70) → Yeni: 1750.00 (2499.99 * 0.70) Apple yıllık
            
            let newAmount;
            if (p.amount === 279.3 || Math.abs(p.amount - 279.3) < 1) {
                // Aylık Apple - eski fiyattan kaydedilmiş
                newAmount = Math.round(249.99 * 0.70 * 100) / 100; // 175.00
                console.log(`→ Düzeltme: ${p.amount} → ${newAmount} (Aylık Apple, 249.99 × 0.70)`);
            } else if (p.amount === 2799.3 || Math.abs(p.amount - 2799.3) < 1) {
                // Yıllık Apple - eski fiyattan kaydedilmiş  
                newAmount = Math.round(2499.99 * 0.70 * 100) / 100; // 1750.00
                console.log(`→ Düzeltme: ${p.amount} → ${newAmount} (Yıllık Apple, 2499.99 × 0.70)`);
            } else {
                console.log(`→ Bu kayıt beklenmeyen tutarda, manuel kontrol gerekli.`);
                continue;
            }
            
            await prisma.payment.update({
                where: { id: p.id },
                data: { amount: newAmount }
            });
            
            console.log(`✅ Güncellendi!\n`);
        }
        
        if (todayPayments.length === 0) {
            console.log('Bugün RevenueCat üzerinden ödeme kaydı bulunamadı.');
        }
        
    } catch (error) {
        console.error('Hata:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixTodayPayment();
