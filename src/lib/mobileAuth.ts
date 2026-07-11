import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from './prisma';
import { isPremiumUser, lazyCleanupExpiredSubscription } from './subscription';
import jwt from 'jsonwebtoken';

interface MobileUser {
    id: string;
    email: string;
    role?: string;
    subscriptionEndDate?: Date | null;
    subscriptionPlan?: string | null;
}

/**
 * Get user from either NextAuth session (web) or JWT token (mobile)
 * Returns user object or null if not authenticated
 */
export async function getAuthUser(request: NextRequest): Promise<MobileUser | null> {
    // First, try NextAuth session (for web)
    // First, try NextAuth session (for web)
    try {
        const session = await getServerSession(authOptions);

        if (session?.user?.id) {
            return {
                id: session.user.id,
                email: session.user.email || '',
                role: (session.user as any).role,
                subscriptionEndDate: (session.user as any).subscriptionEndDate,
                subscriptionPlan: (session.user as any).subscriptionPlan
            };
        }
    } catch (err) {
        // Silent error for session fetch
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
            sessionId?: string;
        };

        // Verify user still exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                subscriptionEndDate: true,
                subscriptionPlan: true,
                currentSessionId: true,
            }
        });

        if (!user) {
            return null;
        }

        // Single-device login check
        if (user.currentSessionId && decoded.sessionId !== user.currentSessionId) {
            console.log(`[MobileAuth] Rejecting old session for user: ${user.id}`);
            return null;
        }

        // Lazy cleanup
        await lazyCleanupExpiredSubscription(prisma, user);

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            subscriptionEndDate: user.subscriptionEndDate,
            subscriptionPlan: user.subscriptionPlan
        };
    } catch (error) {
        console.error('JWT verification error:', error);
        return null;
    }
}
