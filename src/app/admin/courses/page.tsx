import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import CourseManagement from "./CourseManagement"

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  const [categories, instructors] = await Promise.all([
    prisma.category.findMany(),
    prisma.user.findMany({
      where: { role: 'INSTRUCTOR' },
      select: { id: true, name: true, email: true, image: true }
    })
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-white">Kurs Yönetimi</h1>
        <p className="text-gray-400">Kursları, dersleri ve abonelik erişimlerini buradan yönetebilirsiniz.</p>
      </div>

      <CourseManagement
        categories={categories}
        instructors={instructors}
      />
    </div>
  )
}
