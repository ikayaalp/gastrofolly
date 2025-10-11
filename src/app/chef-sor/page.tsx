import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ChefSorClient from "./ChefSorClient"

async function getUserEnrolledCourses(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          category: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return enrollments.map(enrollment => enrollment.course)
}

interface ChefSorPageProps {
  searchParams: Promise<{
    instructorId?: string
  }>
}

export default async function ChefSorPage({ searchParams }: ChefSorPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  // Sadece öğrenci ve admin erişebilir
  if (session.user.role === 'INSTRUCTOR') {
    redirect("/instructor-dashboard")
  }

  const enrolledCourses = await getUserEnrolledCourses(session.user.id)
  const resolvedSearchParams = await searchParams

  return (
    <ChefSorClient 
      enrolledCourses={enrolledCourses}
      session={session}
      selectedInstructorId={resolvedSearchParams.instructorId}
    />
  )
}
