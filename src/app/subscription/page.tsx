import { prisma } from "@/lib/prisma"
import SubscriptionClient from "./SubscriptionClient"

export default async function SubscriptionPage() {
    const plans = await prisma.subscriptionPlan.findMany({
        where: { isActive: true }
    })

    const monthlyPlan = plans.find(p => p.interval === 'monthly')
    const yearlyPlan = plans.find(p => p.interval === 'yearly')

    const monthlyPrice = monthlyPlan?.price || 249.99
    const yearlyPrice = yearlyPlan?.price || 2499.99

    return <SubscriptionClient monthlyPrice={monthlyPrice} yearlyPrice={yearlyPrice} />
}
