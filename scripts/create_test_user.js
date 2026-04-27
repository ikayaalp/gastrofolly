const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'testculinora@gmail.com';
    const password = 'Culinora1221.';
    const hashedPassword = await bcrypt.hash(password, 12);

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        await prisma.user.delete({
            where: { email }
        });
        console.log('Existing user deleted to reset RevenueCat App User ID.');
    }

    await prisma.user.create({
        data: {
            email,
            name: 'Apple Test User',
            password: hashedPassword,
            emailVerified: new Date(),
        }
    });
    console.log('Test user created successfully with a fresh ID!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
