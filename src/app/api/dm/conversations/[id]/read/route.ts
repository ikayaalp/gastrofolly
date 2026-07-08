import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser(request)
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id: conversationId } = await params

        // Check if participant exists
        const participant = await prisma.conversationParticipant.findUnique({
            where: { conversationId_userId: { conversationId, userId: user.id } }
        })

        if (!participant) {
            return NextResponse.json({ error: 'Bu konuşmaya erişim yetkiniz yok' }, { status: 403 })
        }

        await prisma.conversationParticipant.update({
            where: { conversationId_userId: { conversationId, userId: user.id } },
            data: { lastReadAt: new Date() }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
