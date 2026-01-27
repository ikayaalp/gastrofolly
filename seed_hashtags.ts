
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

async function seed() {
    console.log('Starting seed...');
    try {
        // 1. Get a user and category to link topics to
        const user = await prisma.user.findFirst();
        const category = await prisma.forumCategory.findFirst();

        if (!user || !category) {
            console.error('No user or category found. Cannot seed topics.');
            return;
        }

        const hashtagsToSeed = [
            'lezzetli', 'yemektarifleri', 'mutfaksirlari', 'gastronomi', 'cheflife', 'trend'
        ];

        console.log(`Found user: ${user.id}, category: ${category.id}`);

        // Create topics with hashtags
        for (const tag of hashtagsToSeed) {
            // Upsert hashtag
            const hashtag = await prisma.hashtag.upsert({
                where: { name: tag },
                update: {},
                create: { name: tag }
            });

            // Create a topic using this hashtag
            await prisma.topic.create({
                data: {
                    title: `Test Topic with #${tag}`,
                    content: `This is a test topic discussing #${tag}`,
                    slug: `test-topic-${tag}-${Date.now()}`,
                    authorId: user.id,
                    categoryId: category.id,
                    hashtags: {
                        connect: { id: hashtag.id }
                    }
                }
            });
            console.log(`Created topic for #${tag}`);
        }

        console.log('Seeding completed.');

    } catch (error: any) {
        if (error.code === 'P2021') {
            console.error('Table does not exist (P2021). Please run: npx prisma db push');
        } else {
            console.error('Error seeding:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

seed();
