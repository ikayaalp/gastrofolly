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

  // 2. Eğitmenin Toplam İzlenme Süresi (Dakika)
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
        select: { duration: true }
      }
    }
  })

  const instructorWatchMinutes = instructorProgress.reduce((acc, curr) => acc + (curr.lesson.duration || 0), 0)

  // 3. Sistemin Toplam İzlenme Süresi (Dakika)
  const systemProgress = await prisma.progress.findMany({
    where: {
      isCompleted: true
    },
    include: {
      lesson: {
        select: { duration: true }
      }
    }
  })

  const systemWatchMinutes = systemProgress.reduce((acc, curr) => acc + (curr.lesson.duration || 0), 0)

  // 4. Pay Hesaplama
  // Pay Oranı = (Eğitmen İzlenmesi / Sistem Toplam İzlenmesi)
  // Pay Getirisi = Pay Oranı * Toplam Havuz

  let shareAmount = 0
  let sharePercentage = 0

  if (systemWatchMinutes > 0) {
    sharePercentage = (instructorWatchMinutes / systemWatchMinutes) * 100
    shareAmount = (totalPool * sharePercentage) / 100
  }

  return {
    totalPool,
    instructorWatchMinutes,
    systemWatchMinutes,
    shareAmount,
    sharePercentage
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
