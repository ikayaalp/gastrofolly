import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { prisma } from "@/lib/prisma"
import path from "path"
import { getAuthUser } from '@/lib/mobileAuth'

export async function POST(request: NextRequest) {
  try {
    // Only admin or instructor can upload videos
    const user = await getAuthUser(request)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("video") as File

    if (!file) {
      return NextResponse.json({ error: "Video dosyası bulunamadı" }, { status: 400 })
    }

    // Video dosyalarını public/videos klasörüne kaydet
    const videosDir = path.join(process.cwd(), "public", "videos")

    try {
      await mkdir(videosDir, { recursive: true })
    } catch (error) {
      // Klasör zaten varsa hata verme
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Dosya adını temizle ve unique yap
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${originalName}`
    const filePath = path.join(videosDir, fileName)

    await writeFile(filePath, buffer)

    const videoUrl = `/videos/${fileName}`

    // Eğer lessonId varsa, dersi güncelle
    const lessonId = formData.get("lessonId") as string
    if (lessonId) {
      await prisma.lesson.update({
        where: { id: lessonId },
        data: { videoUrl }
      })
    }

    return NextResponse.json({
      success: true,
      videoUrl,
      fileName,
      originalName: file.name,
      size: file.size,
      message: "Video başarıyla yüklendi"
    })

  } catch (error) {
    console.error("Video upload error:", error)
    return NextResponse.json(
      { error: "Video yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}
