const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        console.log(`Latest 5 Users:`);
        users.forEach(u => {
            console.log(`- ID: ${u.id}, Email: "${u.email}", emailVerified: ${u.emailVerified}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
