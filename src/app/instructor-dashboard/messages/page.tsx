import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import InstructorMessagesClient from "./InstructorMessagesClient"

async function getInstructorMessages(userId: string) {
  const messages = await prisma.message.findMany({
    where: {
      course: { instructorId: userId }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      course: {
        select: {
          id: true,
          title: true,
          imageUrl: true
        }
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return messages
}

export default async function InstructorMessages() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  const messages = await getInstructorMessages(session.user.id)

  return (
    <InstructorMessagesClient
      messages={messages}
      session={session}
    />
  )
}
