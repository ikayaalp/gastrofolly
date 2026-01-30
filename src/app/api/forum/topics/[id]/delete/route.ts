import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/mobileAuth'
import { v2 as cloudinary } from 'cloudinary'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request)

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = await params

        // Find the topic with media info
        const topic = await prisma.topic.findUnique({
            where: { id },
            select: {
                authorId: true,
                mediaUrl: true,
                mediaType: true
            }
        })

        if (!topic) {
            return NextResponse.json(
                { error: 'Tartışma bulunamadı' },
                { status: 404 }
            )
        }

        // Check if user is the author
        // Note: Use user.id directly. In an admin route we might allow admins, 
        // but this looks like a user route (checking authorId).
        if (topic.authorId !== user.id) {
            return NextResponse.json(
                { error: 'Bu tartışmayı silme yetkiniz yok' },
                { status: 403 }
            )
        }

        // Cloudinary Media Deletion Logic
        if (topic.mediaUrl && topic.mediaUrl.includes('cloudinary')) {
            try {
                // Configure Cloudinary
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET
                })

                // Extract Public ID
                // Regex matches content after /upload/(v.../)? and before file extension
                const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/
                const match = topic.mediaUrl.match(regex)

                if (match && match[1]) {
                    const publicId = match[1]
                    const resourceType = topic.mediaType === 'VIDEO' ? 'video' : 'image'

                    console.log(`Attempting to delete Cloudinary media: ${publicId} (${resourceType})`)

                    await cloudinary.uploader.destroy(publicId, {
                        resource_type: resourceType
                    })

                    console.log('Cloudinary media deleted successfully')
                }
            } catch (cloudError) {
                console.error('Failed to delete media from Cloudinary:', cloudError)
                // We proceed with DB deletion even if image delete fails to prevent "stuck" posts
            }
        }

        // Delete all posts (comments) in the topic first
        await prisma.post.deleteMany({
            where: { topicId: id }
        })

        // Delete the topic
        await prisma.topic.delete({
            where: { id }
        })

        return NextResponse.json({ success: true, message: 'Tartışma ve medyası silindi' })

    } catch (error) {
        console.error('Delete topic error:', error)
        return NextResponse.json(
            { error: 'Tartışma silinirken bir hata oluştu' },
            { status: 500 }
        )
    }
}
