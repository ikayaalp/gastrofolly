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
      const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'chef-courses-unsigned'
      const folder = process.env.CLOUDINARY_FOLDER || 'chef-courses/videos'

      console.log('Cloudinary credentials check:', {
        cloudName: cloudName ? '✓' : '✗',
        apiKey: apiKey ? '✓' : '✗',
        apiSecret: apiSecret ? '✓' : '✗',
        uploadPreset,
        folder
      })

      if (!cloudName) {
        throw new Error("CLOUDINARY_CLOUD_NAME eksik")
      }

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
      
      // FormData oluştur - Cloudinary dokümantasyonuna göre
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      
      // Upload preset kullan (unsigned upload için)
      if (uploadPreset) {
        uploadFormData.append('upload_preset', uploadPreset)
      }
      
      // Klasör ve public_id ayarla
      uploadFormData.append('folder', folder)
      uploadFormData.append('public_id', `video_${Date.now()}`)
      
      // Video optimizasyonu için transformations
      uploadFormData.append('transformation', 'f_auto,q_auto')
      
      // Eager transformations (önceden işlenmiş versiyonlar)
      uploadFormData.append('eager', 'w_1280,h_720,c_fill,f_auto,q_auto')
      
      console.log('Uploading video to Cloudinary with params:', {
        upload_preset: uploadPreset,
        folder: folder,
        public_id: `video_${Date.now()}`,
        transformation: 'f_auto,q_auto'
      })
      
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: uploadFormData
      })
      
      console.log('Cloudinary video upload response status:', response.status)
      console.log('Cloudinary video upload response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        let errorMessage = 'Unknown error'
        try {
          const errorData = await response.json()
          console.error('Cloudinary video upload error response:', errorData)
          errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`
        } catch (parseError) {
          console.error('Error parsing Cloudinary error response:', parseError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(`Cloudinary upload failed: ${errorMessage}`)
      }
      
      const data = await response.json()
      console.log('Cloudinary video upload success:', {
        public_id: data.public_id,
        secure_url: data.secure_url,
        duration: data.duration,
        bytes: data.bytes
      })
      
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
