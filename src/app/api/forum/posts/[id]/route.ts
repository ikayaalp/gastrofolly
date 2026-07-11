import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/mobileAuth'
import { deleteForumPost } from '@/lib/forumDelete'


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

        // Check if user is the author or an Admin
        if (post.authorId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Bu yorumu silme yetkiniz yok' },
                { status: 403 }
            )
        }

        // Use shared deletion logic
        const deleted = await deleteForumPost(id)

        if (!deleted) {
            return NextResponse.json(
                { error: 'Yorum silinirken bir hata oluştu veya bulunamadı' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, message: 'Yorum silindi' })

    } catch (error) {
        console.error('Delete post error:', error)
        return NextResponse.json(
            { error: 'Yorum silinirken bir hata oluştu' },
            { status: 500 }
        )
    }
}

export async function PUT(
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
        let { content } = await request.json()
        content = content?.trim()

        if (!content) {
            return NextResponse.json(
                { error: 'Yorum içeriği boş olamaz' },
                { status: 400 }
            )
        }

        const MAX_POST_LENGTH = 2000;
        if (content.length > MAX_POST_LENGTH) {
            return NextResponse.json(
                { error: `İçerik çok uzun (maksimum ${MAX_POST_LENGTH} karakter)` },
                { status: 400 }
            )
        }

        // Check profanity
        const { containsProfanity } = await import('@/lib/profanity')
        if (containsProfanity(content)) {
            return NextResponse.json(
                { error: 'İçeriğinizde uygunsuz ifadeler tespit edildi. Lütfen düzenleyip tekrar deneyin.' },
                { status: 400 }
            )
        }

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
                { error: 'Bu yorumu düzenleme yetkiniz yok' },
                { status: 403 }
            )
        }

        // Update post
        const updatedPost = await prisma.post.update({
            where: { id },
            data: { content }
        })

        return NextResponse.json({ success: true, post: updatedPost })

    } catch (error) {
        console.error('Update post error:', error)
        return NextResponse.json(
            { error: 'Yorum güncellenirken bir hata oluştu' },
            { status: 500 }
        )
    }
}

