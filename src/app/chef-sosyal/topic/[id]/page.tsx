import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ChefHat, Search, Bell, ArrowLeft, MessageCircle, ThumbsUp, Clock, User, Plus } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import { prisma } from "@/lib/prisma"
import TopicDetailClient from "./TopicDetailClient"

interface TopicDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TopicDetailPage({ params }: TopicDetailPageProps) {
  const session = await getServerSession(authOptions)
  const resolvedParams = await params

  // Başlığı ve yorumlarını çek
  const topic = await prisma.topic.findUnique({
    where: { id: resolvedParams.id },
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
      posts: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  })

  // Kategorileri çek (Sidebar için)
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

  if (!topic) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Başlık Bulunamadı</h1>
          <Link href="/chef-sosyal" className="text-orange-500 hover:text-orange-400">
            ← Chef Sosyal&apos;e Dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <TopicDetailClient
      session={session}
      topic={topic}
      categories={categories}
    />
  )
}
