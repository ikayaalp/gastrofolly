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

        // Find the post
        const post = await prisma.post.findUnique({
            where: { id },
            select: { authorId: true }
        })

        if (!post) {
            return NextResponse.json(
                { error: 'Yorum bulunamadı' },
                { status: 404 }
            )
        }

        // Check if user is the author
        if (post.authorId !== user.id) {
            return NextResponse.json(
                { error: 'Bu yorumu silme yetkiniz yok' },
                { status: 403 }
            )
        }

        // Delete the post and its replies
        await prisma.post.deleteMany({
            where: {
                OR: [
                    { id },
                    { parentId: id }
                ]
            }
        })

        return NextResponse.json({ success: true, message: 'Yorum silindi' })

    } catch (error) {
        console.error('Delete post error:', error)
        return NextResponse.json(
            { error: 'Yorum silinirken bir hata oluştu' },
            { status: 500 }
        )
    }
}
