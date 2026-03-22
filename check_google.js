const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const googleAccounts = await prisma.account.findMany({
            where: { provider: 'google' },
            include: { user: true }
        });

        console.log(`Total Google Accounts: ${googleAccounts.length}`);
        
        const unverifiedGoogleUsers = googleAccounts.filter(acc => !acc.user.emailVerified);
        console.log(`Unverified Google Users (emailVerified is null): ${unverifiedGoogleUsers.length}`);
        
        const allUsersCount = await prisma.user.count();
        const verifiedUsersCount = await prisma.user.count({ where: { emailVerified: { not: null } } });
        console.log(`Total Users in DB: ${allUsersCount}`);
        console.log(`Verified Users in DB: ${verifiedUsersCount}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
