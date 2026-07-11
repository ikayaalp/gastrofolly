import { PrismaClient } from '@prisma/client';

export function isPremiumUser(user: { subscriptionPlan?: string | null; subscriptionEndDate?: Date | string | null } | null | undefined): boolean {
    if (!user) return false;
    
    // subscriptionPlan artık her zaman "Premium" olacağı için basit eşitlik yeterli
    if (user.subscriptionPlan !== 'Premium') return false;
    
    // Geçiş sürecinde/edge case'lerde null endDate geçerli sayılıyor (projede çoğunluk kuralı)
    if (!user.subscriptionEndDate) return true;
    
    return new Date(user.subscriptionEndDate) > new Date();
}

export async function lazyCleanupExpiredSubscription(prisma: PrismaClient, user: any) {
    if (user.subscriptionPlan === 'Premium' && user.subscriptionEndDate && new Date(user.subscriptionEndDate) < new Date()) {
        await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionPlan: null, subscriptionStartDate: null, subscriptionEndDate: null, subscriptionBillingPeriod: null, subscriptionReferenceCode: null, subscriptionCancelled: false }
        });
        user.subscriptionPlan = null;
        user.subscriptionStartDate = null;
        user.subscriptionEndDate = null;
        user.subscriptionBillingPeriod = null;
        user.subscriptionReferenceCode = null;
    }
}
