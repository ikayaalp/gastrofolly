import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ChefHat, BookOpen, Users, Wallet, Home, Bell } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
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
        <div className="min-h-screen bg-black text-white">
            {/* Desktop Header */}
            <header className="hidden md:block bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-8">
                            <Link href="/home" className="flex items-center space-x-2">
                                <ChefHat className="h-8 w-8 text-orange-500" />
                                <span className="text-2xl font-bold text-white">Chef2.0</span>
                                <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">Admin</span>
                            </Link>
                            <nav className="hidden md:flex space-x-6">
                                <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                                    Admin Paneli
                                </Link>
                                <Link href="/admin/courses" className="text-gray-300 hover:text-white transition-colors">
                                    Kurs Yönetimi
                                </Link>
                                <Link href="/admin/users" className="text-gray-300 hover:text-white transition-colors">
                                    Kullanıcı Yönetimi
                                </Link>
                                <Link href="/admin/pool" className="text-gray-300 hover:text-white transition-colors">
                                    Havuz Yönetimi
                                </Link>
                                <Link href="/admin/notifications" className="text-white font-semibold">
                                    Bildirimler
                                </Link>
                                <Link href="/admin/videos" className="text-gray-300 hover:text-white transition-colors">
                                    Video Yönetimi
                                </Link>
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <UserDropdown />
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Top Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800">
                <div className="flex justify-between items-center py-3 px-4">
                    <Link href="/home" className="flex items-center space-x-2">
                        <ChefHat className="h-6 w-6 text-orange-500" />
                        <span className="text-lg font-bold text-white">Chef2.0</span>
                        <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">Admin</span>
                    </Link>
                    <UserDropdown />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 md:pt-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Bildirim Merkezi</h1>
                    <p className="text-gray-400">Kullanıcılara push bildirimleri gönderin</p>
                </div>

                {/* Push Notification Sender */}
                <div className="max-w-2xl">
                    <PushNotificationSender courses={courses} />
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-t border-gray-800">
                <div className="flex justify-around items-center py-2">
                    <Link href="/admin" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
                        <Home className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Panel</span>
                    </Link>
                    <Link href="/admin/notifications" className="flex flex-col items-center py-2 px-3 text-orange-500">
                        <Bell className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Bildirim</span>
                    </Link>
                    <Link href="/admin/courses" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
                        <BookOpen className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Kurslar</span>
                    </Link>
                    <Link href="/admin/users" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
                        <Users className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Kullanıcılar</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
