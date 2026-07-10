'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, Image as ImageIcon, Video, Loader2, AlertCircle } from 'lucide-react'

interface MediaUploaderProps {
    onUploadComplete: (mediaData: {
        mediaUrl: string
        mediaType: 'IMAGE' | 'VIDEO'
        thumbnailUrl?: string
        publicId?: string
    }) => void
    onRemove: () => void
    onUploadStart?: () => void
    onUploadEnd?: () => void
    currentMedia?: {
        mediaUrl: string
        mediaType: 'IMAGE' | 'VIDEO'
        thumbnailUrl?: string
    } | null
}

const MAX_IMAGE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

export default function MediaUploader({ onUploadComplete, onRemove, onUploadStart, onUploadEnd, currentMedia }: MediaUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [isTakingLong, setIsTakingLong] = useState(false)
    
    const fileInputRef = useRef<HTMLInputElement>(null)
    const xhrRef = useRef<XMLHttpRequest | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Clear timeout on unmount or when upload finishes
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            if (xhrRef.current) xhrRef.current.abort()
        }
    }, [])

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

    const cancelUpload = () => {
        if (xhrRef.current) {
            xhrRef.current.abort()
            xhrRef.current = null
        }
        setIsUploading(false)
        setUploadProgress(0)
        setIsTakingLong(false)
        setError('Yükleme iptal edildi.')
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        onUploadEnd?.()
    }

    const uploadFile = async (file: File) => {
        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            return
        }

        setError(null)
        setIsUploading(true)
        setUploadProgress(0)
        setIsTakingLong(false)
        onUploadStart?.()

        // Set 30 seconds timer for long upload warning
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
            setIsTakingLong(true)
        }, 30000)

        try {
            // 1. Get Cloudinary Config
            const configRes = await fetch('/api/auth/cloudinary-params')
            if (!configRes.ok) throw new Error('Cloudinary konfigürasyonu alınamadı')
            const { cloudName, uploadPreset } = await configRes.json()

            // 2. Prepare Cloudinary Upload
            const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)
            const resourceType = isVideo ? 'video' : 'image'
            const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
            
            const formData = new FormData()
            formData.append('file', file)
            formData.append('upload_preset', uploadPreset)
            formData.append('folder', 'forum-media')
            if (isVideo) {
                formData.append('transformation', 'c_limit,w_1280,h_720')
            }

            // 3. Upload with XHR for progress
            const result = await new Promise<any>((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                xhrRef.current = xhr
                
                xhr.open('POST', url)

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        setUploadProgress(Math.round((e.loaded / e.total) * 100))
                    }
                }

                xhr.onload = () => {
                    if (xhr.status === 200 || xhr.status === 201) {
                        resolve(JSON.parse(xhr.responseText))
                    } else {
                        try {
                            const err = JSON.parse(xhr.responseText)
                            reject(new Error(err.error?.message || `Yükleme başarısız (${xhr.status})`))
                        } catch {
                            const rawMsg = xhr.responseText ? xhr.responseText.substring(0, 100) : xhr.statusText
                            reject(new Error(`Yükleme hatası (${xhr.status}): ${rawMsg}`))
                        }
                    }
                }

                xhr.onerror = () => reject(new Error('Ağ hatası oluştu'))
                xhr.onabort = () => reject(new Error('ABORTED'))
                
                xhr.send(formData)
            })

            // Fallback for thumbnailUrl if not provided by Cloudinary directly in unsigned upload
            let thumbnailUrl = result.secure_url
            if (isVideo) {
                thumbnailUrl = result.secure_url.replace(/\.[^.]+$/, '.jpg')
            }

            onUploadComplete({
                mediaUrl: result.secure_url,
                mediaType: isVideo ? 'VIDEO' : 'IMAGE',
                thumbnailUrl: thumbnailUrl,
                publicId: result.public_id
            })
            
        } catch (err) {
            if (err instanceof Error && err.message === 'ABORTED') {
                // Handled in cancelUpload
                return
            }
            setError(err instanceof Error ? err.message : 'Yükleme sırasında hata oluştu')
        } finally {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            setIsUploading(false)
            setIsTakingLong(false)
            setUploadProgress(0)
            xhrRef.current = null
            onUploadEnd?.()
        }
    }

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        if (!isUploading) setIsDragging(true)
    }, [isUploading])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (isUploading) return

        const files = e.dataTransfer.files
        if (files.length > 0) {
            uploadFile(files[0])
        }
    }, [isUploading])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            uploadFile(files[0])
            // Clear value to allow selecting same file again if it failed
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleRemove = () => {
        setError(null)
        onRemove()
    }

    // Eğer medya yüklüyse önizleme göster
    if (currentMedia && !isUploading) {
        return (
            <div className="relative group mt-4 mb-4">
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
        <div className="space-y-2 mt-4 mb-4">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`
          relative border-2 border-dashed rounded-xl p-6 text-center 
          transition-all duration-200 ease-in-out
          ${isDragging
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-700 hover:border-orange-500/50 hover:bg-gray-800/50'
                    }
          ${isUploading ? 'cursor-default border-orange-500/50 bg-gray-800/30' : 'cursor-pointer'}
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                />

                {isUploading ? (
                    <div className="space-y-4 max-w-sm mx-auto">
                        <Loader2 className="h-10 w-10 text-orange-500 mx-auto animate-spin" />
                        <div className="text-gray-300 font-medium">Yükleniyor... {uploadProgress}%</div>
                        
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        
                        {isTakingLong && (
                            <p className="text-orange-400 text-xs animate-pulse">
                                Hâlâ yükleniyor, lütfen bekleyin... Bağlantı hızınıza göre bu işlem sürebilir.
                            </p>
                        )}

                        <button 
                            onClick={(e) => { e.stopPropagation(); cancelUpload(); }}
                            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded transition-colors mt-2"
                        >
                            İptal Et
                        </button>
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
                        <div className="text-xs text-gray-600 space-y-1">
                            <p>Fotoğraf: JPEG, PNG, WebP, vb. (max 50MB)</p>
                            <p>Video: MP4, MOV, WebM (max 100MB)</p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}
        </div>
    )
}
