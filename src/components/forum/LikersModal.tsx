'use client'

import { useState, useEffect } from 'react'
import { X, User, ThumbsUp, Loader2 } from 'lucide-react'
import { getOptimizedMediaUrl } from '@/lib/utils'

interface Liker {
  id: string
  name: string | null
  image: string | null
  likedAt: string
}

interface LikersModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'topic' | 'post'
  targetId: string
  likeCount: number
}

export default function LikersModal({ isOpen, onClose, type, targetId, likeCount }: LikersModalProps) {
  const [likers, setLikers] = useState<Liker[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && targetId) {
      loadLikers()
    }
    return () => {
      setLikers([])
      setError(null)
    }
  }, [isOpen, targetId])

  const loadLikers = async () => {
    setLoading(true)
    setError(null)
    try {
      const endpoint = type === 'topic'
        ? `/api/forum/topic-likers?topicId=${targetId}`
        : `/api/forum/post-likers?postId=${targetId}`

      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setLikers(data.likers)
      } else {
        setError('Beğenenler yüklenemedi')
      }
    } catch (err) {
      console.error('Error loading likers:', err)
      setError('Beğenenler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Az önce'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dk önce`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} sa önce`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} gün önce`
    return date.toLocaleDateString('tr-TR')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-[#0a0a0a] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <ThumbsUp className="h-5 w-5 text-orange-500" />
            <h2 className="text-[#e7e9ea] font-bold text-lg">Beğenenler</h2>
            {likeCount > 0 && (
              <span className="bg-orange-500/10 text-orange-500 text-xs font-bold px-2 py-0.5 rounded-full">
                {likeCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[400px] overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="h-7 w-7 text-orange-500 animate-spin" />
              <span className="text-sm text-gray-500">Yükleniyor...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <span className="text-sm text-red-400">{error}</span>
              <button
                onClick={loadLikers}
                className="text-sm text-orange-500 hover:text-orange-400 font-medium"
              >
                Tekrar Dene
              </button>
            </div>
          ) : likers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <ThumbsUp className="h-10 w-10 text-gray-700" />
              <span className="text-sm text-gray-500">Henüz beğenen yok</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/60">
              {likers.map((liker) => (
                <div
                  key={liker.id}
                  className="flex items-center space-x-3 px-5 py-3 hover:bg-white/[0.03] transition-colors"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {liker.image ? (
                      <img
                        src={getOptimizedMediaUrl(liker.image, 'IMAGE')}
                        alt={liker.name || ''}
                        className="w-10 h-10 rounded-full object-cover border border-gray-800"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#e7e9ea] font-semibold text-sm truncate">
                      {liker.name || 'Anonim'}
                    </p>
                    <p className="text-[#71767b] text-xs">
                      {formatTimeAgo(liker.likedAt)}
                    </p>
                  </div>

                  {/* Like icon indicator */}
                  <div className="flex-shrink-0">
                    <ThumbsUp className="h-3.5 w-3.5 text-orange-500 fill-current" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
