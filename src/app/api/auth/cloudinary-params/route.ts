import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuthUser } from '@/lib/mobileAuth';

export async function GET(request: NextRequest) {
    try {
        let isAuthenticated = false;

        // Try mobile auth first
        const mobileUser = await getAuthUser(request);
        if (mobileUser) {
            isAuthenticated = true;
        } else {
            // Fallback to web session
            const session = await getServerSession(authOptions);
            if (session) {
                isAuthenticated = true;
            }
        }

        if (!isAuthenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
