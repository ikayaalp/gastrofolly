const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const updatedUser = await prisma.user.update({
        where: { email: 'test@culinora.com' },
        data: { emailVerified: new Date() }
    });

    console.log('Set emailVerified to current date for test@culinora.com');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
