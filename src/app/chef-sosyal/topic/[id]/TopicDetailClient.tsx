'use client'

import Link from "next/link"
import { useState } from "react"
import { ChefHat, ArrowLeft, MessageCircle, ThumbsUp, Clock, User, Plus, Search, Bell } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"

interface Author {
  id: string
  name: string | null
  image: string | null
}

interface Category {
  id: string
  name: string
  slug: string
  color: string | null
}

interface Post {
  id: string
  content: string
  createdAt: Date | string
  likeCount: number
  parentId?: string | null
  author: Author
  replies?: Post[]
}

interface Topic {
  id: string
  title: string
  content: string
  slug: string
  createdAt: Date | string
  likeCount: number
  viewCount: number
  author: Author
  category: Category
  posts: Post[]
}

interface Session {
  user?: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

interface TopicDetailClientProps {
  session: Session | null
  topic: Topic
}

export default function TopicDetailClient({ session, topic }: TopicDetailClientProps) {
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [comments, setComments] = useState(topic.posts)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  // Zaman formatı
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Az önce'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} gün önce`
    
    return date.toLocaleDateString('tr-TR')
  }

  // Kullanıcı avatar'ı
  const getUserAvatar = (user: Author) => {
    if (user.image) {
      return (
        <img
          src={user.image}
          alt={user.name || 'User'}
          className="w-10 h-10 rounded-full object-cover"
        />
      )
    }
    return (
      <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
        <User className="h-5 w-5 text-white" />
      </div>
    )
  }

