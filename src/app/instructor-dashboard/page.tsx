import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import InstructorDashboardClient from "./InstructorDashboardClient"

async function getInstructorData(userId: string) {
  const [
    courses,
    totalStudents,
    totalRevenue,
    recentMessages,
    courseStats
  ] = await Promise.all([
    // Eğitmenin kursları
    prisma.course.findMany({
      where: { instructorId: userId },
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
          }
        },
        _count: { select: { enrollments: true, lessons: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    // Toplam öğrenci sayısı
    prisma.enrollment.count({
      where: {
        course: { instructorId: userId }
      }
    }),
    // Toplam gelir (basit hesaplama)
    prisma.enrollment.findMany({
      where: {
        course: { instructorId: userId }
      },
      include: {
        course: {
          select: { price: true }
        }
      }
    }).then(enrollments => 
      enrollments.reduce((total, enrollment) => total + enrollment.course.price, 0)
    ),

        // Son Chef&apos;e Sor
        prisma.message.findMany({
          where: {
            course: { instructorId: userId }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            },
            course: {
              select: {
                id: true,
                title: true,
                imageUrl: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
    // Kurs istatistikleri
    prisma.course.findMany({
      where: { instructorId: userId },
      include: {
        _count: { select: { enrollments: true, lessons: true } },
        reviews: {
          select: { rating: true }
        }
      }
    })
  ])

  return {
    courses,
    totalStudents,
    totalRevenue,
    recentMessages,
    courseStats
  }
}

export default async function InstructorDashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  const instructorData = await getInstructorData(session.user.id)

  return (
    <InstructorDashboardClient
      instructorData={instructorData}
      session={session}
    />
  )
}
