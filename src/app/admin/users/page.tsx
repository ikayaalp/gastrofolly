import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import UserManagement from "./UserManagement"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  // Kullanıcıları getir
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          createdCourses: true,
          enrollments: true,
          reviews: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return <UserManagement users={users} />
}
