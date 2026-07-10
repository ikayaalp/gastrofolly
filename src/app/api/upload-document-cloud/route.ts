import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from 'cloudinary'
import { getAuthUser } from '@/lib/mobileAuth'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string || "document"

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadý" }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: "Lütfen bir PDF dosyasý seçin" }, { status: 400 })
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF dosyasý 50MB'dan küçük olmalýdýr" }, { status: 400 })
    }

    const cloudinaryUpload = async (file: File) => {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME
      const apiKey = process.env.CLOUDINARY_API_KEY
      const apiSecret = process.env.CLOUDINARY_API_SECRET
      const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'chef-courses-unsigned'
      const folder = 'chef-courses'

      if (!cloudName) throw new Error("CLOUDINARY_CLOUD_NAME eksik")

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      if (uploadPreset) uploadFormData.append('upload_preset', uploadPreset)
      uploadFormData.append('folder', folder)
      uploadFormData.append('public_id', `${type}_${Date.now()}`)

      const response = await fetch(cloudinaryUrl, { method: 'POST', body: uploadFormData })

      if (!response.ok) {
        let errorMessage = 'Unknown error'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(`Cloudinary upload failed: ${errorMessage}`)
      }

      const data = await response.json()
      return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
        size: data.bytes
      }
    }

    const uploadResult = await cloudinaryUpload(file)

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      width: uploadResult.width,
      height: uploadResult.height,
      size: uploadResult.size,
      message: "PDF baþarýyla cloud'a yüklendi"
    })

  } catch (error) {
    console.error("Cloud document upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Belge yüklenirken hata oluþtu" },
      { status: 500 }
    )
  }
}
