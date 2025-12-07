import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
    try {
        // Get token from header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];

        // Verify token (Mobile app JWT)
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
        } catch (err) {
            return NextResponse.json({ message: 'Geçersiz token' }, { status: 401 });
        }

        const userId = decoded.userId;

        // In a real production app with Stripe, you would call Stripe API here to cancel the subscription.
        // For this implementation, we interpret "cancel" as removing the subscription access immediately or marking it as finished.

        // We will updated the user to remove subscription details.
        // Alternatively, if we want to keep it until the end of period but cancel renewal, we need a 'cancelAtPeriodEnd' flag which doesn't exist in schema.
        // So we will assume immediate cancellation for this task scope or just valid until existing end date but clear plan? 
        // Best approach for "Cancel" button usually is to stop auto-renew. 
        // Since we don't have stripe integration shown in schema for auto-renew flags clearly (except stripePaymentId in Payment), 
        // we'll assume a direct "End Subscription" action for simplicity as requested.

        // Let's set subscriptionEndDate to NOW to expire it immediately, and clear certain flags if needed.
        // Or just keep the end date but maybe we should clear the plan? 
        // If we clear the plan, the mobile app checkAccess might fail immediately.

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                subscriptionPlan: null,
                subscriptionEndDate: new Date(), // Set to now to expire it
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Abonelik başarıyla iptal edildi.',
            user: {
                ...user,
                isSubscriptionValid: false // Explicitly return this for mobile app update
            }
        });

    } catch (error) {
        console.error('Subscription cancel error:', error);
        return NextResponse.json({ message: 'İptal işlemi başarısız oldu' }, { status: 500 });
    }
}
