"use client"

import { useState } from "react"
import { Star, MessageCircle, User, Trash2, Send, X, Edit, Mail, Copy, Check, ChefHat } from "lucide-react"
import Image from "next/image"
import ConfirmationModal from "@/components/ui/ConfirmationModal"

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

  // Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null)

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

  const handleDeleteClick = (reviewId: string) => {
    setReviewToDelete(reviewId)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;

    setDeletingReviewId(reviewToDelete)
    try {
      const response = await fetch(`/api/reviews/${reviewToDelete}`, {
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
      setShowDeleteModal(false)
      setReviewToDelete(null)
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
      {/* Yorumlar Başlık ve Listesi Kaldırıldı, Sadece Chef Butonu */}
      <div className="flex justify-end">
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
        </div>
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Yorumu Sil"
        message="Bu yorumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Sil"
        isDanger={true}
        isLoading={deletingReviewId !== null}
      />
    </div>
  )
}
