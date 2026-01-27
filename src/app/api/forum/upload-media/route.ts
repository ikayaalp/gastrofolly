import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Dosya boyutu limitleri (bytes)
const MAX_IMAGE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB

// Desteklenen formatlar
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

export async function POST(request: NextRequest) {
    try {
        console.log('Upload API: Starting upload process...');
        const user = await getAuthUser(request)
        let finalUser = user;

        if (!finalUser) {
            console.warn('getAuthUser returned null, trying direct getServerSession fallback...');
            const session = await getServerSession(authOptions);

            if (session?.user?.email) {
                console.log('Direct getServerSession found user:', session.user.email);
                const dbUser = await prisma.user.findUnique({
                    where: { email: session.user.email },
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        subscriptionEndDate: true,
                        subscriptionPlan: true
                    }
                });

                if (dbUser) {
                    finalUser = {
                        id: dbUser.id,
                        email: dbUser.email,
                        role: dbUser.role,
                        subscriptionEndDate: dbUser.subscriptionEndDate,
                        subscriptionPlan: dbUser.subscriptionPlan
                    };
                }
            }
        }

        if (!finalUser) {
            console.warn('Upload attempt unauthorized: User session not found (both methods failed)')
            return NextResponse.json(
                { error: 'Yükleme yapabilmek için giriş yapmalısınız (Oturum bulunamadı)' },
                { status: 401 }
            )
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'Dosya bulunamadı' },
                { status: 400 }
            )
        }

        // Dosya türünü belirle
        const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
        const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

        if (!isImage && !isVideo) {
            return NextResponse.json(
                { error: 'Desteklenmeyen dosya formatı. Desteklenen formatlar: JPEG, PNG, WebP, GIF, MP4, MOV, WebM' },
                { status: 400 }
            )
        }

        // Dosya boyutu kontrolü
        const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
        if (file.size > maxSize) {
            const limitMB = maxSize / (1024 * 1024)
            return NextResponse.json(
                { error: `Dosya boyutu ${limitMB}MB'dan büyük olamaz` },
                { status: 400 }
            )
        }

        // Cloudinary ayarları
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'chef-courses-unsigned'
        const folder = 'forum-media'

        if (!cloudName) {
            console.error('CLOUDINARY_CLOUD_NAME eksik')
            return NextResponse.json(
                { error: 'Server konfigürasyon hatası' },
                { status: 500 }
            )
        }

        // Cloudinary'e yükle
        const resourceType = isVideo ? 'video' : 'image'
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`

        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('upload_preset', uploadPreset)
        uploadFormData.append('folder', folder)
        uploadFormData.append('public_id', `forum_${Date.now()}_${Math.random().toString(36).substring(7)}`)

        // Video için thumbnail oluşturma ayarı
        // Unsigned upload'da eager parametresi kullanılamıyor, bu yüzden fallback mekanizması kullanılacak
        /* 
        if (isVideo) {
            uploadFormData.append('eager', 'c_thumb,w_400,h_300,g_auto')
        }
        */

        const response = await fetch(cloudinaryUrl, {
            method: 'POST',
            body: uploadFormData
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Cloudinary upload error raw response:', errorText)

            let errorMessage = 'Bilinmeyen hata'
            try {
                const errorData = JSON.parse(errorText)
                errorMessage = errorData.error?.message || errorData.message || errorMessage
            } catch (e) { }

            return NextResponse.json(
                { error: 'Dosya yüklenirken hata oluştu: ' + errorMessage },
                { status: 500 }
            )
        }

        const result = await response.json()

        // Response hazırla
        const responseData: {
            success: boolean
            mediaUrl: string
            mediaType: 'IMAGE' | 'VIDEO'
            thumbnailUrl?: string
            publicId: string
        } = {
            success: true,
            mediaUrl: result.secure_url,
            mediaType: isVideo ? 'VIDEO' : 'IMAGE',
            publicId: result.public_id
        }

        // Video için thumbnail URL'i ekle
        if (isVideo && result.eager && result.eager[0]) {
            responseData.thumbnailUrl = result.eager[0].secure_url
        } else if (isVideo) {
            // Fallback: Video URL'inden thumbnail oluştur
            responseData.thumbnailUrl = result.secure_url.replace(/\.[^.]+$/, '.jpg')
        }

        return NextResponse.json(responseData)

    } catch (error) {
        console.error('Forum media upload error:', error)
        return NextResponse.json(
            { error: 'Dosya yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}
