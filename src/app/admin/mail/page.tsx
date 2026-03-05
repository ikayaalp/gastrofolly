import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import MailManagement from "./MailManagement"

export default async function AdminMailPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
        redirect('/auth/signin')
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            subscriptionPlan: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return <MailManagement users={users} />
}
