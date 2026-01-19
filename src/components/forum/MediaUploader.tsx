'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react'

interface MediaUploaderProps {
    onUploadComplete: (mediaData: {
        mediaUrl: string
        mediaType: 'IMAGE' | 'VIDEO'
        thumbnailUrl?: string
    }) => void
    onRemove: () => void
    currentMedia?: {
        mediaUrl: string
        mediaType: 'IMAGE' | 'VIDEO'
        thumbnailUrl?: string
    } | null
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

export default function MediaUploader({ onUploadComplete, onRemove, currentMedia }: MediaUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const validateFile = (file: File): string | null => {
        const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
        const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

        if (!isImage && !isVideo) {
            return 'Desteklenmeyen dosya formatı. Lütfen JPEG, PNG, WebP, GIF, MP4, MOV veya WebM yükleyin.'
        }

        const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
        if (file.size > maxSize) {
            const limitMB = maxSize / (1024 * 1024)
            return `Dosya boyutu ${limitMB}MB'dan büyük olamaz.`
        }

        return null
    }

    const uploadFile = async (file: File) => {
        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            return
        }

        setError(null)
        setIsUploading(true)
        setUploadProgress(10)

        try {
            const formData = new FormData()
            formData.append('file', file)

            // Simüle edilmiş progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90))
            }, 200)

            const response = await fetch('/api/forum/upload-media', {
                method: 'POST',
                body: formData
            })

            clearInterval(progressInterval)

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Yükleme başarısız')
            }

            const result = await response.json()
            setUploadProgress(100)

            onUploadComplete({
                mediaUrl: result.mediaUrl,
                mediaType: result.mediaType,
                thumbnailUrl: result.thumbnailUrl
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Yükleme sırasında hata oluştu')
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = e.dataTransfer.files
        if (files.length > 0) {
            uploadFile(files[0])
        }
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            uploadFile(files[0])
        }
    }

    const handleRemove = () => {
        setError(null)
        onRemove()
    }

    // Eğer medya yüklüyse önizleme göster
    if (currentMedia) {
        return (
            <div className="relative group">
                <div className="relative rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
                    {currentMedia.mediaType === 'VIDEO' ? (
                        <div className="relative">
                            <video
                                src={currentMedia.mediaUrl}
                                className="w-full max-h-64 object-contain"
                                controls
                            />
                            <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded flex items-center space-x-1">
                                <Video className="h-4 w-4 text-orange-400" />
                                <span className="text-xs text-white">Video</span>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <img
                                src={currentMedia.mediaUrl}
                                alt="Yüklenen medya"
                                className="w-full max-h-64 object-contain"
                            />
                            <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded flex items-center space-x-1">
                                <ImageIcon className="h-4 w-4 text-orange-400" />
                                <span className="text-xs text-white">Fotoğraf</span>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleRemove}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Medyayı kaldır"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-700 hover:border-orange-500/50 hover:bg-gray-800/50'
                    }
          ${isUploading ? 'pointer-events-none' : ''}
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {isUploading ? (
                    <div className="space-y-3">
                        <Loader2 className="h-10 w-10 text-orange-500 mx-auto animate-spin" />
                        <p className="text-gray-400">Yükleniyor...</p>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex justify-center space-x-2">
                            <ImageIcon className="h-8 w-8 text-gray-500" />
                            <Video className="h-8 w-8 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-gray-300 font-medium">
                                Fotoğraf veya video ekle
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                                Sürükle bırak veya tıkla
                            </p>
                        </div>
                        <div className="text-xs text-gray-600">
                            <p>Fotoğraf: JPEG, PNG, WebP, GIF (max 10MB)</p>
                            <p>Video: MP4, MOV, WebM (max 100MB)</p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start space-x-2">
                    <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}
        </div>
    )
}
