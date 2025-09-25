import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from 'cloudinary'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string || "image"

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 })
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "Lütfen bir resim dosyası seçin" }, { status: 400 })
    }

    // Dosya boyutu kontrolü (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Resim dosyası 10MB'dan küçük olmalıdır" }, { status: 400 })
    }

    // Cloudinary upload
    const cloudinaryUpload = async (file: File) => {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME
      const apiKey = process.env.CLOUDINARY_API_KEY
      const apiSecret = process.env.CLOUDINARY_API_SECRET
      const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'chef-courses-unsigned'
      const folder = process.env.CLOUDINARY_FOLDER || 'chef-courses/images'

      console.log('Cloudinary image upload credentials check:', {
        cloudName: cloudName ? '✓' : '✗',
        apiKey: apiKey ? '✓' : '✗',
        apiSecret: apiSecret ? '✓' : '✗',
        uploadPreset,
        folder,
        fileType: file.type,
        fileSize: file.size
      })

      if (!cloudName) {
        throw new Error("CLOUDINARY_CLOUD_NAME eksik")
      }

      // Cloudinary Upload API endpoint
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
      
      // FormData oluştur - Cloudinary dokümantasyonuna göre
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      
      // Upload preset kullan (unsigned upload için)
      if (uploadPreset) {
        uploadFormData.append('upload_preset', uploadPreset)
      }
      
      // Klasör ve public_id ayarla
      uploadFormData.append('folder', folder)
      uploadFormData.append('public_id', `${type}_${Date.now()}`)
      
      // Unsigned upload'da transformation ve eager kullanılamaz
      // Sadece temel parametreler kullanılabilir
      
      console.log('Uploading to Cloudinary with params:', {
        upload_preset: uploadPreset,
        folder: folder,
        public_id: `${type}_${Date.now()}`
      })
      
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: uploadFormData
      })
      
      console.log('Cloudinary image upload response status:', response.status)
      console.log('Cloudinary image upload response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        let errorMessage = 'Unknown error'
        try {
          const errorData = await response.json()
          console.error('Cloudinary image upload error response:', errorData)
          errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`
        } catch (parseError) {
          console.error('Error parsing Cloudinary error response:', parseError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(`Cloudinary upload failed: ${errorMessage}`)
      }
      
      const data = await response.json()
      console.log('Cloudinary upload success:', {
        public_id: data.public_id,
        secure_url: data.secure_url,
        width: data.width,
        height: data.height,
        bytes: data.bytes
      })
      
      return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
        size: data.bytes
      }
    }

    // Cloudinary'e yükle
    const uploadResult = await cloudinaryUpload(file)

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      width: uploadResult.width,
      height: uploadResult.height,
      size: uploadResult.size,
      message: "Resim başarıyla cloud'a yüklendi"
    })

  } catch (error) {
    console.error("Cloud image upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Resim yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}
