const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const email = 'test@culinora.com';
    const password = 'Password123!';

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log('FAIL: User not found in DB');
        return;
    }
    console.log('SUCCESS: User found, email:', user.email);

    if (!user.emailVerified) {
        console.log('FAIL: emailVerified is null or false. Current value:', user.emailVerified);
        return;
    }
    console.log('SUCCESS: emailVerified is valid:', user.emailVerified);

    if (!user.password) {
        console.log('FAIL: user.password is null');
        return;
    }
    console.log('SUCCESS: Hash exists');

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        console.log('FAIL: Password hash does not match Password123!');
        return;
    }
    console.log('SUCCESS: Password matches hash!');

    console.log('ALL CHECKS PASSED. NextAuth authorize() would return:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
