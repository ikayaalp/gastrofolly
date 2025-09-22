import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ChefHat, Search, Bell, Plus, MessageCircle, ThumbsUp, Clock, User } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
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
  const topics = await prisma.topic.findMany({
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

  return (
    <ChefSosyalClient 
      session={session} 
      initialCategories={categories} 
      initialTopics={topics}
    />
  )
}
