import { useState, useRef } from 'react'

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void
  currentImageUrl?: string
  type?: string
}

const resizeImageBeforeUpload = (file: File, maxDimension: number, quality: number): Promise<File> => {
  return new Promise((resolve) => {
    try {
      const img = new globalThis.Image()
      img.onload = () => {
        let { width, height } = img
        if (width <= maxDimension && height <= maxDimension) {
          URL.revokeObjectURL(img.src)
          return resolve(file)
        }

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(img.src)
          return resolve(file)
        }

        ctx.drawImage(img, 0, 0, width, height)
        
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/webp'
        const outputQuality = file.type === 'image/png' ? undefined : quality
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(img.src)
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: blob.type,
              lastModified: Date.now(),
            })
            resolve(resizedFile)
          } else {
            resolve(file)
          }
        }, mimeType, outputQuality)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        resolve(file)
      }

      img.src = URL.createObjectURL(file)
    } catch (error) {
      console.error("Resize error:", error)
      resolve(file)
    }
  })
}

export default function ImageUpload({ onImageUploaded, currentImageUrl, type = "image" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Resim dosyası kontrolü
    if (!file.type.startsWith('image/')) {
      setError("Lütfen bir resim dosyası seçin")
      return
    }

    // Dosya boyutu kontrolü (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError("Resim dosyası 10MB'dan küçük olmalıdır")
      return
    }

    setUploading(true)
    setError("")
    setSuccess("")

    try {
      const optimizedFile = await resizeImageBeforeUpload(file, 2000, 0.85)

      const formData = new FormData()
      formData.append('file', optimizedFile)
      formData.append('type', type)

      const response = await fetch('/api/upload-image-cloud', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Resim başarıyla yüklendi: ${file.name}`)
        onImageUploaded(data.url)
      } else {
        setError(data.error || "Resim yüklenirken hata oluştu")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setError("Resim yüklenirken hata oluştu")
    } finally {
      setUploading(false)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const clearMessages = () => {
    setError("")
    setSuccess("")
  }

  return (
    <div className="space-y-4">
      {/* Mevcut resim */}
      {currentImageUrl && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Mevcut Resim
          </label>
          <img 
            src={currentImageUrl} 
            alt="Current" 
            className="w-32 h-20 object-cover rounded-lg border border-gray-700"
          />
        </div>
      )}

      {/* Dosya seçici */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Yeni Resim Yükle
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={triggerFileSelect}
          disabled={uploading}
          className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>İşleniyor & Yükleniyor...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Resim Seç</span>
            </>
          )}
        </button>
      </div>

      {/* Hata mesajı */}
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Başarı mesajı */}
      {success && (
        <div className="p-3 bg-green-900/20 border border-green-500/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-400 text-sm">{success}</span>
          </div>
        </div>
      )}

      {/* Mesajı temizle butonu */}
      {(error || success) && (
        <button
          type="button"
          onClick={clearMessages}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Mesajı Temizle
        </button>
      )}
    </div>
  )
}
