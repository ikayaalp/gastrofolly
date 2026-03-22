const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            where: { email: { contains: 'oktay' } },
            include: { accounts: true }
        });

        console.log(`Matching Users: ${users.length}`);
        users.forEach(u => {
            console.log(`- ID: ${u.id}, Email: "${u.email}", emailVerified: ${u.emailVerified}`);
            console.log(`  Accounts: ${JSON.stringify(u.accounts.map(a => a.provider))}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
