import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import InstructorProfileClient from "./InstructorProfileClient"

async function getInstructorData(userId: string) {
  const instructor = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          reviews: true,
          enrollments: true
        }
      }
    }
  })

  // Eğitmenin kurslarını ayrı olarak getir
  const courses = await prisma.course.findMany({
    where: {
      instructorId: userId
    },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      imageUrl: true,
      isPublished: true,
      createdAt: true,
      _count: {
        select: {
          enrollments: true,
          lessons: true,
          reviews: true
        }
      }
    }
  })

  return {
    ...instructor,
    courses,
    _count: {
      ...instructor?._count,
      courses: courses.length
    }
  }
}

export default async function InstructorProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  const instructorData = await getInstructorData(session.user.id)

  if (!instructorData) {
    redirect("/auth/signin")
  }

  return (
    <InstructorProfileClient
      instructorData={instructorData}
      session={session}
    />
  )
}
