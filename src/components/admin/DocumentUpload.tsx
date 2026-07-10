"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, CheckCircle, AlertCircle, FileText } from "lucide-react"

interface DocumentUploadProps {
  onDocumentUploaded: (documentUrl: string) => void
  lessonId?: string
}

export default function DocumentUpload({ onDocumentUploaded, lessonId }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    // PDF kontrolü
    if (file.type !== 'application/pdf') {
      setError("Lütfen bir PDF dosyasý seçin")
      return
    }

    // Dosya boyutu kontrolü (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setError("PDF dosyasý 50MB'dan küçük olmalýdýr")
      return
    }

    setUploading(true)
    setError("")
    setSuccess("")
    setUploadProgress(0)

    try {
      // 1. Upload with XHR to our API route
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'document')

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/upload-document-cloud')

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(percentComplete)
          }
        }

        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText)
            setSuccess(`PDF baþarýyla yüklendi: ${file.name}`)
            setUploadProgress(100)
            onDocumentUploaded(data.secure_url)
            resolve()
          } else {
            reject(new Error('Yükleme baþarýsýz'))
          }
        }

        xhr.onerror = () => reject(new Error('Baðlantý hatasý'))
        xhr.send(formData)
      })

    } catch (error) {
      console.error("Upload error:", error)
      const errorMessage = error instanceof Error ? error.message : "PDF yüklenirken hata oluþtu"
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
      await uploadFile(e.dataTransfer.files[0])
    }
  }, [])

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="application/pdf"
        className="hidden"
      />

      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive 
            ? "border-orange-500 bg-orange-500/10" 
            : success 
              ? "border-green-500/50 bg-green-500/5" 
              : error 
                ? "border-red-500/50 bg-red-500/5" 
                : "border-gray-600 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-500"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          {success ? (
            <div className="bg-green-500/20 p-4 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          ) : error ? (
            <div className="bg-red-500/20 p-4 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          ) : (
            <div className="bg-gray-700 p-4 rounded-full">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          )}

          <div className="space-y-1">
            <p className="text-gray-300 font-medium">
              {success ? "Yükleme Tamamlandý" : "PDF Dosyasýný Sürükle ve Býrak"}
            </p>
            {!success && (
              <p className="text-gray-500 text-sm">
                veya gözatmak için týkla
              </p>
            )}
          </div>

          {!success && (
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={uploading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Dosya Seç
            </button>
          )}

          {uploading && (
            <div className="w-full max-w-xs mx-auto mt-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Yükleniyor...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
          {success && (
            <p className="text-green-500 text-sm mt-2">{success}</p>
          )}
        </div>

        {/* Drag Overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-orange-500/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <p className="text-orange-500 font-bold text-lg">Dosyayý Buraya Býrak</p>
          </div>
        )}
      </div>
    </div>
  )
}
