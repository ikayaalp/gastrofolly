import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const CULI_EMAIL = 'culi@culinora.com';
const CULI_NAME = 'Culi (AI Şef)';
const CULI_AVATAR = '/logo.jpeg'; // Culinora C logo

const SYSTEM_PROMPT = `Sen Culinora platformunun uzman, esprili ve bilgili AI şefi "Culi"sin.
Şu anda "Chef Sosyal" isimli bir yemek tarifleri ve gastronomi forumunda bir kullanıcıya cevap veriyorsun.

Kurallar:
1. Sadece gastronomi, yemek tarifleri, pişirme teknikleri, mutfak ekipmanları ve gıda bilimi konularında yanıt ver.
2. Gastronomi dışı bir soru gelirse çok kibar bir dille "Ben sadece mutfak ve yemek konularında uzmanım. Size tarifler, pişirme teknikleri veya gastronomi dünyası hakkında yardımcı olabilirim." şeklinde yanıt ver.
3. Türkçe konuş.
4. Samimi, iştah açıcı ve profesyonel bir şef gibi konuş. İnsanlarla sohbet ettiğini unutma, çok resmi olma. Emoji kullanabilirsin 👨‍🍳🥘.
5. Kullanıcı sana postun (ana gönderinin) altında bir şey sormuş olabilir. Sorduğu soruya ve postun içeriğine göre bağlamı anla ve doğru tavsiyeler ver.

FORMATLAMA KURALLARI (Çok Önemli):
- Yanıtları okunabilir kılmak için **Markdown** formatını etkin kullan.
- **Malzeme listeleri** ve **adım adım tarifler** için MUTLAKA madde işaretleri (- veya *) veya numaralı listeler (1., 2.) kullan. Asla düz paragraf içine gömme.
- Kısa, net ve okunaklı paragraflar oluştur. Uzun destanlar yazma, forumda yazıştığını hatırla.`;

/**
 * Gets or creates the Culi AI user account in the database.
 */
export async function getCuliUser() {
    let culi = await prisma.user.findUnique({
        where: { email: CULI_EMAIL }
    });

    if (!culi) {
        culi = await prisma.user.create({
            data: {
                email: CULI_EMAIL,
                name: CULI_NAME,
                image: CULI_AVATAR,
                role: 'ADMIN', // Let's keep it ADMIN so it has a badge, or create a specific role later
            }
        });
    }

    return culi;
}

/**
 * Generates an AI response using Groq API
 */
async function generateCuliReply(postContent: string | null, userQuestion: string) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error('Groq API key is not configured for Culi Bot');
        return "Üzgünüm, şu an mutfakta biraz meşgulüm. Lütfen daha sonra tekrar sor! 👨‍🍳";
    }

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
    });

    let promptContext = `KULLANICININ SORUSU VEYA YORUMU:\n"${userQuestion}"\n`;

    if (postContent) {
        promptContext = `TARTIŞILAN ANA GÖNDERİ (POST) İÇERİĞİ:\n"${postContent}"\n\n` + promptContext;
    }

    try {
        const completion = await openai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: promptContext }
            ],
            max_tokens: 500,
            temperature: 0.7,
        });

        return completion.choices[0]?.message?.content || 'Ah, fırında bir şeyler unuttum sanırım! Şu an cevap veremiyorum. 👨‍🍳';
    } catch (error) {
        console.error('Culi AI generation error:', error);
        return "Teknik bir sorun oldu, mutfağa geri dönmem gerek! 👨‍🍳";
    }
}

/**
 * Main orchestrator: Checks if Culi is mentioned, generates a reply, and creates a database record.
 * This should NOT block the main thread (call it without await).
 */
export async function processCuliMention(
    topicId: string,
    originalPostContent: string | null,
    userComment: string,
    parentPostId: string | null
) {
    // Only proceed if @culi is mentioned (case insensitive)
    if (!userComment.toLowerCase().includes('@culi')) {
        return;
    }

    try {
        console.log("Culi was summoned! Generating response...");

        // 1. Get Culi User
        const culiUser = await getCuliUser();

        // 2. Generate Reply
        const aiResponse = await generateCuliReply(originalPostContent, userComment);

        // 3. Create Reply Post
        await prisma.post.create({
            data: {
                content: aiResponse,
                authorId: culiUser.id,
                topicId: topicId,
                parentId: parentPostId // Reply to the specific comment if it exists, otherwise to the topic
            }
        });

        console.log("Culi successfully replied to the post.");
    } catch (error) {
        console.error("Error processing Culi mention:", error);
    }
}
