import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'test@culinora.com' },
            select: { id: true, email: true, emailVerified: true }
        });
        return NextResponse.json({ success: true, user });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
    }
}
