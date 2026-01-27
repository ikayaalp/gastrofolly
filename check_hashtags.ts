
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        // Handle lines with comments or multiple =
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            // Join the rest back in case value has =
            let value = parts.slice(1).join('=').trim();
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
}

const prisma = new PrismaClient();

async function checkHashtags() {
    try {
        const count = await prisma.hashtag.count();
        console.log(`Hashtag count: ${count}`);

        if (count > 0) {
            const hashtags = await prisma.hashtag.findMany({
                take: 5,
                include: {
                    _count: {
                        select: { topics: true }
                    }
                },
                orderBy: {
                    topics: {
                        _count: 'desc'
                    }
                }
            });
            console.log('Top hashtags:', JSON.stringify(hashtags, null, 2));
        } else {
            console.log('No hashtags found. Seeding might be needed.');
        }
    } catch (error: any) {
        if (error.code === 'P2021') {
            console.error('Table does not exist (P2021). Migration needed.');
        } else {
            console.error('Error checking hashtags:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

checkHashtags();
