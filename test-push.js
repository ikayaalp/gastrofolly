const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
    const prisma = new PrismaClient();

    try {
        // Push token olan kullanıcıları getir
        const usersWithTokens = await prisma.user.findMany({
            where: { pushToken: { not: null } },
            select: { id: true, email: true, pushToken: true }
        });

        console.log('Push token olan kullanıcılar:', usersWithTokens.length);

        const pushTokens = usersWithTokens
            .map(u => u.pushToken)
            .filter(token => token !== null);

        if (pushTokens.length === 0) {
            console.log('Hiç push token yok!');
            return;
        }

        // Expo push API'sine test mesajı gönder
        const messages = pushTokens.map(token => ({
            to: token,
            sound: 'default',
            title: 'Test Bildirimi',
            body: 'Bu bir test bildirimidir',
            data: { type: 'TEST' }
        }));

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });

        const result = await response.json();

        // Sonucu dosyaya yaz
        fs.writeFileSync('push-result.json', JSON.stringify(result, null, 2));
        console.log('Sonuç push-result.json dosyasına yazıldı');

    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);
