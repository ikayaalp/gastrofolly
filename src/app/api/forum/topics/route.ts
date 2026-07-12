import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'
import { containsProfanity } from '@/lib/profanity'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit'

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
        orderBy = [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ]
        break
    }

    // Kategori ve süre filtresi
    const now = new Date();
    const where: any = {
      OR: [
        { poll: null }, // Poll olmayan normal gönderiler
        { poll: { endDate: { gt: now } } } // Poll varsa endDate henüz geçmemiş olanlar
      ]
    }

    if (category && category !== 'all') {
      where.category = {
        slug: category
      }
    }

    // Arama filtresi
    const search = searchParams.get('search')
    if (search) {
      const searchClean = search.replace(/^#/, '')

      // OR halihazırda varsa, AND içine almalıyız
      where.AND = [
        { OR: where.OR },
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { hashtags: { some: { name: { contains: searchClean, mode: 'insensitive' } } } }
          ]
        }
      ]
      delete where.OR
    }

    // Get current user if logged in (for poll vote check and blocks)
    let user = null
    let blockedIds: string[] = []
    
    try {
      user = await getAuthUser(request)
      if (user?.id) {
        // Find users blocked by current user
        const blocks = await prisma.block.findMany({
          where: { blockerId: user.id },
          select: { blockedId: true }
        })
        
        // Find users who blocked the current user
        const blockedBy = await prisma.block.findMany({
          where: { blockedId: user.id },
          select: { blockerId: true }
        })
        
        blockedIds = [
          ...blocks.map(b => b.blockedId),
          ...blockedBy.map(b => b.blockerId)
        ]
      }
    } catch (e) {
      // Ignore auth error for public feed
    }

    if (blockedIds.length > 0) {
      if (!where.AND) {
        where.AND = []
      }
      where.AND.push({
        authorId: {
          notIn: blockedIds
        }
      })
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

    const rateLimitResult = await checkRateLimit(`forum-topic:${user.id}`, RATE_LIMITS.FORUM_POST)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Çok fazla paylaşım yapıyorsunuz. Lütfen biraz bekleyin.' },
        { status: 429 }
      )
    }

    const body = await request.json();
    const { categoryId, mediaUrl, mediaType, thumbnailUrl } = body;
    let { title, content } = body;

    title = title?.trim()
    content = content?.trim()

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: 'Başlık ve içerik boş olamaz' },
        { status: 400 }
      )
    }

    const MAX_TITLE_LENGTH = 200;
    const MAX_CONTENT_LENGTH = 5000;

    if (title.length > MAX_TITLE_LENGTH) {
        return NextResponse.json({ error: `Başlık çok uzun (maksimum ${MAX_TITLE_LENGTH} karakter)` }, { status: 400 })
    }

    if (content.length > MAX_CONTENT_LENGTH) {
        return NextResponse.json({ error: `İçerik çok uzun (maksimum ${MAX_CONTENT_LENGTH} karakter)` }, { status: 400 })
    }

    // Küfür Kontrolü
    if (containsProfanity(title) || containsProfanity(content)) {
      return NextResponse.json(
        { error: 'İçeriğinizde uygunsuz ifadeler tespit edildi. Lütfen düzenleyip tekrar deneyin.' },
        { status: 400 }
      )
    }

    // Varsayılan kategoriyi kontrol et ve yoksa oluştur
    let finalCategoryId = categoryId
    if (categoryId === 'default-category') {
      const defaultCategory = await prisma.forumCategory.upsert({
        where: { id: 'default-category' },
        update: {},
        create: {
          id: 'default-category',
          name: 'Genel',
          description: 'Genel tartışmalar',
          slug: 'genel',
          color: '#6b7280'
        }
      })
      finalCategoryId = defaultCategory.id
    }

    // Slug oluştur
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() || 'topic'

    // Hashtagleri ayıkla (e.g., #yemek #chef)
    const hashtagRegex = /#([a-zA-Z0-9çğıöşüÇĞİÖŞÜ]+)/g
    const hashtagsFound = Array.from(content.matchAll(hashtagRegex)).map(match => (match as string[])[1].toLowerCase())
    const uniqueHashtags = [...new Set(hashtagsFound)]

    let topic = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !topic) {
      try {
        const uniqueSlug = attempts === 0 ? baseSlug : `${baseSlug}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;

        topic = await prisma.topic.create({
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
      } catch (createError: any) {
        if (createError.code === 'P2002') {
          attempts++;
          if (attempts >= maxAttempts) {
            return NextResponse.json({ error: 'Bir çakışma oluştu, lütfen tekrar deneyin.' }, { status: 500 });
          }
          continue; // Retry with new slug or new hashtag connection
        }

        // P2021: Table does not exist (Hashtag table not ready yet)
        if (createError.code === 'P2021') {
          console.warn('Hashtag table not ready, creating topic without hashtags')
          const fallbackSlug = attempts === 0 ? baseSlug : `${baseSlug}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
          topic = await prisma.topic.create({
            data: {
              title,
              content,
              slug: fallbackSlug,
              authorId: user.id,
              categoryId: finalCategoryId,
              mediaUrl: mediaUrl || null,
              mediaType: mediaType || null,
              thumbnailUrl: thumbnailUrl || null
            },
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
          break;
        }

        throw createError;
      }
    }
    if (topic) {
      import('@/lib/mentions').then(({ extractMentionsAndNotify }) => {
        extractMentionsAndNotify(content, user.id, 'TOPIC', topic.id).catch(console.error)
      })
    }

    return NextResponse.json(topic, { status: 201 })
  } catch (error) {
    console.error('Error creating topic:', error)
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    )
  }
}
