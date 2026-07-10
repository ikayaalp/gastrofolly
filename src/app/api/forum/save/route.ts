import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { topicId } = await req.json()

    if (!topicId) {
      return new NextResponse('Missing topicId', { status: 400 })
    }

    const existingSave = await prisma.savedTopic.findUnique({
      where: {
        userId_topicId: {
          userId: session.user.id,
          topicId,
        },
      },
    })

    if (existingSave) {
      // Unsave
      await prisma.savedTopic.delete({
        where: { id: existingSave.id },
      })
      return NextResponse.json({ success: true, saved: false })
    }

    // Save
    await prisma.savedTopic.create({
      data: {
        userId: session.user.id,
        topicId,
      },
    })

    return NextResponse.json({ success: true, saved: true })
  } catch (error) {
    console.error('Error saving topic:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const savedTopics = await prisma.savedTopic.findMany({
      where: { userId: session.user.id },
      select: { topicId: true },
    })

    return NextResponse.json({ savedTopicIds: savedTopics.map((s) => s.topicId) })
  } catch (error) {
    console.error('Error getting saved topics:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
