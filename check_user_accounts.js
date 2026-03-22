const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'oktayay03@gmail.com' },
            include: { accounts: true }
        });

        if (user) {
            console.log(`User: ${user.email}, emailVerified: ${user.emailVerified}`);
            console.log(`Accounts: ${JSON.stringify(user.accounts)}`);
        } else {
            console.log('User not found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
