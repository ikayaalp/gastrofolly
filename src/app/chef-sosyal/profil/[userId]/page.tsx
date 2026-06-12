import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import ChefProfilClient from "./ChefProfilClient"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

interface PageProps {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true }
  })

  return {
    title: user?.name ? `${user.name} - Chef Sosyal` : "Profil - Chef Sosyal",
    description: `${user?.name || 'Kullanıcı'} Chef Sosyal profili`
  }
}

export default async function ChefProfilPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  const { userId } = await params

  // Kullanıcı bilgilerini çek
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      coverImage: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          followers: true,
          following: true,
          topics: true,
        }
      }
    }
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Kullanıcı Bulunamadı</h1>
          <p className="text-gray-500">Bu profil mevcut değil veya kaldırılmış olabilir.</p>
        </div>
      </div>
    )
  }

  // Takip durumu
  let isFollowing = false
  if (session?.user?.id && session.user.id !== userId) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId
        }
      }
    })
    isFollowing = !!follow
  }

  // Kullanıcının gönderileri
  const topics = await prisma.topic.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
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

  // Toplam beğeni sayısını hesapla
  const totalLikes = await prisma.topic.aggregate({
    where: { authorId: userId },
    _sum: { likeCount: true }
  })

  const profileData = {
    ...user,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    topicsCount: user._count.topics,
    totalLikes: totalLikes._sum.likeCount || 0
  }

  return (
    <ChefProfilClient
      profile={profileData as any}
      initialTopics={topics as any}
      isFollowing={isFollowing}
      isOwnProfile={session?.user?.id === userId}
      currentUserId={session?.user?.id}
    />
  )
}
