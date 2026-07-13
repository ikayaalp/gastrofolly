import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getAuthUser } from "@/lib/mobileAuth"

export async function GET(request: NextRequest) {
    try {
        let isAuthorized = false

        // 1. Try web session first (NextAuth) - consistent with other admin routes
        const session = await getServerSession(authOptions)
        if (session?.user) {
            const role = (session.user as any).role
            if (role === 'ADMIN' || role === 'INSTRUCTOR') {
                isAuthorized = true
            }
        }

        // 2. Fallback to mobile auth (JWT token)
        if (!isAuthorized) {
            const user = await getAuthUser(request)
            if (user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR')) {
                isAuthorized = true
            }
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'chef-courses-unsigned'

        if (!cloudName) {
            console.error("CLOUDINARY_CLOUD_NAME is not set in environment variables")
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        return NextResponse.json({
            cloudName,
            uploadPreset
        })
    } catch (error) {
        console.error("Config fetch error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
