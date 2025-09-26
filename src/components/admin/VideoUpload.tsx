"use client"

import { useState, useRef } from "react"
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react"

interface VideoUploadProps {
  onVideoUploaded: (videoUrl: string) => void
  lessonId?: string
}

export default function VideoUpload({ onVideoUploaded, lessonId }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Video dosyası kontrolü
    if (!file.type.startsWith('video/')) {
      setError("Lütfen bir video dosyası seçin")
      return
    }

    // Dosya boyutu kontrolü (500MB limit)
    if (file.size > 500 * 1024 * 1024) {
      setError("Video dosyası 500MB'dan küçük olmalıdır")
      return
    }

    setUploading(true)
    setError("")
    setSuccess("")
    setUploadProgress(0)

    try {
      console.log('Starting video upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        lessonId: lessonId
      })

      const formData = new FormData()
      formData.append('video', file)
      if (lessonId) {
        formData.append('lessonId', lessonId)
      }

      console.log('Sending request to /api/upload-video-cloud')
      
      const response = await fetch('/api/upload-video-cloud', {
        method: 'POST',
        body: formData
      })

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      let data
      try {
        data = await response.json()
        console.log('Response data:', data)
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError)
        const responseText = await response.text()
        console.log('Response text:', responseText)
        setError(`API hatası: ${response.status} - ${responseText}`)
        return
      }

      if (response.ok) {
        setSuccess(`Video başarıyla yüklendi: ${file.name}`)
        onVideoUploaded(data.videoUrl)
        setUploadProgress(100)
      } else {
        console.error('Video upload error response:', data)
        console.error('Response status:', response.status)
        console.error('Response statusText:', response.statusText)
        
        let errorMessage = "Video yüklenirken hata oluştu"
        
        console.log('Error response data:', data)
        console.log('Response status:', response.status)
        console.log('Response statusText:', response.statusText)
        
        if (data && data.error) {
          errorMessage = `Hata: ${data.error}`
        } else if (data && data.message) {
          errorMessage = `Hata: ${data.message}`
        } else if (response.status === 401) {
          errorMessage = "Cloudinary kimlik doğrulama hatası. API anahtarlarını kontrol edin."
        } else if (response.status === 403) {
          errorMessage = "Cloudinary erişim hatası. Upload preset'i kontrol edin."
        } else if (response.status === 413) {
          errorMessage = "Video dosyası çok büyük. 500MB'dan küçük bir dosya seçin."
        } else if (response.status === 500) {
          errorMessage = "Sunucu hatası. Cloudinary ayarlarını kontrol edin."
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        console.log('Setting error message:', errorMessage)
        setError(errorMessage)
      }
    } catch (error) {
      console.error("Upload error:", error)
      const errorMessage = error instanceof Error ? error.message : "Video yüklenirken hata oluştu"
      setError(errorMessage)
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
    setUploadProgress(0)
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Video Yükle</h3>
      
      {/* Upload Area */}
      <div 
        onClick={triggerFileSelect}
        className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 hover:bg-gray-700/50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        {uploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-white">Video yükleniyor...</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-white font-medium">Video dosyası seçin</p>
              <p className="text-gray-400 text-sm mt-1">MP4, MOV, AVI formatları desteklenir (Max: 500MB)</p>
            </div>
            <button
              type="button"
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Dosya Seç
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mt-4 flex items-center justify-between bg-red-900/50 border border-red-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
          <button onClick={clearMessages} className="text-red-400 hover:text-red-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-center justify-between bg-green-900/50 border border-green-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-green-200">{success}</span>
          </div>
          <button onClick={clearMessages} className="text-green-400 hover:text-green-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Supported Formats */}
      <div className="mt-4 text-xs text-gray-500">
        <p>Desteklenen formatlar: MP4 (önerilen), MOV, AVI, MKV, WebM</p>
        <p>Önerilen ayarlar: 1080p, H.264 codec, AAC audio</p>
      </div>
    </div>
  )
}
