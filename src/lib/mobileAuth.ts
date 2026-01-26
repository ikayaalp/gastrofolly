import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

interface MobileUser {
    id: string;
    email: string;
    role?: string;
}

/**
 * Get user from either NextAuth session (web) or JWT token (mobile)
 * Returns user object or null if not authenticated
 */
export async function getAuthUser(request: NextRequest): Promise<MobileUser | null> {
    // First, try NextAuth session (for web)
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
            console.log('getAuthUser: Found web session', session.user.id);
            return {
                id: session.user.id,
                email: session.user.email || '',
                role: session.user.role,
            };
        }
        console.log('getAuthUser: No web session found');
    } catch (err) {
        console.error('getAuthUser: Error getting web session', err);
    }

    // If no session, try JWT token (for mobile)
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as {
            userId: string;
            email: string;
            role?: string;
        };

        // Verify user still exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true }
        });

        if (!user) {
            return null;
        }

        return {
            id: user.id,
            email: user.email,
            role: user.role,
        };
    } catch (error) {
        console.error('JWT verification error:', error);
        return null;
    }
}
