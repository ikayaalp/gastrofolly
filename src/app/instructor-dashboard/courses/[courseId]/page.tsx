import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CourseEditClient from "./CourseEditClient"

async function getCourseData(courseId: string, userId: string) {
  const course = await prisma.course.findFirst({
    where: { 
      id: courseId,
      instructorId: userId 
    },
    include: {
      category: true,
      instructor: true,
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      lessons: {
        orderBy: { order: 'asc' }
      },
      _count: { 
        select: { 
          enrollments: true, 
          lessons: true 
        } 
      }
    }
  })

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  })

  return { course, categories }
}

export default async function CourseEdit({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  const { courseId } = await params
  const { course, categories } = await getCourseData(courseId, session.user.id)

  if (!course) {
    redirect("/instructor-dashboard/courses")
  }

  return (
    <CourseEditClient
      course={course}
      categories={categories}
      session={session}
    />
  )
}
