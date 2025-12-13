import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import VideoManagement from "./VideoManagement"

async function getLessonsWithoutVideos() {
  const lessons = await prisma.lesson.findMany({
    where: {
      OR: [
        { videoUrl: null },
        { videoUrl: "" }
      ]
    },
    include: {
      course: {
        select: {
          title: true,
          id: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return lessons
}

async function getAllLessons() {
  const lessons = await prisma.lesson.findMany({
    include: {
      course: {
        select: {
          title: true,
          id: true
        }
      }
    },
    orderBy: [
      { course: { title: 'asc' } },
      { order: 'asc' }
    ]
  })

  return lessons
}

export default async function VideoManagementPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect("/auth/signin")
  }

  const [lessonsWithoutVideos, allLessons] = await Promise.all([
    getLessonsWithoutVideos(),
    getAllLessons()
  ])

  return (
    <VideoManagement
      lessonsWithoutVideos={lessonsWithoutVideos}
      allLessons={allLessons}
    />
  )
}
