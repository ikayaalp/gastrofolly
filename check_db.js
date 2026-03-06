const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.$queryRaw`SELECT current_database();`;
    console.log('Connected database:', result);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
