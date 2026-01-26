import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit

    // Sıralama seçenekleri
    let orderBy: any = {}
    switch (sort) {
      case 'popular':
        orderBy = [
          { likeCount: 'desc' },
          { viewCount: 'desc' },
          { createdAt: 'desc' }
        ]
        break
      case 'mostReplies':
        orderBy = { posts: { _count: 'desc' } }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // Kategori filtresi
    const where: any = {}
    if (category && category !== 'all') {
      where.category = {
        slug: category
      }
    }

    // Arama filtresi
    const search = searchParams.get('search')
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [topics, totalCount] = await Promise.all([
      prisma.topic.findMany({
        where,
        orderBy,
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
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          },
          posts: {
            select: {
              id: true
            }
          },
          _count: {
            select: {
              posts: true
            }
          }
        }
      }),
      prisma.topic.count({ where })
    ])

    return NextResponse.json({
      topics: topics.map(topic => ({
        ...topic,
        repliesCount: topic._count.posts
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching topics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { title, content, categoryId, mediaUrl, mediaType, thumbnailUrl } = await request.json()

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      )
    }

    // Varsayılan kategoriyi kontrol et ve yoksa oluştur
    let finalCategoryId = categoryId
    if (categoryId === 'default-category') {
      let defaultCategory = await prisma.forumCategory.findUnique({
        where: { id: 'default-category' }
      })

      if (!defaultCategory) {
        console.log('POST /api/forum/topics - Creating default category')
        defaultCategory = await prisma.forumCategory.create({
          data: {
            id: 'default-category',
            name: 'Genel',
            description: 'Genel tartışmalar',
            slug: 'genel',
            color: '#6b7280'
          }
        })
      }
      finalCategoryId = defaultCategory.id
    }

    // Slug oluştur
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Benzersiz slug oluştur
    let uniqueSlug = slug
    let counter = 1
    while (await prisma.topic.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    // Hashtagleri ayıkla (e.g., #yemek #chef)
    const hashtagRegex = /#([a-zA-Z0-9çğıöşüÇĞİÖŞÜ]+)/g
    const hashtagsFound = Array.from(content.matchAll(hashtagRegex)).map(match => (match as string[])[1].toLowerCase())
    const uniqueHashtags = [...new Set(hashtagsFound)]

    const topic = await prisma.topic.create({
      data: {
        title,
        content,
        slug: uniqueSlug,
        authorId: user.id,
        categoryId: finalCategoryId,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        thumbnailUrl: thumbnailUrl || null,
        hashtags: {
          connectOrCreate: uniqueHashtags.map(name => ({
            where: { name },
            create: { name }
          }))
        }
      } as any,
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
        }
      }
    })

    return NextResponse.json(topic, { status: 201 })
  } catch (error) {
    console.error('Error creating topic:', error)
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    )
  }
}
