import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Google token verification endpoint for mobile app
export async function POST(request: NextRequest) {
    try {
        const { idToken, email, name, picture } = await request.json()

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
            user = await prisma.user.create({
                data: {
                    email,
                    name: name || email.split('@')[0],
                    image: picture,
                    emailVerified: new Date(), // Google already verified email
                    role: 'STUDENT'
                }
            })
        } else {
            // Update existing user's image if not set
            if (!user.image && picture) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { image: picture }
                })
            }
        }

        // Generate JWT token for mobile app
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
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
                subscriptionPlan: user.subscriptionPlan,
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