  // Yorum ekle
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !session?.user) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/forum/topics/${topic.id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        const newPost = await response.json()
        setComments([...comments, newPost])
        setNewComment('')
      } else {
        const error = await response.json()
        alert('Hata: ' + error.error)
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Yorum eklenirken hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  // Yanıt ekle
  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim() || !session?.user) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/forum/topics/${topic.id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: replyText, parentId })
      })

      if (response.ok) {
        const newReply = await response.json()
        // Yorumları güncelle
        setComments(comments.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply]
            }
          }
          return comment
        }))
        setReplyText('')
        setReplyingTo(null)
      } else {
        const error = await response.json()
        alert('Hata: ' + error.error)
      }
    } catch (error) {
      console.error('Error adding reply:', error)
      alert('Yanıt eklenirken hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {session?.user ? (
              // Giriş yapmış kullanıcı için: Logo + Navigation solda
              <div className="flex items-center space-x-8">
                <Link href="/home" className="flex items-center space-x-2">
                  <ChefHat className="h-8 w-8 text-orange-500" />
                  <span className="text-2xl font-bold text-white">Chef2.0</span>
                  {session.user.role === 'ADMIN' && (
                    <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">Admin</span>
                  )}
                </Link>
                <nav className="hidden md:flex space-x-6">
                  <Link href="/home" className="text-gray-300 hover:text-white transition-colors">
                    Ana Sayfa
                  </Link>
                  <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">
                    Kurslarım
                  </Link>
                  {session.user.role === 'ADMIN' && (
                    <>
                      <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                        Admin Paneli
                      </Link>
                      <Link href="/admin/courses" className="text-gray-300 hover:text-white transition-colors">
                        Kurs Yönetimi
                      </Link>
                    </>
                  )}
                  <Link href="/chef-sosyal" className="text-white font-semibold">
                    Chef Sosyal
                  </Link>
                  <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                    İletişim
                  </Link>
                </nav>
              </div>
            ) : (
              // Giriş yapmamış kullanıcı için: Logo solda
              <>
                <Link href="/" className="flex items-center space-x-2">
                  <ChefHat className="h-8 w-8 text-orange-500" />
                  <span className="text-2xl font-bold text-white">Chef2.0</span>
                </Link>
                {/* Navigation ortada */}
                <nav className="hidden md:flex space-x-8">
                  <Link href="/" className="text-gray-300 hover:text-orange-500">
                    Ana Sayfa
                  </Link>
                  <Link href="/about" className="text-gray-300 hover:text-orange-500">
                    Hakkımızda
                  </Link>
                  <Link href="/chef-sosyal" className="text-orange-500">
                    Chef Sosyal
                  </Link>
                  <Link href="/contact" className="text-gray-300 hover:text-orange-500">
                    İletişim
                  </Link>
                </nav>
              </>
            )}
            
            <div className="flex items-center space-x-4">
              {session?.user ? (
                <>
                  <button className="text-gray-300 hover:text-white transition-colors">
                    <Search className="h-5 w-5" />
                  </button>
                  <button className="text-gray-300 hover:text-white">
                    <Bell className="h-5 w-5" />
                  </button>
                  <UserDropdown />
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="text-gray-300 hover:text-orange-500"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Kayıt Ol
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Geri Dön Butonu */}
          <div className="mb-6">
            <Link 
              href="/chef-sosyal"
              className="inline-flex items-center text-orange-500 hover:text-orange-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Chef Sosyal&apos;e Dön
            </Link>
          </div>

          {/* Başlık */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-4 mb-4">
              {getUserAvatar(topic.author)}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span 
                    className="px-2 py-1 rounded text-sm font-medium"
                    style={{
                      backgroundColor: `${topic.category.color || '#6b7280'}20`,
                      color: topic.category.color || '#6b7280'
                    }}
                  >
                    {topic.category.name}
                  </span>
                  <span className="text-gray-500 text-sm flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTimeAgo(topic.createdAt.toString())}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">
                  {topic.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {topic.author.name || 'Anonim'}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {comments.length} yorum
                  </span>
                  <span className="flex items-center">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {topic.likeCount} beğeni
                  </span>
                  <span className="text-gray-500">
                    👁️ {topic.viewCount} görüntüleme
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-300 whitespace-pre-wrap">
                {topic.content}
              </p>
            </div>
          </div>

          {/* Yorum Ekleme Formu */}
          {session?.user && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Yorum Ekle</h2>
              <form onSubmit={handleAddComment}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none resize-none mb-4"
                  placeholder="Düşüncelerinizi paylaşın..."
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {submitting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <span>{submitting ? 'Gönderiliyor...' : 'Yorum Gönder'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Yorumlar */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              Yorumlar ({comments.length})
            </h2>
            
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-800 pb-6 last:border-b-0">
                    <div className="flex items-start space-x-4">
                      {getUserAvatar(comment.author)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-medium text-white">
                            {comment.author.name || 'Anonim'}
                          </span>
                          <span className="text-gray-500 text-sm flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeAgo(comment.createdAt.toString())}
                          </span>
                        </div>
                        <p className="text-gray-300 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        <div className="flex items-center space-x-4 mt-3">
                          <button className="flex items-center text-gray-400 hover:text-orange-400 transition-colors">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {comment.likeCount}
                          </button>
                          {session?.user && (
                            <button 
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              className="flex items-center text-gray-400 hover:text-orange-400 transition-colors"
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Yanıtla
                            </button>
                          )}
                        </div>

                        {/* Yanıt Ekleme Formu */}
                        {replyingTo === comment.id && (
                          <div className="mt-4 ml-4 border-l-2 border-gray-700 pl-4">
                            <div className="bg-gray-800 rounded-lg p-4">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none resize-none mb-3"
                                placeholder="Yanıtınızı yazın..."
                              />
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setReplyingTo(null)
                                    setReplyText('')
                                  }}
                                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                                >
                                  İptal
                                </button>
                                <button
                                  onClick={() => handleAddReply(comment.id)}
                                  disabled={submitting || !replyText.trim()}
                                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {submitting ? 'Gönderiliyor...' : 'Yanıtla'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Yanıtlar */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-4 ml-4 border-l-2 border-gray-700 pl-4 space-y-4">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="bg-gray-800 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                  {getUserAvatar(reply.author)}
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <span className="font-medium text-white text-sm">
                                        {reply.author.name || 'Anonim'}
                                      </span>
                                      <span className="text-gray-500 text-xs flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {formatTimeAgo(reply.createdAt.toString())}
                                      </span>
                                    </div>
                                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                                      {reply.content}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-2">
                                      <button className="flex items-center text-gray-400 hover:text-orange-400 transition-colors text-xs">
                                        <ThumbsUp className="h-3 w-3 mr-1" />
                                        {reply.likeCount}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
