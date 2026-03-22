import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const googleAccounts = await prisma.account.findMany({
        where: { provider: 'google' },
        include: { user: true }
    });

    console.log(`Total Google Accounts: ${googleAccounts.length}`);
    
    const unverifiedGoogleUsers = googleAccounts.filter(acc => !acc.user.emailVerified);
    console.log(`Unverified Google Users (emailVerified is null): ${unverifiedGoogleUsers.length}`);
    
    if (unverifiedGoogleUsers.length > 0) {
        console.log('Sample unverified Google users:');
        unverifiedGoogleUsers.slice(0, 5).forEach(acc => {
            console.log(`- ID: ${acc.user.id}, Email: ${acc.user.email}, CreatedAt: ${acc.user.createdAt}`);
        });
    }

    const allUsersCount = await prisma.user.count();
    const verifiedUsersCount = await prisma.user.count({ where: { emailVerified: { not: null } } });
    console.log(`Total Users in DB: ${allUsersCount}`);
    console.log(`Verified Users in DB: ${verifiedUsersCount}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
