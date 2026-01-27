
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

async function checkData() {
    try {
        const topicCount = await prisma.topic.count();
        const hashtagCount = await prisma.hashtag.count();

        console.log(`Total Topics: ${topicCount}`);
        console.log(`Total Hashtags: ${hashtagCount}`);

        if (topicCount > 0 && hashtagCount === 0) {
            console.log("DIAGNOSIS: Topics exist but Hashtags are empty. Need to backfill.");
            const sampleTopics = await prisma.topic.findMany({ take: 3 });
            console.log("Sample Topics:", JSON.stringify(sampleTopics.map(t => ({ title: t.title, content: t.content })), null, 2));
        } else if (topicCount === 0) {
            console.log("DIAGNOSIS: No topics exist. System is empty.");
        } else {
            console.log("DIAGNOSIS: Data seems consistent.");
            const top = await prisma.hashtag.findMany({
                take: 5,
                orderBy: { topics: { _count: 'desc' } },
                include: { _count: { select: { topics: true } } }
            });
            console.log("Top Hashtags:", top);
        }

    } catch (error: any) {
        if (error.code === 'P2021') {
            console.error('Table does not exist (P2021). Migration needed.');
        } else {
            console.error('Error checking data:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
