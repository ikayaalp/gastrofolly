"use client"

import { useState } from "react"
import { Star, MessageCircle, User, Trash2, Send, X, Edit, Mail, Copy, Check, ChefHat } from "lucide-react"
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
  instructor?: {
    name: string | null
    email?: string | null
    image?: string | null
  }
}

export default function CommentsSection({
  reviews,
  courseId,
  canComment = false,
  userId,
  instructor,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [newRating, setNewRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [showChefModal, setShowChefModal] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)

  const handleCopyEmail = async () => {
    if (instructor?.email) {
      try {
        await navigator.clipboard.writeText(instructor.email)
        setEmailCopied(true)
        setTimeout(() => setEmailCopied(false), 2000)
      } catch (error) {
        console.error('Email kopyalama hatası:', error)
      }
    }
  }

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
        setShowCommentModal(false)
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
      {/* Yorumlar Başlık */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-500/10 p-2 rounded-lg">
            <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            Yorumlar {reviews.length > 0 && `(${reviews.length})`}
          </h2>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Chef'e Sor Butonu */}
          {canComment && instructor && (
            <button
              onClick={() => setShowChefModal(true)}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-3 md:px-4 py-2 md:py-2.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 md:space-x-2 shadow-lg hover:shadow-orange-500/50 text-sm md:text-base"
            >
              <ChefHat className="h-4 w-4" />
              <span className="hidden sm:inline">Chef&apos;e Sor</span>
              <span className="sm:hidden">Chef</span>
            </button>
          )}

          {/* Yorum Yap Butonu */}
          {canComment && userId && (
            <button
              onClick={() => setShowCommentModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 md:px-4 py-2 md:py-2.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 md:space-x-2 shadow-lg hover:shadow-orange-500/50 text-sm md:text-base"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Yorum Yap</span>
              <span className="sm:hidden">Yorum</span>
            </button>
          )}
        </div>
      </div>

      {/* Yorumlar Listesi */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-12 text-center">
            <div className="bg-gray-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-10 w-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Henüz yorum yapılmamış</h3>
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

      {/* Chef'e Sor Modal */}
      {showChefModal && instructor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl w-full max-w-md shadow-2xl shadow-orange-500/10">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-500/10 p-2 rounded-lg">
                  <ChefHat className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white">Chef&apos;e Sor</h3>
              </div>
              <button
                onClick={() => setShowChefModal(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Chef Bilgileri */}
              <div className="flex items-center space-x-4">
                {instructor.image ? (
                  <Image
                    src={instructor.image}
                    alt={instructor.name || 'Chef'}
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-orange-500"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center border-2 border-orange-500">
                    <ChefHat className="h-8 w-8 text-white" />
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-bold text-white">{instructor.name || 'Chef'}</h4>
                  <p className="text-orange-400 text-sm">Eğitmen</p>
                </div>
              </div>

              {/* Açıklama */}
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <p className="text-gray-300 text-sm">
                  Chef&apos;inize mail yolundan ulaşabilirsiniz. Sorularınızı doğrudan aşağıdaki e-posta adresine gönderebilirsiniz.
                </p>
              </div>

              {/* Email Alanı */}
              {instructor.email && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-400">E-posta Adresi</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-black border border-gray-800 rounded-lg px-4 py-3 flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-orange-500" />
                      <span className="text-white font-mono text-sm">{instructor.email}</span>
                    </div>
                    <button
                      onClick={handleCopyEmail}
                      className={`p-3 rounded-lg transition-all ${emailCopied
                        ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                        : 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30'
                        }`}
                      title="E-postayı kopyala"
                    >
                      {emailCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                  {emailCopied && (
                    <p className="text-green-500 text-sm">✓ E-posta kopyalandı!</p>
                  )}
                </div>
              )}

              {/* Mail Gönder Butonu */}
              {instructor.email && (
                <a
                  href={`mailto:${instructor.email}`}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-700 hover:to-orange-600 transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-orange-500/50"
                >
                  <Mail className="h-5 w-5" />
                  <span>Mail Gönder</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Yorum Yapma Modal */}
      {showCommentModal && canComment && userId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl w-full max-w-2xl shadow-2xl shadow-orange-500/10">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-500/10 p-2 rounded-lg">
                  <Edit className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white">Yorum Yap</h3>
              </div>
              <button
                onClick={() => setShowCommentModal(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmitComment} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Puanınız
                </label>
                {renderStars(newRating, true, setNewRating)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Yorumunuz
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                  placeholder="Kurs hakkındaki düşüncelerinizi paylaşın..."
                  rows={6}
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCommentModal(false)}
                  className="px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg font-medium transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-700 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-orange-500/50"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? 'Gönderiliyor...' : 'Yorum Gönder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
