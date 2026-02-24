import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'test@culinora.com'
    const password = 'Password123!'
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            name: 'Test Culinora',
            emailVerified: new Date()
        },
        create: {
            email,
            name: 'Test Culinora',
            password: hashedPassword,
            emailVerified: new Date()
        }
    })

    console.log(`Test user created/updated!`)
    console.log(`Email: ${user.email}`)
    console.log(`Password: ${password}`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
