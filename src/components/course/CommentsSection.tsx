"use client"

import { useState } from "react"
import { Star, MessageCircle, User, Trash2, Send } from "lucide-react"
import Image from "next/image"

interface Review {
  id: string
  rating: number
  comment?: string | null
  createdAt: Date
  userId: string
  user: {
    name?: string | null
    image?: string | null
  }
}

interface CommentsSectionProps {
  reviews: Review[]
  courseId: string
  canComment?: boolean
  userId?: string
}

export default function CommentsSection({
  reviews,
  courseId,
  canComment = false,
  userId
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [newRating, setNewRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)
  const [hoveredStar, setHoveredStar] = useState(0)

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !userId) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          rating: newRating,
          comment: newComment.trim()
        })
      })

      if (response.ok) {
        setNewComment("")
        setNewRating(5)
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('Yorum gönderme hatası:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (reviewId: string) => {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
      return
    }

    setDeletingReviewId(reviewId)
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      } else {
        alert('Yorum silinirken bir hata oluştu.')
      }
    } catch (error) {
      console.error('Yorum silme hatası:', error)
      alert('Yorum silinirken bir hata oluştu.')
    } finally {
      setDeletingReviewId(null)
    }
  }

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 transition-all ${star <= (interactive && hoveredStar > 0 ? hoveredStar : rating)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-600'
              } ${interactive ? 'cursor-pointer hover:scale-110' : ''}`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredStar(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredStar(0) : undefined}
          />
        ))}
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="bg-orange-500/10 p-2 rounded-lg">
          <MessageCircle className="h-6 w-6 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">
          Yorumlar {reviews.length > 0 && `(${reviews.length})`}
        </h2>
      </div>

      {/* Yorum Yapma Formu */}
      {canComment && userId && (
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Yorum Yap</h3>
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Puanınız
              </label>
              {renderStars(newRating, true, setNewRating)}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Yorumunuz
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                placeholder="Kurs hakkındaki düşüncelerinizi paylaşın..."
                rows={4}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-700 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-orange-500/50"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Gönderiliyor...' : 'Yorum Gönder'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Yorumlar Listesi */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-12 text-center">
            <div className="bg-gray-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-10 w-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Henüz yorum yapılmamış</h3>
            {canComment && (
              <p className="text-gray-400 text-sm">İlk yorumu sen yap!</p>
            )}
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {review.user.image ? (
                    <Image
                      src={review.user.image}
                      alt={review.user.name || 'Kullanıcı'}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Yorum İçeriği */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-white text-lg">
                        {review.user.name || 'Anonim Kullanıcı'}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {renderStars(review.rating)}
                      {/* Silme Butonu */}
                      {userId && review.userId === userId && (
                        <button
                          onClick={() => handleDeleteComment(review.id)}
                          disabled={deletingReviewId === review.id}
                          className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all p-2 rounded-lg"
                          title="Yorumu sil"
                        >
                          <Trash2 className={`h-4 w-4 ${deletingReviewId === review.id ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-gray-300 leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
