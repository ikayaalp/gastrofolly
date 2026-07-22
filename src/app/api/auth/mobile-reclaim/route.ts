import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';

// Tek-cihaz oturum kuralıyla düşürülmüş mobil oturumu tek dokunuşla geri alır
// ("Kim izliyor?" ekranı — web'deki /api/auth/reclaim'in mobil karşılığı).
// İmzası VE süresi geçerli bir Bearer token şarttır; yalnızca sessionId eşleşme
// kontrolü atlanır, çünkü amaç başka cihazın devraldığı oturumu bu cihaza geri
// taşımaktır. Şifre/credential doğrulaması bypass edilmez; body'den kimlik alınmaz.
export async function POST(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        if (!(await checkRateLimit(`mobile-reclaim:${ip}`, RATE_LIMITS.AUTH)).success) {
            return NextResponse.json(
                { message: 'Çok fazla deneme. Lütfen birkaç dakika sonra tekrar deneyin.' },
                { status: 429 }
            );
        }

        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
        }

        let decoded: { userId: string };
        try {
            decoded = jwt.verify(authHeader.substring(7), process.env.NEXTAUTH_SECRET!) as {
                userId: string;
            };
        } catch {
            // İmza geçersiz veya süre dolmuş → oturum geri alınamaz, tam giriş gerekir.
            return NextResponse.json({ message: 'Oturum süresi dolmuş' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                createdAt: true,
                subscriptionPlan: true,
                subscriptionStartDate: true,
                subscriptionEndDate: true,
            },
        });

        if (!user) {
            return NextResponse.json({ message: 'Kullanıcı bulunamadı' }, { status: 401 });
        }

        // Oturumu bu cihaza geri al: karşı cihazın sessionId'si geçersizleşir
        // (Netflix tarzı "son geri alan kazanır").
        const newSessionId = randomUUID();
        await prisma.user.update({
            where: { id: user.id },
            data: { currentSessionId: newSessionId },
        });

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                sessionId: newSessionId,
            },
            process.env.NEXTAUTH_SECRET!,
            { expiresIn: '30d' }
        );

        const isSubscriptionValid =
            user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
                createdAt: user.createdAt,
                subscriptionPlan: user.subscriptionPlan,
                subscriptionStartDate: user.subscriptionStartDate,
                subscriptionEndDate: user.subscriptionEndDate,
                isSubscriptionValid,
            },
        });
    } catch (error) {
        console.error('Mobile reclaim error:', error);
        return NextResponse.json(
            { message: 'Oturum yenilenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
