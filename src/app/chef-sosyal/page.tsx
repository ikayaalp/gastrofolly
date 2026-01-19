import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ChefSosyalClient from "./ChefSosyalClient"

// Next.js 13/14 App Router Page Props Interface
interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
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
    orderByClause = { likeCount: 'desc' }
  } else if (sort === 'mostReplies') {
    orderByClause = { posts: { _count: 'desc' } }
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
    />
  )
}
