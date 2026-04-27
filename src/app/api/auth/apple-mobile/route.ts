import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface AppleTokenPayload {
    iss: string
    aud: string
    exp: number
    sub: string
    email?: string
    email_verified?: string
}

// Apple Sign-In token verification endpoint for mobile app
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { identityToken, email, name } = body

        console.log('🍎 Apple Auth Attempt started...');

        if (!identityToken) {
            console.error('❌ Error: identityToken is missing from request body');
            return NextResponse.json(
                { message: 'Hata: Apple identityToken backend\'e ulaşmadı' },
                { status: 400 }
            )
        }

        // Decode Apple identity token (JWT)
        const decoded = jwt.decode(identityToken) as AppleTokenPayload | null

        if (!decoded) {
            console.error('❌ Error: Failed to decode identityToken');
            return NextResponse.json(
                { message: 'Hata: Geçersiz Apple token formatı' },
                { status: 401 }
            )
        }

        console.log('✅ Token decoded successfully');
        console.log('Token Info:', { 
            iss: decoded.iss, 
            aud: decoded.aud, 
            email: decoded.email,
            sub: decoded.sub 
        });

        // Verify token claims
        if (decoded.iss !== 'https://appleid.apple.com') {
            console.error('❌ Error: Invalid issuer:', decoded.iss);
            return NextResponse.json(
                { message: `Hata: Geçersiz token issuer: ${decoded.iss}` },
                { status: 401 }
            )
        }

        // Bundle ID check
        if (decoded.aud !== 'com.chef2.app') {
            console.error(`❌ Error: Invalid audience. Expected com.chef2.app, got: ${decoded.aud}`);
            return NextResponse.json(
                { message: `Hata: Bundle ID uyuşmuyor. Beklenen: com.chef2.app, Gelen: ${decoded.aud}` },
                { status: 401 }
            )
        }

        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            console.error('❌ Error: Token expired');
            return NextResponse.json(
                { message: 'Hata: Apple token süresi dolmuş' },
                { status: 401 }
            )
        }

        const appleUserId = decoded.sub; // Benzersiz Apple Kullanıcı ID'si
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
            user = await prisma.user.create({
                data: {
                    email: userEmail,
                    name: name || userEmail.split('@')[0],
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

        // Generate JWT token for mobile app
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
            },
            process.env.NEXTAUTH_SECRET,
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
