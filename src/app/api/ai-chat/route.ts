import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/mobileAuth'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit'

const SYSTEM_PROMPT = `Sen Culinora platformunun deneyimli ve zarif AI şefi "Culi"sin. Michelin seviyesinde bilgiye sahip, sakin, güven veren ve sofistike bir üslupla konuşursun.

Sadece ve sadece gastronomi, yemek tarifleri, pişirme teknikleri, mutfak ekipmanları, gıda bilimi ve aşçılık konularında yanıt verirsin.

Kurallar:
1. KESİNLİKLE gastronomi dışındaki konulara (siyaset, teknoloji, matematik, genel kültür, spor vb.) cevap verme.
2. Gastronomi dışı bir soru gelirse kibarca "Ben sadece mutfak ve gastronomi dünyasında uzmanım. Size tarifler, pişirme teknikleri veya gastronomi konularında yardımcı olabilirim." şeklinde yanıt ver ve konuyu yemeğe getir.
3. Türkçe konuş.
4. Sıcak ve samimi ama ölçülü bir üslup kullan — abartılı, şakacı bir karakter değil; alanında uzman, güvenilir bir şef gibi konuş. Emoji KULLANMA. Ton, kelimelerle ve içerikle iştah açıcı olsun, emoji ile değil.
5. Kısa selamlaşma cümleleri kurma, direkt konuya odaklan.

FORMATLAMA KURALLARI (Çok Önemli):
- Yanıtları okunabilir kılmak için **Markdown** formatını etkin kullan.
- **Malzeme listeleri** ve **adım adım tarifler** için MUTLAKA madde işaretleri (- veya *) veya numaralı listeler (1., 2.) kullan. Asla düz paragraf içine gömme.
- Önemli başlıkları (Malzemeler, Yapılışı, Püf Noktaları vb.) **kalın** (**Başlık**) veya küçük başlık (### Başlık) olarak yaz.
- Paragraflar arasında çift satır boşluğu bırakarak metnin nefes almasını sağla.
- Uzun, blok halinde metinler yazmaktan kaçın. Kısa, net ve taranabilir paragraflar oluştur.

Sen bir şefsin, kod yazamazsın, matematik çözemezsin, sadece yemek yaparsın ve yemek konuşursun.`

interface Message {
    role: 'user' | 'assistant'
    content: string
}

async function generateCompletionWithFallback(systemPrompt: string, formattedMessages: any[]) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!geminiKey && !groqKey) {
        throw new Error('API keys are not configured');
    }

    const runGroq = async () => {
        if (!groqKey) throw new Error('API keys are not configured');
        const openai = new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' });
        return await openai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: systemPrompt }, ...formattedMessages],
            max_tokens: 1000,
            temperature: 0.7,
        });
    };

    if (geminiKey) {
        try {
            const openai = new OpenAI({ apiKey: geminiKey, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' });
            return await openai.chat.completions.create({
                model: 'gemini-3.5-flash',
                messages: [{ role: 'system', content: systemPrompt }, ...formattedMessages],
                max_tokens: 1000,
                temperature: 0.7,
            });
        } catch (error: any) {
            if (error?.status === 429 && groqKey) {
                console.warn('Gemini API rate limited (429), falling back to Groq...');
                return await runGroq();
            }
            throw error;
        }
    }

    return await runGroq();
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

        if (!(await checkRateLimit(`ai-chat:${user.id}`, RATE_LIMITS.AI_CHAT)).success) {
            return NextResponse.json({ error: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.' }, { status: 429 })
        }

        const { messages } = await request.json() as { messages: Message[] }

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Messages array is required' },
                { status: 400 }
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

        const formattedMessages = messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
        }));

        let completion;
        try {
            completion = await generateCompletionWithFallback(dynamicSystemPrompt, formattedMessages);
        } catch (error: any) {
            if (error.message === 'API keys are not configured') {
                return NextResponse.json({ error: 'AI API key is not configured' }, { status: 500 });
            }
            throw error;
        }

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
