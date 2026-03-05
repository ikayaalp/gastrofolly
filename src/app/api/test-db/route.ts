import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'test@culinora.com' },
            select: { id: true, email: true, emailVerified: true, password: true }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare('Password123!', user.password || '');

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified
            },
            passwordMatch: isPasswordValid
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
    }
}
