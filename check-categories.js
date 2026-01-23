const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
    try {
        const count = await prisma.category.count();
        console.log(`Total categories: ${count}`);

        if (count > 0) {
            const categories = await prisma.category.findMany({ take: 5 });
            console.log('Sample categories:', categories);
        } else {
            console.log('No categories found. You need to seed the database.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCategories();
