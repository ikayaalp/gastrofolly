import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { generateUniqueUsername } from '@/lib/generateUsername'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit'

const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'))

// Apple Sign-In token verification endpoint for mobile app
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { identityToken, email, name } = body

        console.log('🍎 Apple Auth Attempt started...');

        // Brute-force koruması: hem IP hem e-posta bazında sınırla.
        const ip = getClientIp(request);
        if (!(await checkRateLimit(`apple-mobile-ip:${ip}`, RATE_LIMITS.AUTH)).success ||
            (email && !(await checkRateLimit(`apple-mobile-email:${email.trim().toLowerCase()}`, RATE_LIMITS.AUTH)).success)) {
            return NextResponse.json(
                { message: 'Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin.' },
                { status: 429 }
            );
        }

        if (!identityToken) {
            console.error('❌ Error: identityToken is missing from request body');
            return NextResponse.json(
                { message: 'Hata: Apple identityToken backend\'e ulaşmadı' },
                { status: 400 }
            )
        }

        let decoded: any;
        try {
            const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
                issuer: 'https://appleid.apple.com',
                audience: 'com.chef2.app',
            })
            decoded = payload;
        } catch (error) {
            console.error('❌ Error: Failed to verify identityToken', error);
            return NextResponse.json(
                { message: 'Hata: Geçersiz Apple token' },
                { status: 401 }
            )
        }

        console.log('✅ Token verified successfully');

        const appleUserId = decoded.sub as string; // Benzersiz Apple Kullanıcı ID'si
        const userEmail = decoded.email || email;

        // 1. Önce bu Apple ID ile (Account tablosunda) eşleşen bir kullanıcı var mı bak
        const account = await prisma.account.findUnique({
            where: {
                provider_providerAccountId: {
                    provider: 'apple',
                    providerAccountId: appleUserId
                }
            },
            include: { user: true }
        });

        // Kullanıcı değişkenini tipini belirterek tanımlayalım
        let user: any = account?.user;

        if (!user && userEmail) {
            // 2. Eğer Apple ID ile bulamadıysak, email ile mevcut bir kullanıcı var mı bak
            user = await prisma.user.findUnique({
                where: { email: userEmail }
            });

            if (user) {
                // Mevcut kullanıcıya Apple hesabını bağla
                console.log('🔄 Linking Apple ID to existing user email:', userEmail);
                await prisma.account.create({
                    data: {
                        userId: user.id,
                        type: 'oauth',
                        provider: 'apple',
                        providerAccountId: appleUserId,
                    }
                });
            }
        }

        if (!user) {
            // 3. Hala kullanıcı yoksa, yeni bir kullanıcı oluştur (Sadece email varsa oluşturabiliriz)
            if (!userEmail) {
                console.error('❌ Error: No email found and no existing user linked to this Apple ID');
                return NextResponse.json(
                    { message: 'Hata: E-posta bilgisi alınamadı ve mevcut bir hesapla eşleşmedi.' },
                    { status: 400 }
                )
            }

            console.log('✨ Creating new user for Apple Sign-In:', userEmail);
            const username = await generateUniqueUsername(name || userEmail.split('@')[0], userEmail)
            user = await prisma.user.create({
                data: {
                    email: userEmail,
                    username,
                    name: name || userEmail.split('@')[0], // Varsayılan isim olarak email'in @ öncesini kullan
                    emailVerified: new Date(),
                    role: 'STUDENT',
                    accounts: {
                        create: {
                            type: 'oauth',
                            provider: 'apple',
                            providerAccountId: appleUserId,
                        }
                    }
                }
            });
        }

        if (!process.env.NEXTAUTH_SECRET) {
            console.error('❌ Error: NEXTAUTH_SECRET is missing on server!');
            throw new Error('NEXTAUTH_SECRET server variable is missing');
        }

        // Generate a new session ID for concurrent login prevention
        const newSessionId = randomUUID()

        // Update currentSessionId in DB
        await prisma.user.update({
            where: { id: user.id },
            data: { currentSessionId: newSessionId }
        })

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                sessionId: newSessionId,
            },
            process.env.NEXTAUTH_SECRET!,
            { expiresIn: '30d' }
        )

        console.log('🎉 Apple Login Success for:', user.email);

        const isSubscriptionValid = user.subscriptionEndDate &&
            new Date(user.subscriptionEndDate) > new Date()

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
                isSubscriptionValid: !!isSubscriptionValid,
            }
        })

    } catch (error: any) {
        console.error('💥 CRITICAL Apple mobile auth error:', error);
        return NextResponse.json(
            { message: 'Apple ile giriş yapılırken teknik bir hata oluştu: ' + (error.message || 'Bilinmeyen hata') },
            { status: 500 }
        )
    }
}
