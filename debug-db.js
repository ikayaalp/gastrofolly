const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log("Checking Categories...");
        const categories = await prisma.category.findMany();
        console.log("Categories found:", categories.length);
        categories.forEach(c => console.log(`- ${c.name} (${c.id})`));

        console.log("\nChecking Courses...");
        const courses = await prisma.course.findMany({
            include: { category: true },
            take: 10
        });
        console.log("Courses found:", courses.length);

        if (courses.length === 0) {
            console.log("⚠️ No courses found in the database!");
        }

        courses.forEach(c => {
            console.log(`\nCourse: ${c.title} (${c.id})`);
            console.log(`- Published: ${c.isPublished}`);
            console.log(`- Category ID: ${c.categoryId}`);
            console.log(`- Category Name: ${c.category ? c.category.name : 'NO CATEGORY LINKED'}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
