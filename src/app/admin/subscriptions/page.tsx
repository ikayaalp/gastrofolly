import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import SubscriptionManagement from "./SubscriptionManagement"

export default async function SubscriptionsPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
        redirect('/auth/signin')
    }

    const plans = await prisma.subscriptionPlan.findMany({
        orderBy: {
            createdAt: 'desc'
        }
    })

    return <SubscriptionManagement plans={plans} />
}
