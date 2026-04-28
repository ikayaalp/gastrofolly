import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/mobileAuth'

const SYSTEM_PROMPT = `Sen Culinora platformunun AI asistanısın. Adın "Culi".
Sadece ve sadece gastronomi, yemek tarifleri, pişirme teknikleri, mutfak ekipmanları, gıda bilimi ve aşçılık konularında yanıt verirsin.

Kurallar:
1. KESİNLİKLE gastronomi dışındaki konulara (siyaset, teknoloji, matematik, genel kültür, spor vb.) cevap verme.
2. Gastronomi dışı bir soru gelirse çok kibar bir dille "Ben sadece mutfak ve yemek konularında uzmanım. Size tarifler, pişirme teknikleri veya gastronomi dünyası hakkında yardımcı olabilirim." şeklinde yanıt ver ve konuyu yemeğe getir.
3. Türkçe konuş.
4. Samimi, iştah açıcı ve profesyonel bir şef gibi konuş. Emoji kullanabilirsin 👨‍🍳🥘.

FORMATLAMA KURALLARI (Çok Önemli):
- Yanıtları okunabilir kılmak için **Markdown** formatını etkin kullan.
- **Malzeme listeleri** ve **adım adım tarifler** için MUTLAKA madde işaretleri (- veya *) veya numaralı listeler (1., 2.) kullan. Asla düz paragraf içine gömme.
- Önemli başlıkları (Malzemeler, Yapılışı, Püf Noktaları vb.) **kalın** (**Başlık**) veya küçük başlık (### Başlık) olarak yaz.
- Paragraflar arasında **çift satır boşluğu** bırakarak metnin nefes almasını sağla.
- Uzun, blok halinde metinler yazmaktan kaçın. Kısa, net ve taranabilir paragraflar oluştur.

Sen bir şefsin, kod yazamazsın, matematik çözemezsin, sadece yemek yaparsın ve yemek konuşursun.`

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) {
            return NextResponse.json(
                { error: 'Giriş yapmanız gerekiyor' },
                { status: 401 }
            )
        }

        const { messages } = await request.json() as { messages: Message[] }

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Messages array is required' },
                { status: 400 }
            )
        }

        const apiKey = process.env.GROQ_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Groq API key is not configured' },
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
            take: 20
        });

        const coursesContext = courses.map(c =>
            `- Kurs: "${c.title}" (${c.category.name})\n  Eğitmen: ${c.instructor.name}\n  Açıklama: ${c.description}`
        ).join('\n\n');

        const dynamicSystemPrompt = `${SYSTEM_PROMPT}

## Culinora PLATFORMUNDAKİ GÜNCEL KURSLAR:
Aşağıdaki kurslar şu an platformda mevcuttur. Kullanıcının ihiyacına uygun bir kurs varsa MUTLAKA öner.

${coursesContext}
`;

        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: 'https://api.groq.com/openai/v1', // Using Groq API
        })

        const completion = await openai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: dynamicSystemPrompt },
                ...messages.map(m => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content
                }))
            ],
            max_tokens: 1000,
            temperature: 0.7,
        })

        const reply = completion.choices[0]?.message?.content || 'Üzgünüm, şu an yanıt veremiyorum.'

        return NextResponse.json({ reply })
    } catch (error: any) {
        console.error('AI Chat error:', error)

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
