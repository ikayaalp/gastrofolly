import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { targetType, targetId, reason, description } = await req.json()

    if (!targetType || !targetId || !reason) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const reportData: any = {
      reporterId: session.user.id,
      reason,
      description,
      status: 'PENDING',
    }

    if (targetType === 'topic') {
      reportData.topicId = targetId
    } else if (targetType === 'post') {
      reportData.postId = targetId
    } else {
      return new NextResponse('Invalid target type', { status: 400 })
    }

    const report = await prisma.report.create({
      data: reportData,
    })

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error('Error creating report:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
