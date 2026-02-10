import { getServerSession } from "next-auth/next"
import { Metadata } from "next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ChefSosyalClient from "./ChefSosyalClient"

// Next.js 13/14 App Router Page Props Interface
interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}


export const metadata: Metadata = {
  title: "Chef Sosyal",
  description: "Chef Sosyal ile yemek tutkunları ve profesyonel şeflerle etkileşime geçin. Deneyimlerinizi paylaşın, sorular sorun ve gastronomi dünyasındaki en son trendleri keşfedin.",
}

export default async function ChefSosyalPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  // URL parametrelerini al
  const categorySlug = searchParams.category as string | undefined
  const sort = searchParams.sort as string | undefined
  const search = searchParams.search as string | undefined

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

  // Filtreleme ve Sıralama Ayarları
  let whereClause: any = {}
  if (categorySlug && categorySlug !== 'all') {
    whereClause.category = {
      slug: categorySlug
    }
  }

  // Arama Filtresi
  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } }
    ]
  }

  let orderByClause: any = { createdAt: 'desc' }
  if (sort === 'popular') {
    orderByClause = [
      { likeCount: 'desc' },
      { createdAt: 'desc' }
    ]
  } else if (sort === 'mostReplies') {
    orderByClause = [
      { posts: { _count: 'desc' } },
      { createdAt: 'desc' }
    ]
  }

  // Veritabanından başlıkları çek
  const topicsData = await prisma.topic.findMany({
    where: whereClause,
    orderBy: orderByClause,
    take: 20, // Daha fazla içerik
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

  // Üye sayısını çek
  const memberCount = await prisma.user.count()

  // Trend hashtagleri çek
  let trendingHashtags: any[] = []
  try {
    const trendingHashtagsData = await (prisma as any).hashtag.findMany({
      take: 5,
      include: {
        _count: {
          select: {
            topics: true
          }
        }
      },
      where: {
        topics: {
          some: {}
        }
      },
      orderBy: {
        topics: {
          _count: 'desc'
        }
      }
    })

    trendingHashtags = trendingHashtagsData.map((h: any) => ({
      id: h.id,
      name: h.name,
      count: h._count.topics
    }))
  } catch (error) {
    console.error('Hashtag table not ready yet:', error)
    // Silently fail, just show no hashtags until DB is updated
  }

  // Topic tipinde dönüştür
  const topics = topicsData.map((topic: any) => ({
    ...topic,
    mediaType: topic.mediaType as 'IMAGE' | 'VIDEO' | null
  }))

  return (
    <ChefSosyalClient
      session={session}
      initialCategories={categories}
      initialTopics={topics as any}
      memberCount={memberCount}
      trendingHashtags={trendingHashtags}
    />
  )
}
