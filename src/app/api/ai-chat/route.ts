import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

const SYSTEM_PROMPT = `Sen Gastrofolly platformunun AI asistanısın. Adın "Chef AI".
Sadece ve sadece gastronomi, yemek tarifleri, pişirme teknikleri, mutfak ekipmanları, gıda bilimi ve aşçılık konularında yanıt verirsin.

Kurallar:
1. KESİNLİKLE gastronomi dışındaki konulara (siyaset, teknoloji, matematik, genel kültür, spor vb.) cevap verme.
2. Gastronomi dışı bir soru gelirse çok kibar bir dille "Ben sadece mutfak ve yemek konularında uzmanım. Size tarifler, pişirme teknikleri veya gastronomi dünyası hakkında yardımcı olabilirim." şeklinde yanıt ver ve konuyu yemeğe getir.
3. Türkçe konuş.
4. Kısa ve öz yanıtlar ver (maksimum 2-3 paragraf).
5. Samimi, iştah açıcı ve profesyonel bir şevef gibi konuş.
6. Gastrofolly'deki eğitimlere ve şeflere atıfta bulunabilirsin.
7. Emoji kullanabilirsin 👨‍🍳🥘.

Sen bir şefsin, kod yazamazsın, matematik çözemezsin, sadece yemek yaparsın ve yemek konuşursun.`

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export async function POST(request: NextRequest) {
    try {
        const { messages } = await request.json() as { messages: Message[] }

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Messages array is required' },
                { status: 400 }
            )
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Gemini API key is not configured' },
                { status: 500 }
            )
        }

        // Fetch courses context
        const courses = await prisma.course.findMany({
            where: { isPublished: true },
            select: {
                title: true,
                description: true,
                instructor: {
                    select: { name: true }
                },
                category: {
                    select: { name: true }
                }
            },
            take: 20 // Limit context size
        });

        const coursesContext = courses.map(c =>
            `- Kurs: "${c.title}" (${c.category.name})\n  Eğitmen: ${c.instructor.name}\n  Açıklama: ${c.description}`
        ).join('\n\n');

        const dynamicSystemPrompt = `${SYSTEM_PROMPT}

## GASTROFOLLY PLATFORMUNDAKİ GÜNCEL KURSLAR:
Aşağıdaki kurslar şu an platformda mevcuttur. Kullanıcının ihiyacına uygun bir kurs varsa MUTLAKA öner.

${coursesContext}
`;

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

        // Build conversation history for Gemini
        const history = messages.slice(0, -1).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }))

        const lastMessage = messages[messages.length - 1]?.content || ''

        // Start chat with system prompt embedded in history
        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: 'Merhaba, sen kimsin?' }] },
                { role: 'model', parts: [{ text: dynamicSystemPrompt + '\n\nMerhaba! Ben Chef AI, Gastrofolly\'nin yapay zeka destekli mutfak asistanıyım! 👨‍🍳 Size tarifler, pişirme teknikleri ve gastronomi dünyası hakkında yardımcı olabilirim. Bugün mutfakta ne yapmak istersiniz?' }] },
                ...history
            ],
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7,
            }
        })

        const result = await chat.sendMessage(lastMessage)
        const reply = result.response.text() || 'Üzgünüm, şu an yanıt veremiyorum.'

        return NextResponse.json({ reply })
    } catch (error: any) {
        console.error('AI Chat error:', error)

        if (error?.status === 429 || error?.message?.includes('429')) {
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

