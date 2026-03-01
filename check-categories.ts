import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const categories = await prisma.category.findMany({
        include: {
            courses: {
                select: { id: true, title: true, isPublished: true }
            }
        }
    })

    categories.forEach(c => {
        console.log(`Category: ${c.name} (${c.id})`);
        console.log(`  Course Count: ${c.courses.length}`);
        const published = c.courses.filter(course => course.isPublished);
        console.log(`  Published Course Count: ${published.length}`);

        if (published.length > 0) {
            published.forEach(p => console.log(`    - ${p.title} (Published)`));
        }

        const unpublished = c.courses.filter(course => !course.isPublished);
        if (unpublished.length > 0) {
            unpublished.forEach(u => console.log(`    - ${u.title} (Draft)`));
        }
        console.log('---');
    });
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
