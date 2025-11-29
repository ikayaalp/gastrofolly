const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Starting course level migration...')

    try {
        // Önce mevcut kursları kontrol et
        const courses = await prisma.$queryRaw`
      SELECT id, title, level FROM "Course"
    `

        console.log(`Found ${courses.length} courses to migrate`)

        // Eski seviyeleri yeni seviyelerle eşleştir
        const levelMapping = {
            'BEGINNER': 'COMMIS',
            'INTERMEDIATE': 'CHEF_DE_PARTIE',
            'ADVANCED': 'EXECUTIVE'
        }

        // Her kursu güncelle
        for (const course of courses) {
            const newLevel = levelMapping[course.level]
            if (newLevel) {
                await prisma.$executeRaw`
          UPDATE "Course" 
          SET level = ${newLevel}::text 
          WHERE id = ${course.id}
        `
                console.log(`Updated course "${course.title}" from ${course.level} to ${newLevel}`)
            }
        }

        console.log('Migration completed successfully!')
    } catch (error) {
        console.error('Migration failed:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
