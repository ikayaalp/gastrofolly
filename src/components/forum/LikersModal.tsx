'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, ThumbsUp, Loader2 } from 'lucide-react'
import { getOptimizedMediaUrl } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

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

  const titleContent = (
    <div className="flex items-center space-x-2">
      <ThumbsUp className="h-5 w-5 text-orange-500" />
      <span className="text-white font-bold">Beğenenler</span>
      {likeCount > 0 && (
        <span className="bg-orange-500/10 text-orange-500 text-xs font-bold px-2 py-0.5 rounded-full">
          {likeCount}
        </span>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titleContent}
      size="sm"
    >
      <div className="max-h-[400px] overflow-y-auto overscroll-contain -mx-6 -mb-6 px-6 pb-6 pt-2 scrollbar-thin scrollbar-thumb-zinc-700">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="h-7 w-7 text-orange-500 animate-spin" />
            <span className="text-sm text-zinc-500">Yükleniyor...</span>
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
            <ThumbsUp className="h-10 w-10 text-zinc-700" />
            <span className="text-sm text-zinc-500">Henüz beğenen yok</span>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {likers.map((liker) => (
              <div
                key={liker.id}
                className="flex items-center space-x-3 py-3 hover:bg-white/[0.03] transition-colors -mx-4 px-4 rounded-xl"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Link href={`/chef-sosyal/profil/${liker.id}`} onClick={onClose}>
                    {liker.image ? (
                      <img
                        src={getOptimizedMediaUrl(liker.image, 'IMAGE')}
                        alt={liker.name || ''}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-800 hover:opacity-80 transition-opacity"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 hover:bg-zinc-700 transition-colors">
                        <User className="w-5 h-5 text-zinc-400" />
                      </div>
                    )}
                  </Link>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/chef-sosyal/profil/${liker.id}`} onClick={onClose} className="text-white font-semibold text-sm truncate hover:underline cursor-pointer block">
                    {liker.name || 'Anonim'}
                  </Link>
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
    </Modal>
  )
}
