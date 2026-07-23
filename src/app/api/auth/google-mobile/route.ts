import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { generateUniqueUsername } from '@/lib/generateUsername'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit'

const GOOGLE_MOBILE_CLIENT_IDS = [
    '334630749775-terb1dfppb1atgem3t1pc0o41chaj3r1.apps.googleusercontent.com', // iOS
    '334630749775-egnkr4i90r374isi6ep5iihjl0skqh19.apps.googleusercontent.com', // Android (EAS/dev SHA)
    '334630749775-fqhar6cei4f6oo9mp3f2qtn0acsi4e9k.apps.googleusercontent.com', // Android (Play imzalama SHA)
    '334630749775-meelg2lgcapd5d64rmbm9gmm8h06im0e.apps.googleusercontent.com'  // Web (sunucu) — idToken audience
];

// Google token verification endpoint for mobile app
export async function POST(request: NextRequest) {
    try {
        const { idToken, email, name, picture } = await request.json()

        // Brute-force koruması: hem IP hem e-posta bazında sınırla.
        const ip = getClientIp(request);
        if (!(await checkRateLimit(`google-mobile-ip:${ip}`, RATE_LIMITS.AUTH)).success ||
            (email && !(await checkRateLimit(`google-mobile-email:${email.trim().toLowerCase()}`, RATE_LIMITS.AUTH)).success)) {
            return NextResponse.json(
                { message: 'Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin.' },
                { status: 429 }
            );
        }

        if (!idToken || !email) {
            return NextResponse.json(
                { message: 'Google token ve email gerekli' },
                { status: 400 }
            )
        }

        // Verify the token with Google
        const googleResponse = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
        )

        if (!googleResponse.ok) {
            return NextResponse.json(
                { message: 'Geçersiz Google token' },
                { status: 401 }
            )
        }

        const googleData = await googleResponse.json()

        // Check audience (Client ID)
        if (!GOOGLE_MOBILE_CLIENT_IDS.includes(googleData.aud)) {
            return NextResponse.json(
                { message: 'Geçersiz Google client ID' },
                { status: 401 }
            )
        }

        // Verify email matches
        if (googleData.email !== email) {
            return NextResponse.json(
                { message: 'Email doğrulanamadı' },
                { status: 401 }
            )
        }

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            // Create new user from Google
            const username = await generateUniqueUsername(name || email.split('@')[0], email)
            user = await prisma.user.create({
                data: {
                    email,
                    username,
                    name: name || email.split('@')[0],
                    image: picture,
                    emailVerified: new Date(), // Google already verified email
                    role: 'STUDENT'
                }
            })
        } else {
            // Update existing user's image and verify email if not verified
            const updateData: any = {}
            if (!user.image && picture) updateData.image = picture
            if (!user.emailVerified) updateData.emailVerified = new Date()

            if (Object.keys(updateData).length > 0) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: updateData
                })
            }
        }

        // Generate a new session ID for concurrent login prevention
        const newSessionId = randomUUID()

        // Update currentSessionId in DB
        await prisma.user.update({
            where: { id: user.id },
            data: { currentSessionId: newSessionId }
        })

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
        
        // Check subscription validity
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
                isSubscriptionValid: isSubscriptionValid,
            }
        })

    } catch (error) {
        console.error('Google mobile auth error:', error)
        return NextResponse.json(
            { message: 'Google ile giriş yapılırken bir hata oluştu' },
            { status: 500 }
        )
    }
}
