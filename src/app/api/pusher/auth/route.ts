import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { pusherServer } from '@/lib/pusher'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    const user = await getAuthUser(request)
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let socketId: string
    let channelName: string

    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
        const body = await request.json()
        socketId = body.socket_id
        channelName = body.channel_name
    } else {
        const formData = await request.formData()
        socketId = formData.get('socket_id') as string
        channelName = formData.get('channel_name') as string
    }

    if (!socketId || !channelName) {
        return NextResponse.json({ error: 'socket_id ve channel_name gerekli' }, { status: 400 })
    }

    if (channelName === `private-user-${user.id}`) {
        const authResponse = pusherServer.authorizeChannel(socketId, channelName)
        return NextResponse.json(authResponse)
    }

    if (channelName.startsWith('private-conversation-')) {
        const conversationId = channelName.replace('private-conversation-', '')
        const participant = await prisma.conversationParticipant.findUnique({
            where: { conversationId_userId: { conversationId, userId: user.id } }
        })
        if (!participant) {
            return NextResponse.json({ error: 'Bu konuşmaya erişim yetkiniz yok' }, { status: 403 })
        }
        const authResponse = pusherServer.authorizeChannel(socketId, channelName)
        return NextResponse.json(authResponse)
    }

    return NextResponse.json({ error: 'Geçersiz kanal' }, { status: 403 })
}
