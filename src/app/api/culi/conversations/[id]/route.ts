import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - sohbetin mesajlarını getir
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const conversation = await prisma.aiConversation.findFirst({
        where: { id, userId: session.user.id },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
                select: {
                    id: true,
                    role: true,
                    content: true,
                    createdAt: true,
                },
            },
        },
    })

    if (!conversation) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ conversation })
}

// DELETE - sohbeti sil
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const conversation = await prisma.aiConversation.findFirst({
        where: { id, userId: session.user.id },
    })

    if (!conversation) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.aiConversation.delete({ where: { id } })

    return NextResponse.json({ success: true })
}
