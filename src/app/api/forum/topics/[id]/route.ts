import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params


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
