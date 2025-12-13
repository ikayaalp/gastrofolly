import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import InstructorDashboardClient from "./InstructorDashboardClient"

async function getInstructorData(userId: string) {
  // 1. Toplam Havuz Parası (Tüm enrollment gelirleri)
  // Not: Payment tablosu yerine şimdilik Enrollment tablosu üzerinden gidiyoruz
  // çünkü Enrollment tablosunda Course -> Price ilişkisi var.
  const allEnrollments = await prisma.enrollment.findMany({
    include: {
      course: {
        select: { price: true }
      }
    }
  })

  const totalPool = allEnrollments.reduce((acc, curr) => acc + curr.course.price, 0)

  // 2. Katsayıları Belirle (Admin mantığına göre)
  // Commis: 1, Chef D party: 2, Executive: 3
  const getCoefficient = (plan: string | null) => {
    if (!plan) return 1
    const lowerPlan = plan.toLowerCase()
    if (lowerPlan.includes('executive')) return 3
    if (lowerPlan.includes('chef d')) return 2 // 'chef d party' coverage
    return 1
  }

  // Mevcut eğitmenin bilgilerini çek (Katsayısı için)
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionPlan: true }
  })
  const instructorCoefficient = getCoefficient(currentUser?.subscriptionPlan || null)

  // 3. Eğitmenin İzlenme ve Puan Detayları
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
  const instructorTotalPoints = instructorWatchMinutes * instructorCoefficient

  const courseStats = Array.from(courseStatsMap.entries()).map(([title, minutes]) => ({
    title,
    minutes,
    points: minutes * instructorCoefficient // Course specific points
  })).sort((a, b) => b.points - a.points);

  // 4. Sistem Toplam Puanı Hesaplama (Havuz Payı için gerekli)
  // Tüm eğitmenlerin katsayılarını almamız gerek
  const allInstructors = await prisma.user.findMany({
    where: { role: 'INSTRUCTOR' },
    select: { id: true, subscriptionPlan: true }
  })

  // Instructor ID -> Coefficient Map
  const instructorCoeffMap = new Map<string, number>()
  allInstructors.forEach(i => {
    instructorCoeffMap.set(i.id, getCoefficient(i.subscriptionPlan))
  })

  // Sistemin tamamındaki izlenmeleri çek
  const systemProgress = await prisma.progress.findMany({
    where: { isCompleted: true },
    include: {
      lesson: {
        select: {
          duration: true,
          course: {
            select: { instructorId: true }
          }
        }
      }
    }
  })

  let systemWatchMinutes = 0
  let systemTotalPoints = 0

  systemProgress.forEach(p => {
    const duration = p.lesson.duration || 0
    const iId = p.lesson.course.instructorId
    const coeff = instructorCoeffMap.get(iId) || 1 // Varsayılan 1

    systemWatchMinutes += duration
    systemTotalPoints += (duration * coeff)
  })

  // 5. Pay Hesaplama (Puan üzerinden)
  // Pay Oranı = (Eğitmen Puanı / Sistem Toplam Puanı)
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
    instructorCoefficient // Katsayıyı da döndürelim, belki UI'da gösteririz
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
