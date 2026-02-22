import Link from "next/link"
import { Metadata } from "next"
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

export async function generateMetadata({ params }: TopicDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const topic = await prisma.topic.findUnique({
    where: { id },
    select: { title: true }
  })

  return {
    title: topic?.title || "Konu Detayı",
    description: topic ? `Chef Sosyal'de "${topic.title}" konusunu keşfedin ve tartışmaya katılın.` : "Chef Sosyal konu detayı.",
    robots: {
      index: false,
      follow: true,
    },
  }
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

  // Fetch initial like status if user is logged in
  let initialIsLiked = false;
  let initialLikedComments: string[] = [];

  if (session?.user?.id) {
    const userId = session.user.id;

    // Check topic like
    const topicLike = await prisma.topicLike.findUnique({
      where: {
        userId_topicId: {
          userId,
          topicId: resolvedParams.id
        }
      }
    });
    initialIsLiked = !!topicLike;

    // Check post likes for this topic
    const postLikes = await prisma.postLike.findMany({
      where: {
        userId,
        post: {
          topicId: resolvedParams.id
        }
      },
      select: {
        postId: true
      }
    });
    initialLikedComments = postLikes.map(pl => pl.postId);
  }

  return (
    <TopicDetailClient
      session={session}
      topic={{
        ...topic,
        mediaType: (topic as any).mediaType as 'IMAGE' | 'VIDEO' | null
      }}
      categories={categories}
      initialIsLiked={initialIsLiked}
      initialLikedComments={initialLikedComments}
    />
  )
}
