
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Manual env loading
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            let value = parts.slice(1).join('=').trim();
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            process.env[key] = value;
        }
    });
}

const prisma = new PrismaClient();

async function simulateUserPost() {
    console.log('Simulating user post...');
    try {
        // 1. Get a user and category to link topics to
        const user = await prisma.user.findFirst();
        const category = await prisma.forumCategory.findFirst();

        if (!user || !category) {
            console.error('No user or category found. Cannot simulate post.');
            return;
        }

        console.log(`Found user: ${user.id}, category: ${category.id}`);

        // Define topics with hashtags naturally embedded in content
        const realWorldTopics = [
            {
                title: "En iyi makarna sosu hangisi?",
                content: "Merhabalar, evde makarna yapmayı çok seviyorum ama sos konusunda kararsızım. Sizce en iyi #makarna sosu hangisi? #italyanmutfagi sevenler yardım!"
            },
            {
                title: "Sürdürülebilir Gastronomi üzerine düşünceler",
                content: "Artık mutfaklarda #surdurulebilirlik çok önemli. Atıksız mutfak için neler yapıyorsunuz? #gastronomi #sifiratik"
            },
            {
                title: "Bıçak seti önerisi",
                content: "Profesyonel bir bıçak seti almak istiyorum. #chef bıçağı olarak ne önerirsiniz? #bicak"
            },
            {
                title: "Sokak Lezzetleri Turu",
                content: "İstanbul'da en iyi #sokaklezzetleri nerede yenir? Önerilerinizi bekliyorum. #istanbul #yemeicme"
            },
            {
                title: "Bugün ne pişirsem?",
                content: "Akşama ne yemek yapsam diye düşünüyorum. Pratik ve lezzetli #yemektarifleri var mı? #aksamyemegi"
            }
        ];

        for (const topicData of realWorldTopics) {
            // We replicate the API logic here:
            // 1. Extract hashtags
            const hashtagRegex = /#([a-zA-Z0-9çğıöşüÇĞİÖŞÜ]+)/g;
            const hashtagsFound = Array.from(topicData.content.matchAll(hashtagRegex)).map(match => match[1].toLowerCase());
            const uniqueHashtags = [...new Set(hashtagsFound)];

            console.log(`Creating topic: "${topicData.title}" with hashtags: ${uniqueHashtags.join(', ')}`);

            // 2. Create slug
            const slug = topicData.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim() + `-${Date.now()}`;

            // 3. Create Topic and connect/create hashtags
            await prisma.topic.create({
                data: {
                    title: topicData.title,
                    content: topicData.content,
                    slug: slug,
                    authorId: user.id,
                    categoryId: category.id,
                    hashtags: {
                        connectOrCreate: uniqueHashtags.map(name => ({
                            where: { name },
                            create: { name }
                        }))
                    }
                }
            });
        }

        console.log('Simulation completed. Real looking data added.');

    } catch (error: any) {
        if (error.code === 'P2021') {
            console.error('Table does not exist (P2021). Migration needed.');
        } else {
            console.error('Error seeding:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

simulateUserPost();
