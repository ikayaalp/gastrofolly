import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary globally
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function deleteForumTopic(topicId: string) {
    // Find the topic with media info
    const topic = await prisma.topic.findUnique({
        where: { id: topicId },
        select: { mediaUrl: true, mediaType: true }
    })

    if (!topic) return false

    // Cloudinary Media Deletion Logic
    if (topic.mediaUrl && topic.mediaUrl.includes('cloudinary')) {
        try {
            const regex = /\/upload\/(?:v\d+\/)?([^\.]+)/
            const match = topic.mediaUrl.match(regex)
            if (match && match[1]) {
                const publicId = match[1]
                const resourceType = topic.mediaType === 'VIDEO' ? 'video' : 'image'
                await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
            }
        } catch (cloudError) {
            console.error('Failed to delete media from Cloudinary:', cloudError)
        }
    }

    // Fetch and delete media for all posts in the topic
    const postsWithMedia = await prisma.post.findMany({
        where: { topicId, mediaUrl: { not: null } },
        select: { id: true, mediaUrl: true, mediaType: true }
    })

    for (const post of postsWithMedia) {
        if (post.mediaUrl && post.mediaUrl.includes('cloudinary')) {
            try {
                const regex = /\/upload\/(?:v\d+\/)?([^\.]+)/
                const match = post.mediaUrl.match(regex)
                if (match && match[1]) {
                    const publicId = match[1]
                    const resourceType = post.mediaType === 'VIDEO' ? 'video' : 'image'
                    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
                }
            } catch (cloudError) {
                console.error(`Failed to delete media for post ${post.id} from Cloudinary:`, cloudError)
            }
        }
    }

    // Prisma Cascade handles posts and relations
    await prisma.topic.delete({
        where: { id: topicId }
    })

    return true
}

export async function deleteForumPost(postId: string) {
    const postsToDelete = await prisma.post.findMany({
        where: {
            OR: [
                { id: postId },
                { parentId: postId }
            ]
        },
        select: { id: true, mediaUrl: true, mediaType: true }
    })

    if (postsToDelete.length === 0) return false

    // Delete media from Cloudinary for all affected posts
    for (const p of postsToDelete) {
        if (p.mediaUrl && p.mediaUrl.includes('cloudinary')) {
            try {
                const regex = /\/upload\/(?:v\d+\/)?([^\.]+)/
                const match = p.mediaUrl.match(regex)
                if (match && match[1]) {
                    const publicId = match[1]
                    const resourceType = p.mediaType === 'VIDEO' ? 'video' : 'image'
                    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
                }
            } catch (cloudinaryError) {
                console.error('Failed to delete post media from Cloudinary:', cloudinaryError)
            }
        }
    }

    // Delete the post and its replies
    await prisma.post.deleteMany({
        where: {
            OR: [
                { id: postId },
                { parentId: postId }
            ]
        }
    })

    return true
}
