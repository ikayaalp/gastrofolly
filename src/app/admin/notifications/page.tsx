import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import PushNotificationSender from "@/components/admin/PushNotificationSender"

async function getCourses() {
    const courses = await prisma.course.findMany({
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' }
    })
    return courses
}

export default async function NotificationsPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/auth/signin")
    }

    // Admin kontrolü
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
        redirect("/dashboard")
    }

    const courses = await getCourses()

    return (
        <div className="space-y-8">
            <div className="border-b border-gray-800 pb-6">
                <h1 className="text-3xl font-bold text-white">Bildirim Merkezi</h1>
                <p className="text-gray-400 mt-2">Kullanıcılara anlık bildirimler gönderin</p>
            </div>

            {/* Push Notification Sender */}
            <div className="max-w-3xl">
                <PushNotificationSender courses={courses} />
            </div>
        </div>
    )
}
