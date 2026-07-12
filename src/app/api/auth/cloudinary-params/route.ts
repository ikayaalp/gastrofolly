import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuthUser } from '@/lib/mobileAuth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
    try {
        let isAuthenticated = false;
        let userId = null;

        // Try mobile auth first
        const mobileUser = await getAuthUser(request);
        if (mobileUser) {
            isAuthenticated = true;
            userId = mobileUser.id;
        } else {
            // Fallback to web session
            const session = await getServerSession(authOptions);
            if (session?.user) {
                isAuthenticated = true;
                userId = session.user.id || session.user.email; // Fallback to email if id isn't in session
            }
        }

        if (!isAuthenticated || !userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!(await checkRateLimit(`upload-media:${userId}`, RATE_LIMITS.GENERAL)).success) {
            return NextResponse.json({ error: 'Çok fazla yükleme denemesi yaptınız, lütfen biraz bekleyin.' }, { status: 429 })
        }

        return NextResponse.json({
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'chef-courses-unsigned'
        });
    } catch (error) {
        console.error('Cloudinary config error:', error);
        return NextResponse.json({ error: 'Config fetch error' }, { status: 500 });
    }
}
