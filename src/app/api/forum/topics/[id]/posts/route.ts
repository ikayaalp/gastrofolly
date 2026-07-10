import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'
import { containsProfanity } from '@/lib/profanity'
import { processCuliMention } from '@/lib/culiBot'
import { sendPushNotification } from '@/lib/pushNotifications'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit'

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
      // Ignore auth error
    }

    const whereClause: any = {
      topicId: resolvedParams.id,
      parentId: null // Sadece ana yorumları getir
    }

    if (blockedIds.length > 0) {
      whereClause.authorId = { notIn: blockedIds }
    }

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
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
            where: blockedIds.length > 0 ? { authorId: { notIn: blockedIds } } : undefined,
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
        where: whereClause
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

    const rateLimitResult = checkRateLimit(`forum-post:${user.id}`, RATE_LIMITS.FORUM_POST)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Çok fazla yorum yapıyorsunuz. Lütfen biraz bekleyin.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { parentId, mediaUrl, mediaType, thumbnailUrl } = body
    let { content } = body

    content = content?.trim()

    if (!content && !mediaUrl) {
      return NextResponse.json(
        { error: 'İçerik boş olamaz' },
        { status: 400 }
      )
    }

    const MAX_POST_LENGTH = 2000;
    if (content && content.length > MAX_POST_LENGTH) {
      return NextResponse.json({ error: `İçerik çok uzun (maksimum ${MAX_POST_LENGTH} karakter)` }, { status: 400 })
    }

    // Küfür Kontrolü
    if (containsProfanity(content)) {
      return NextResponse.json(
        { error: 'Yorumunuz uygunsuz ifadeler içeriyor.' },
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
        content: content || '...',
        authorId: user.id,
        topicId: resolvedParams.id,
        parentId: parentId || null,
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
        }
      }
    })

    // --- Bildirim (Notification) Sistemi ---
    try {
      let targetUserId = topic.authorId;
      
      // Eğer bir kişinin yorumuna (post) yanıt verilmişse hedef o kişinin kendisidir.
      if (parentId) {
        const parentPost = await prisma.post.findUnique({
          where: { id: parentId },
          select: { authorId: true }
        });
        if (parentPost) {
          targetUserId = parentPost.authorId;
        }
      }

      // Kullanıcı kendi yorumuna veya gönderisine yanıt atmadıysa bildirim gönder
      if (targetUserId !== user.id) {
        const notifTitle = "Yeni Yanıt";
        const notifMessage = `${post.author.name || 'Bir kullanıcı'} ${parentId ? 'yorumunuza' : 'gönderinize'} yanıt verdi.`;

        // 1. Uygulama İçi (Veritabanı) Bildirim Kayıt
        await prisma.notification.create({
          data: {
            type: 'FORUM_REPLY',
            title: notifTitle,
            message: notifMessage,
            userId: targetUserId,
            topicId: topic.id,
            postId: post.id
          }
        });

        // 2. Telefon (Expo Push) Bildirimi Gönderme
        const targetUser = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { pushToken: true }
        });

        if (targetUser?.pushToken) {
          await sendPushNotification(targetUser.pushToken, notifTitle, notifMessage, {
            type: 'FORUM_REPLY',
            topicId: topic.id,
            postId: post.id
          });
        }
      }
    } catch (notifError) {
      console.error('Bildirim gönderilirken hata oluştu:', notifError);
    }
    // ---------------------------------------

    // --- Mentions Sistemi ---
    if (content) {
      import('@/lib/mentions').then(({ extractMentionsAndNotify }) => {
        extractMentionsAndNotify(content, user.id, 'POST', post.id).catch(console.error)
      })
    }

    // --- Culi AI Bot Bot Integration ---
    // Eğer yorumda @culi geçiyorsa arka planda Culi'nin cevap vermesini tetikle
    if (content.toLowerCase().includes('@culi')) {
      // Async call - we don't await so it doesn't block the API response
      processCuliMention(
        resolvedParams.id,
        topic.content, // Orijinal topic içeriğini bağlam için gönderiyoruz
        content,
        post.id // Culi'nin cevabı kullanıcının yorumunun altına (reply olarak) gelsin
      ).catch(console.error);
    }
    // -----------------------------------

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
