import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("video") as File
    const lessonId = formData.get("lessonId") as string
    
    if (!file) {
      return NextResponse.json({ error: "Video dosyası bulunamadı" }, { status: 400 })
    }

    // Video dosyası kontrolü
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: "Lütfen bir video dosyası seçin" }, { status: 400 })
    }

    // Dosya boyutu kontrolü (500MB limit)
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json({ error: "Video dosyası 500MB'dan küçük olmalıdır" }, { status: 400 })
    }

    // Cloudinary upload
    const cloudinaryUpload = async (file: File) => {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME
      const apiKey = process.env.CLOUDINARY_API_KEY
      const apiSecret = process.env.CLOUDINARY_API_SECRET
      const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'video_upload'
      const folder = process.env.CLOUDINARY_FOLDER || 'chef-courses/videos'

      if (!cloudName || !apiKey || !apiSecret) {
        throw new Error("Cloudinary credentials eksik")
      }

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
      
      // FormData oluştur
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('upload_preset', uploadPreset) // Cloudinary'de bu preset'i oluşturun
      uploadFormData.append('resource_type', 'video')
      uploadFormData.append('folder', folder) // Organize etmek için klasör
      uploadFormData.append('public_id', `video_${Date.now()}`) // Unique ID
      
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: uploadFormData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`)
      }
      
      const data = await response.json()
      return {
        url: data.secure_url,
        publicId: data.public_id,
        duration: data.duration,
        size: data.bytes
      }
    }

    // Cloudinary'e yükle
    const uploadResult = await cloudinaryUpload(file)
    
    // Lesson'ı güncelle
    if (lessonId) {
      await prisma.lesson.update({
        where: { id: lessonId },
        data: { 
          videoUrl: uploadResult.url,
          duration: Math.round(uploadResult.duration / 60) // dakika cinsinden
        }
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      videoUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      duration: uploadResult.duration,
      size: uploadResult.size,
      message: "Video başarıyla cloud'a yüklendi" 
    })

  } catch (error) {
    console.error("Cloud upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Video yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}
