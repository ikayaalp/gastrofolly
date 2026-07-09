import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit'

const SYSTEM_PROMPT = `Sen Culinora platformunun AI asistanısın. Adın "Culi".
Sadece ve sadece gastronomi, yemek tarifleri, pişirme teknikleri, mutfak ekipmanları, gıda bilimi ve aşçılık konularında yanıt verirsin.

Kurallar:
1. KESİNLİKLE gastronomi dışındaki konulara (siyaset, teknoloji, matematik, genel kültür, spor vb.) cevap verme.
2. Gastronomi dışı bir soru gelirse çok kibar bir dille "Ben sadece mutfak ve yemek konularında uzmanım. Size tarifler, pişirme teknikleri veya gastronomi dünyası hakkında yardımcı olabilirim." şeklinde yanıt ver ve konuyu yemeğe getir.
3. Türkçe konuş.
4. Samimi, iştah açıcı ve profesyonel bir şef gibi konuş. Emoji kullanabilirsin 👨‍🍳🥘.

FORMATLAMA KURALLARI (Çok Önemli):
- Yanıtları okunabilir kılmak için **Markdown** formatını etkin kullan.
- **Malzeme listeleri** ve **adım adım tarifler** için MUTLAKA madde işaretleri (- veya *) veya numaralı listeler (1., 2.) kullan.
- Önemli başlıkları **kalın** (**Başlık**) veya küçük başlık (### Başlık) olarak yaz.
- Paragraflar arasında **çift satır boşluğu** bırak.
- Uzun, blok halinde metinler yazmaktan kaçın. Kısa, net ve taranabilir paragraflar oluştur.

Sen bir şefsin, kod yazamazsın, matematik çözemezsin, sadece yemek yaparsın ve yemek konuşursun.`

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!checkRateLimit(`ai-chat:${session.user.id}`, RATE_LIMITS.AI_CHAT).success) {
            return NextResponse.json({ error: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.' }, { status: 429 })
        }

        const { message, conversationId } = await request.json()

        if (!message || !conversationId) {
            return NextResponse.json({ error: 'Message and conversationId required' }, { status: 400 })
        }

        // Verify conversation ownership
        const conversation = await prisma.aiConversation.findFirst({
            where: { id: conversationId, userId: session.user.id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    select: { role: true, content: true },
                },
            },
        })

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        // Save user message
        await prisma.aiMessage.create({
            data: {
                role: 'user',
                content: message,
                conversationId,
            },
        })

        // Fetch courses context for recommendations
        const courses = await prisma.course.findMany({
            where: { isPublished: true },
            select: {
                title: true,
                description: true,
                instructor: { select: { name: true } },
                category: { select: { name: true } },
            },
            take: 20,
        })

        const coursesContext = courses.map(c =>
            `- Kurs: "${c.title}" (${c.category.name})\n  Eğitmen: ${c.instructor.name}\n  Açıklama: ${c.description}`
        ).join('\n\n')

        const dynamicSystemPrompt = `${SYSTEM_PROMPT}\n\n## Culinora PLATFORMUNDAKİ GÜNCEL KURSLAR:\n${coursesContext}`

        // Build message history for AI
        const aiMessages: ChatMessage[] = conversation.messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        }))
        aiMessages.push({ role: 'user', content: message })

        const apiKey = process.env.GROQ_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
        }

        const openai = new OpenAI({
            apiKey,
            baseURL: 'https://api.groq.com/openai/v1',
        })

        const completion = await openai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: dynamicSystemPrompt },
                ...aiMessages,
            ],
            max_tokens: 1000,
            temperature: 0.7,
        })

        const reply = completion.choices[0]?.message?.content || 'Üzgünüm, şu an yanıt veremiyorum.'

        // Save assistant message
        await prisma.aiMessage.create({
            data: {
                role: 'assistant',
                content: reply,
                conversationId,
            },
        })

        // Auto-title: if this is the first message, generate a title from the user's message
        if (conversation.messages.length === 0) {
            const title = message.length > 40 ? message.substring(0, 40) + '...' : message
            await prisma.aiConversation.update({
                where: { id: conversationId },
                data: { title },
            })
        }

        // Update conversation timestamp
        await prisma.aiConversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        })

        return NextResponse.json({ reply })
    } catch (error: any) {
        console.error('Culi chat error:', error)

        if (error?.status === 429) {
            return NextResponse.json(
                { error: 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.' },
                { status: 429 }
            )
        }

        return NextResponse.json(
            { error: 'AI yanıt veremedi. Lütfen tekrar deneyin.' },
            { status: 500 }
        )
    }
}
