import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: {
          topicId: resolvedParams.id,
          parentId: null // Sadece ana yorumları getir
        },
        orderBy: {
          createdAt: 'asc'
        },
        skip,
        take: limit,
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
        }
      }),
      prisma.post.count({
        where: {
          topicId: resolvedParams.id
        }
      })
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { content, parentId } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Topic'in var olup olmadığını kontrol et
    const topic = await prisma.topic.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }

    if (topic.isLocked) {
      return NextResponse.json(
        { error: 'Topic is locked' },
        { status: 403 }
      )
    }

    const post = await prisma.post.create({
      data: {
        content,
        authorId: user.id,
        topicId: resolvedParams.id,
        parentId: parentId || null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
