const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const newHash = '$2b$10$XLFea1QfIWdRk6tAtpbmwOZ4FFeCZ5mbHOFOjFp49y.rndQ5HnCxc2';

    const updatedUser = await prisma.user.update({
        where: { email: 'test@culinora.com' },
        data: { password: newHash }
    });

    console.log('Password updated successfully for test@culinora.com');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
