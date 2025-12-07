import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/mobileAuth'

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

        // Find the topic
        const topic = await prisma.topic.findUnique({
            where: { id },
            select: { authorId: true }
        })

        if (!topic) {
            return NextResponse.json(
                { error: 'Tartışma bulunamadı' },
                { status: 404 }
            )
        }

        // Check if user is the author
        if (topic.authorId !== user.id) {
            return NextResponse.json(
                { error: 'Bu tartışmayı silme yetkiniz yok' },
                { status: 403 }
            )
        }

        // Delete all posts (comments) in the topic first
        await prisma.post.deleteMany({
            where: { topicId: id }
        })

        // Delete the topic
        await prisma.topic.delete({
            where: { id }
        })

        return NextResponse.json({ success: true, message: 'Tartışma silindi' })

    } catch (error) {
        console.error('Delete topic error:', error)
        return NextResponse.json(
            { error: 'Tartışma silinirken bir hata oluştu' },
            { status: 500 }
        )
    }
}
