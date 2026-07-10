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

    const { blockedId } = await req.json()

    if (!blockedId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    if (session.user.id === blockedId) {
      return new NextResponse('Cannot block yourself', { status: 400 })
    }

    // Check if block already exists
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId,
        },
      },
    })

    if (existingBlock) {
      // Unblock if it already exists
      await prisma.block.delete({
        where: { id: existingBlock.id },
      })
      return NextResponse.json({ success: true, action: 'unblocked' })
    }

    // Create block
    const block = await prisma.block.create({
      data: {
        blockerId: session.user.id,
        blockedId,
      },
    })

    return NextResponse.json({ success: true, action: 'blocked', block })
  } catch (error) {
    console.error('Error blocking user:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const blocks = await prisma.block.findMany({
      where: { blockerId: session.user.id },
      select: { blockedId: true },
    })

    return NextResponse.json({ blockedIds: blocks.map((b) => b.blockedId) })
  } catch (error) {
    console.error('Error getting blocks:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
