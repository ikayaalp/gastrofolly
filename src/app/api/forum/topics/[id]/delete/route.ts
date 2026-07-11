import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/mobileAuth'
import { deleteForumTopic } from '@/lib/forumDelete'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request)

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = await params

        // Find the topic with media info
        const topic = await prisma.topic.findUnique({
            where: { id },
            select: {
                authorId: true,
                mediaUrl: true,
                mediaType: true
            }
        })

        if (!topic) {
            return NextResponse.json(
                { error: 'Tartışma bulunamadı' },
                { status: 404 }
            )
        }

        // Check if user is the author or an Admin
        if (topic.authorId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Bu tartışmayı silme yetkiniz yok' },
                { status: 403 }
            )
        }

        // Use shared deletion logic
        const deleted = await deleteForumTopic(id)

        if (!deleted) {
            return NextResponse.json(
                { error: 'Tartışma silinirken bir hata oluştu veya bulunamadı' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, message: 'Tartışma silindi' })

    } catch (error) {
        console.error('Delete topic error:', error)
        return NextResponse.json(
            { error: 'Tartışma silinirken bir hata oluştu' },
            { status: 500 }
        )
    }
}
