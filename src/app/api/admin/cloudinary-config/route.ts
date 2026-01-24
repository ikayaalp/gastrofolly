import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/mobileAuth" // Using the same auth check as other routes

export async function GET(request: Request) {
    try {
        // Simple auth check - ensure user is logged in (and preferably admin/instructor)
        const user = await getAuthUser(request as any)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'chef-courses-unsigned'

        if (!cloudName) {
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
