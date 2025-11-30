import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    const email = 'demo_video@example.com'
    const password = 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            emailVerified: new Date(),
        },
        create: {
            email,
            name: 'Demo User',
            password: hashedPassword,
            role: 'STUDENT',
            emailVerified: new Date(), // Ensure email is verified
            image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'
        }
    })

    console.log(`User created/updated: ${user.email} with password: ${password}`)

    // Also ensure enrollment in course-1 so we can show the Learn page
    await prisma.enrollment.upsert({
        where: {
            userId_courseId: {
                userId: user.id,
                courseId: 'course-1'
            }
        },
        update: {},
        create: {
            userId: user.id,
            courseId: 'course-1'
        }
    })
    console.log('Enrolled in course-1')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
