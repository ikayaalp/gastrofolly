import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import InstructorCoursesClient from "./InstructorCoursesClient"

async function getInstructorCourses(userId: string) {
  const courses = await prisma.course.findMany({
    where: { instructorId: userId },
    include: {
      category: true,
      reviews: true,
      lessons: {
        orderBy: { order: 'asc' }
      },
      _count: { 
        select: { 
          enrollments: true, 
          lessons: true 
        } 
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  })

  return { courses, categories }
}

export default async function InstructorCourses() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  const { courses, categories } = await getInstructorCourses(session.user.id)

  return (
    <InstructorCoursesClient
      courses={courses}
      categories={categories}
      session={session}
    />
  )
}
