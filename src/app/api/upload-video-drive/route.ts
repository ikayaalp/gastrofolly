import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  console.log('=== GOOGLE DRIVE VIDEO UPLOAD API START ===')
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

    console.log('Google Drive credentials check:', {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✓' : '✗',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✓' : '✗',
      GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN ? '✓' : '✗'
    })

    // Google Drive API setup
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'urn:ietf:wg:oauth:2.0:oob'
    )

    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    })

    const drive = google.drive({ version: 'v3', auth })

    // Video dosyasını buffer'a çevir
    const buffer = Buffer.from(await file.arrayBuffer())
    
    console.log('Uploading to Google Drive...')
    
    // Google Drive'a yükle
    const response = await drive.files.create({
      requestBody: {
        name: `gastrofolly-videos/${Date.now()}-${file.name}`,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || 'root']
      },
      media: {
        mimeType: file.type,
        body: buffer
      }
    })

    console.log('Google Drive upload success:', response.data)
    
    // Public link oluştur
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    })

    // Video URL'i oluştur
    const videoUrl = `https://drive.google.com/file/d/${response.data.id}/view`
    
    console.log('Google Drive video URL:', videoUrl)
    
    // Lesson'ı güncelle
    if (lessonId) {
      await prisma.lesson.update({
        where: { id: lessonId },
        data: { 
          videoUrl: videoUrl,
          duration: Math.round(Math.random() * 60 + 30) // Geçici süre
        }
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      videoUrl: videoUrl,
      fileId: response.data.id,
      message: "Video başarıyla Google Drive'a yüklendi" 
    })

  } catch (error) {
    console.error("=== GOOGLE DRIVE VIDEO UPLOAD API ERROR ===")
    console.error("Google Drive upload error:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Video yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}
