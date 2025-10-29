"use client"

import { useState, useRef, useCallback } from "react"
import { storage } from "@/lib/firebase"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { Upload, X, CheckCircle, AlertCircle, FileVideo } from "lucide-react"

interface VideoUploadProps {
  onVideoUploaded: (videoUrl: string) => void
  lessonId?: string
}

export default function VideoUpload({ onVideoUploaded, lessonId }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
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
      const timestamp = Date.now()
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const path = `videos/${lessonId || "general"}/${timestamp}_${safeFileName}`
      const storageRef = ref(storage, path)

      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || "video/mp4",
      })

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            setUploadProgress(Math.round(progress))
          },
          (err) => {
            reject(err)
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
              setSuccess(`Video başarıyla yüklendi: ${file.name}`)
              setUploadProgress(100)
              onVideoUploaded(downloadUrl)
              resolve()
            } catch (e) {
              reject(e)
            }
          }
        )
      })
    } catch (error) {
      console.error("Upload error:", error)
      const errorMessage = error instanceof Error ? error.message : "Video yüklenirken hata oluştu"
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const clearMessages = () => {
    setError("")
    setSuccess("")
    setUploadProgress(0)
  }

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      await uploadFile(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Video Yükle</h3>
      
      {/* Upload Area */}
      <div 
        onClick={triggerFileSelect}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          dragActive 
            ? 'border-orange-500 bg-orange-500/10 scale-105' 
            : 'border-gray-600 hover:border-orange-500 hover:bg-gray-700/50'
        }`}
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
        ) : dragActive ? (
          <div className="space-y-4">
            <FileVideo className="h-12 w-12 text-orange-500 mx-auto animate-pulse" />
            <div>
              <p className="text-orange-500 font-medium">Video dosyasını buraya bırakın</p>
              <p className="text-gray-400 text-sm mt-1">MP4, MOV, AVI formatları desteklenir</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-white font-medium">Video dosyası seçin veya sürükleyip bırakın</p>
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
