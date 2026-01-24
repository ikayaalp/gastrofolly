import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import InstructorDashboardClient from "./InstructorDashboardClient"

async function getInstructorData(userId: string) {
  // 1. Toplam Havuz Parası (Tüm enrollment gelirleri)
  const allEnrollments = await prisma.enrollment.findMany({
    include: {
      course: {
        select: { price: true }
      }
    }
  })

  // Toplam havuz miktarı
  const totalPool = allEnrollments.reduce((acc, curr) => acc + curr.course.price, 0)

  // 2. Eğitmenin İzlenme Detayları (Katsayı Sistemi Kaldırıldı: 1 Dk = 1 Puan)
  const instructorProgress = await prisma.progress.findMany({
    where: {
      lesson: {
        course: {
          instructorId: userId
        }
      },
      isCompleted: true
    },
    include: {
      lesson: {
        include: {
          course: {
            select: { title: true }
          }
        }
      }
    }
  })

  // Watch minutes grouped by course
  const courseStatsMap = new Map<string, number>();

  instructorProgress.forEach(p => {
    const courseTitle = p.lesson.course.title;
    const duration = p.lesson.duration || 0;
    if (courseStatsMap.has(courseTitle)) {
      courseStatsMap.set(courseTitle, courseStatsMap.get(courseTitle)! + duration);
    } else {
      courseStatsMap.set(courseTitle, duration);
    }
  });

  const instructorWatchMinutes = Array.from(courseStatsMap.values()).reduce((a, b) => a + b, 0);
  const instructorTotalPoints = instructorWatchMinutes // 1 Dk = 1 Puan

  const courseStats = Array.from(courseStatsMap.entries()).map(([title, minutes]) => ({
    title,
    minutes,
    points: minutes // 1 Dk = 1 Puan
  })).sort((a, b) => b.points - a.points);

  // 3. Sistem Toplam Puanı Hesaplama
  const systemProgress = await prisma.progress.findMany({
    where: { isCompleted: true },
    include: {
      lesson: {
        select: {
          duration: true
        }
      }
    }
  })

  let systemWatchMinutes = 0
  let systemTotalPoints = 0

  systemProgress.forEach(p => {
    const duration = p.lesson.duration || 0
    systemWatchMinutes += duration
    systemTotalPoints += duration // 1 Dk = 1 Puan
  })

  // 4. Pay Hesaplama
  let shareAmount = 0
  let sharePercentage = 0

  if (systemTotalPoints > 0) {
    sharePercentage = (instructorTotalPoints / systemTotalPoints) * 100
    shareAmount = (totalPool * sharePercentage) / 100
  }

  return {
    totalPool,
    instructorWatchMinutes,
    systemWatchMinutes,
    instructorTotalPoints,
    systemTotalPoints,
    shareAmount,
    sharePercentage,
    courseStats,
    instructorCoefficient: 1 // Artık her zaman 1
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
