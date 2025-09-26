import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { v2 as cloudinary } from 'cloudinary'

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  console.log('=== CLOUDINARY VIDEO UPLOAD API START ===')
  try {
    console.log('Parsing form data...')
    const formData = await request.formData()
    const file = formData.get("video") as File
    const lessonId = formData.get("lessonId") as string
    
    console.log('Form data parsed:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      lessonId: lessonId
    })
    
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

    console.log('Cloudinary credentials check:', {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? '✓' : '✗',
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '✓' : '✗',
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✓' : '✗'
    })

    // Video dosyasını buffer'a çevir
    const buffer = Buffer.from(await file.arrayBuffer())
    
    console.log('Uploading to Cloudinary...')
    
    // Cloudinary'ye yükle (mevcut preset kullan)
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          upload_preset: 'chef-courses-videos-unsigned',
          public_id: `video_${Date.now()}`,
          chunk_size: 6000000, // 6MB chunks
          eager: [
            { width: 1280, height: 720, crop: 'scale' },
            { width: 854, height: 480, crop: 'scale' }
          ],
          eager_async: true
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    console.log('Cloudinary upload success:', result)
    
    // Lesson'ı güncelle
    if (lessonId) {
      await prisma.lesson.update({
        where: { id: lessonId },
        data: { 
          videoUrl: (result as any).secure_url,
          duration: Math.round(Math.random() * 60 + 30) // Geçici süre
        }
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      videoUrl: (result as any).secure_url,
      publicId: (result as any).public_id,
      message: "Video başarıyla Cloudinary'ye yüklendi" 
    })

  } catch (error) {
    console.error("=== CLOUDINARY VIDEO UPLOAD API ERROR ===")
    console.error("Cloudinary upload error:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Video yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}
