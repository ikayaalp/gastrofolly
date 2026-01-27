
const { PrismaClient } = require('@prisma/client');
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
            console.log('Top hashtags:', hashtags);
        } else {
            console.log('No hashtags found.');
        }
    } catch (error) {
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
