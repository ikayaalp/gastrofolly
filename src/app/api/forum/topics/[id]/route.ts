import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/mobileAuth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Get current user if logged in (for poll vote check)
        let user = null
        try {
            user = await getAuthUser(request)
        } catch (e) {
            // Ignore auth error for public view
        }

        // Get topic with author and category
        const topic = await prisma.topic.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        color: true
                    }
                },
                poll: {
                    include: {
                        options: {
                            include: {
                                votes: user?.id ? {
                                    where: { userId: user.id }
                                } : false,
                                _count: {
                                    select: { votes: true }
                                }
                            }
                        },
                        votes: user?.id ? {
                            where: { userId: user.id }
                        } : false,
                        _count: {
                            select: { votes: true }
                        }
                    }
                },
                _count: {
                    select: {
                        posts: true
                    }
                }
            }
        })

        if (!topic) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            )
        }

        // Get topics (only root posts) for this topic
        const posts = await prisma.post.findMany({
            where: {
                topicId: id,
                parentId: null // Sadece ana yorumları getir
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                replies: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                image: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            },
            orderBy: {
                createdAt: 'desc' // Ana yorumlar yeni olan üstte
            }
        })

        // Increment view count
        await prisma.topic.update({
            where: { id },
            data: {
                viewCount: {
                    increment: 1
                }
            }
        })

        return NextResponse.json({
            topic,
            posts
        })
    } catch (error) {
        console.error('Error fetching topic detail:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
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
        const { title, content, categoryId } = await request.json()

        if (!title || !content || !categoryId) {
            return NextResponse.json(
                { error: 'Title, content, and category are required' },
                { status: 400 }
            )
        }

        // Check profanity
        const { containsProfanity } = await import('@/lib/profanity')
        if (containsProfanity(title) || containsProfanity(content)) {
            return NextResponse.json(
                { error: 'İçeriğinizde uygunsuz ifadeler tespit edildi. Lütfen düzenleyip tekrar deneyin.' },
                { status: 400 }
            )
        }

        // Find the topic
        const topic = await prisma.topic.findUnique({
            where: { id },
            select: { authorId: true }
        })

        if (!topic) {
            return NextResponse.json(
                { error: 'Gönderi bulunamadı' },
                { status: 404 }
            )
        }

        // Check if user is the author
        if (topic.authorId !== user.id) {
            return NextResponse.json(
                { error: 'Bu gönderiyi düzenleme yetkiniz yok' },
                { status: 403 }
            )
        }

        // Extract hashtags
        const hashtagRegex = /#([a-zA-Z0-9çğıöşüÇĞİÖŞÜ]+)/g
        const hashtagsFound = Array.from(content.matchAll(hashtagRegex)).map(match => (match as string[])[1].toLowerCase())
        const uniqueHashtags = [...new Set(hashtagsFound)]

        let updatedTopic;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts && !updatedTopic) {
            try {
                updatedTopic = await prisma.topic.update({
                    where: { id },
                    data: {
                        title,
                        content,
                        categoryId,
                        hashtags: {
                            set: [], // Clear old ones
                            connectOrCreate: uniqueHashtags.map((name: string) => ({
                                where: { name },
                                create: { name }
                            }))
                        }
                    }
                })
            } catch (updateError: any) {
                if (updateError.code === 'P2002') {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        return NextResponse.json({ error: 'Bir çakışma oluştu, lütfen tekrar deneyin.' }, { status: 500 });
                    }
                    continue; // Retry hashtag connection
                }
                
                if (updateError.code === 'P2021') {
                    updatedTopic = await prisma.topic.update({
                        where: { id },
                        data: {
                            title,
                            content,
                            categoryId,
                        }
                    })
                    break;
                }
                
                throw updateError
            }
        }

        return NextResponse.json({ success: true, topic: updatedTopic })

    } catch (error) {
        console.error('Update topic error:', error)
        return NextResponse.json(
            { error: 'Gönderi güncellenirken bir hata oluştu' },
            { status: 500 }
        )
    }
}

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
                { error: 'Gönderi bulunamadı' },
                { status: 404 }
            )
        }

        // Check if user is the author
        if (topic.authorId !== user.id) {
            return NextResponse.json(
                { error: 'Bu gönderiyi silme yetkiniz yok' },
                { status: 403 }
            )
        }

        // Prisma schema cascade will handle related records (posts, likes, poll)
        await prisma.topic.delete({
            where: { id }
        })

        return NextResponse.json({ success: true, message: 'Gönderi silindi' })

    } catch (error) {
        console.error('Delete topic error:', error)
        return NextResponse.json(
            { error: 'Gönderi silinirken bir hata oluştu' },
            { status: 500 }
        )
    }
}
