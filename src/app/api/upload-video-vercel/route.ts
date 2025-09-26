import { NextRequest, NextResponse } from "next/server"
import { put } from '@vercel/blob'
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  console.log('=== VERCEL BLOB VIDEO UPLOAD API START ===')
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

    console.log('Uploading to Vercel Blob...')
    
    // Vercel Blob'a yükle
    const blob = await put(`videos/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    console.log('Vercel Blob upload success:', {
      url: blob.url,
      pathname: blob.pathname
    })
    
    // Lesson'ı güncelle
    if (lessonId) {
      await prisma.lesson.update({
        where: { id: lessonId },
        data: { 
          videoUrl: blob.url,
          duration: Math.round(Math.random() * 60 + 30) // Geçici süre (gerçek süre hesaplanabilir)
        }
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      videoUrl: blob.url,
      pathname: blob.pathname,
      message: "Video başarıyla Vercel Blob'a yüklendi" 
    })

  } catch (error) {
    console.error("=== VERCEL BLOB VIDEO UPLOAD API ERROR ===")
    console.error("Vercel Blob upload error:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Video yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}
