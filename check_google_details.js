const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const googleAccounts = await prisma.account.findMany({
            where: { provider: 'google' },
            include: { user: true }
        });

        console.log(`Total Google Accounts: ${googleAccounts.length}`);
        
        googleAccounts.forEach(acc => {
            console.log(`- UserID: ${acc.user.id}, Email: ${acc.user.email}, emailVerified: ${acc.user.emailVerified}, CreatedAt: ${acc.user.createdAt}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
