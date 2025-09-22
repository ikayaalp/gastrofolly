"use client"

import { useState } from "react"
import { Star, MessageCircle, User, Trash2 } from "lucide-react"

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
        // Sayfayı yenile veya state'i güncelle
        window.location.reload()
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
        // Sayfayı yenile veya state'i güncelle
        window.location.reload()
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
            className={`h-5 w-5 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-400'
            } ${interactive ? 'cursor-pointer hover:text-yellow-300' : ''}`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6">

      {/* Yorum Yapma Formu */}
      {canComment && userId && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">Yorum Yap</h3>
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-300">
                Puan:
              </label>
              {renderStars(newRating, true, setNewRating)}
            </div>
            <div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Kurs hakkındaki düşüncelerinizi paylaşın..."
                rows={3}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Gönderiliyor...' : 'Yorum Gönder'}
            </button>
          </form>
        </div>
      )}

      {/* Yorumlar Listesi */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Henüz yorum yapılmamış.</p>
            {canComment && (
              <p className="text-gray-500 text-sm mt-2">İlk yorumu sen yap!</p>
            )}
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-700 pb-6 last:border-b-0">
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {review.user.image ? (
                    <img
                      src={review.user.image}
                      alt={review.user.name || 'Kullanıcı'}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Yorum İçeriği */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-white">
                        {review.user.name || 'Anonim Kullanıcı'}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {renderStars(review.rating)}
                      {/* Silme Butonu - Sadece yorumu yazan kişi görebilir */}
                      {userId && review.userId === userId && (
                        <button
                          onClick={() => handleDeleteComment(review.id)}
                          disabled={deletingReviewId === review.id}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
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
