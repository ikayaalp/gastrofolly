import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const SYSTEM_PROMPT = `Sen Gastrofolly platformunun AI asistanısın. Adın "Chef AI".
Gastronomi, yemek tarifleri, pişirme teknikleri, mutfak ekipmanları ve aşçılık konularında uzmansın.

Kurallar:
- Türkçe konuş
- Kısa ve öz yanıtlar ver (maksimum 2-3 paragraf)
- Samimi ve yardımcı ol
- Kullanıcıların sorularına gastronomi perspektifinden yanıt ver
- Eğer bir kurs veya eğitim önerisi yapılabilecekse, Gastrofolly platformundaki kurslara yönlendir
- Emoji kullanabilirsin ama abartma

Örnek konular:
- Tarif önerileri
- Pişirme teknikleri
- Malzeme alternatifleri
- Mutfak ipuçları
- Yemek kültürü
`

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

        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { error: 'OpenAI API key is not configured' },
                { status: 500 }
            )
        }

        const openai = new OpenAI({
            apiKey: apiKey,
        })

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages.map(m => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content
                }))
            ],
            max_tokens: 500,
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
