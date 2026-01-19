import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ChefSosyalClient from "./ChefSosyalClient"

export default async function ChefSosyalPage() {
  const session = await getServerSession(authOptions)

  // Veritabanından kategorileri çek
  const categories = await prisma.forumCategory.findMany({
    include: {
      _count: {
        select: {
          topics: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Veritabanından başlıkları çek
  const topicsData = await prisma.topic.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 10,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true
        }
      },
      _count: {
        select: {
          posts: true
        }
      }
    }
  })

  // Topic tipinde dönüştür - mediaType string olarak geliyor, cast ediyoruz
  const topics = topicsData.map((topic: any) => ({
    ...topic,
    mediaType: topic.mediaType as 'IMAGE' | 'VIDEO' | null
  }))

  return (
    <ChefSosyalClient
      session={session}
      initialCategories={categories}
      initialTopics={topics as any}
    />
  )
}
