import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - tüm sohbetleri listele
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversations = await prisma.aiConversation.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            title: true,
            updatedAt: true,
        },
    })

    return NextResponse.json({ conversations })
}

// POST - yeni sohbet oluştur
export async function POST() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversation = await prisma.aiConversation.create({
        data: {
            userId: session.user.id,
            title: 'Yeni Sohbet',
        },
    })

    return NextResponse.json({ conversation })
}
