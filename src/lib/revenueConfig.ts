import { PaymentPlatform } from "@prisma/client"

export const REVENUE_TRACKING_START = new Date('2026-02-21T10:00:00.000Z')
export const HISTORICAL_REVENUE_OFFSET = 85

export const POOL_PERCENTAGE = 0.25

export const COMMISSION_RATES: Record<PaymentPlatform, number> = {
    IYZICO: 0.03,
    STRIPE: 0.029,
    REVENUECAT_APPLE: 0.30,
    REVENUECAT_GOOGLE: 0.15,
}

/**
 * Brüt tutar (müşterinin ödediği) üzerinden komisyonları
 * çıkararak "NET" geliri hesaplar.
 */
export function calculateNetRevenue(grossAmount: number, platform: PaymentPlatform | null): number {
    if (!platform || grossAmount <= 0) {
        return grossAmount;
    }

    const rate = COMMISSION_RATES[platform] ?? 0
    return Math.round(grossAmount * (1 - rate) * 100) / 100
}

/**
 * Net gelir üzerinden havuza aktarılacak payı hesaplar.
 */
export function calculatePoolAmount(netRevenue: number): number {
    return netRevenue * POOL_PERCENTAGE;
}
