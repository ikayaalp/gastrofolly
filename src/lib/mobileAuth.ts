import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
    try {
        console.log('getAuthUser: Attempting to get server session for Web...');
        const session = await getServerSession(authOptions);
        console.log('getAuthUser: Session result:', session ? 'Session found' : 'No session');

        if (session?.user?.id) {
            console.log('getAuthUser: User ID from session:', session.user.id);
            // Always fetch fresh user data to get latest subscription status
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    subscriptionEndDate: true,
                    subscriptionPlan: true
                }
            });

            if (user) {
                console.log('getAuthUser: User found in DB via session');
                return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    subscriptionEndDate: user.subscriptionEndDate,
                    subscriptionPlan: user.subscriptionPlan
                };
            } else {
                console.log('getAuthUser: User NOT found in DB via session ID');
            }
        }
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
            select: {
                id: true,
                email: true,
                role: true,
                subscriptionEndDate: true,
                subscriptionPlan: true
            }
        });

        if (!user) {
            return null;
        }

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
