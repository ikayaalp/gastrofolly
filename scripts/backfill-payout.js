const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting backfill for payouts...");

    try {
        // 1. Progress tablosunda isCompleted=true olup completedAt=null olanlara watchedAt'i kopyala.
        const progressList = await prisma.progress.findMany({
            where: { isCompleted: true, completedAt: null }
        });

        console.log(`Found ${progressList.length} progress records to update.`);
        
        let progressCount = 0;
        for (const p of progressList) {
            await prisma.progress.update({
                where: { id: p.id },
                data: { completedAt: p.watchedAt }
            });
            progressCount++;
        }
        console.log(`✅ Updated ${progressCount} progress records.`);

        // 2. Ödeme (Payment) tablosundaki platform ve net->brüt dönüşümleri
        let paymentsUpdated = 0;

        // A) RevenueCat Apple/Google (rc_ ile başlayanlar)
        const rcPayments = await prisma.payment.findMany({
            where: { stripePaymentId: { startsWith: 'rc_' }, platform: null }
        });

        console.log(`Found ${rcPayments.length} RevenueCat payments without platform.`);

        for (const p of rcPayments) {
            // Eski kayıtlar net tutuyordu (Brüt = Net / (1 - 0.30)). 
            // Tüm rc_ geçmişini Apple varsayıyoruz. 
            // Google olan aboneler varsa, brütleri biraz fazla hesaplanmış olabilir (Apple %30 vs Google %15).
            const grossAmount = Math.round((p.amount / 0.70) * 100) / 100;
            
            await prisma.payment.update({
                where: { id: p.id },
                data: { 
                    platform: 'REVENUECAT_APPLE',
                    amount: grossAmount
                }
            });
            paymentsUpdated++;
        }
        if (rcPayments.length > 0) {
            console.warn("⚠️ NOTE: All past 'rc_' payments were converted using Apple's 30% cut. Google Play subscribers should be manually checked if precision is required.");
        }

        // B) Stripe (cs_ veya pi_ ile başlayanlar)
        const stripePayments = await prisma.payment.findMany({
            where: { 
                OR: [
                    { stripePaymentId: { startsWith: 'cs_' } },
                    { stripePaymentId: { startsWith: 'pi_' } }
                ],
                platform: null
            }
        });

        console.log(`Found ${stripePayments.length} Stripe payments without platform.`);

        for (const p of stripePayments) {
            await prisma.payment.update({
                where: { id: p.id },
                data: { platform: 'STRIPE' }
            });
            paymentsUpdated++;
        }

        // C) Geri kalan IYZICO varsayılabilir (Iyzico zaten brüt saklanıyordu)
        const iyzicoPayments = await prisma.payment.findMany({
            where: { platform: null }
        });

        console.log(`Found ${iyzicoPayments.length} Iyzico/other payments without platform.`);

        for (const p of iyzicoPayments) {
            await prisma.payment.update({
                where: { id: p.id },
                data: { platform: 'IYZICO' }
            });
            paymentsUpdated++;
        }

        console.log(`✅ Updated ${paymentsUpdated} payment records in total.`);
        console.log("Backfill completed successfully.");

    } catch (error) {
        console.error("Backfill failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
