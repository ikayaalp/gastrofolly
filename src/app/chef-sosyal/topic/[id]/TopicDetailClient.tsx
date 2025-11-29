'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import { ChefHat, ArrowLeft, MessageCircle, ThumbsUp, Clock, User, Plus, Search, Bell, Home, BookOpen, Users } from "lucide-react"
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
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(topic.likeCount)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())

  // Sayfa yüklendiğinde kullanıcının bu başlığı beğenip beğenmediğini kontrol et
  useEffect(() => {
    if (session?.user?.id) {
      checkLikeStatus()
      loadLikedPosts()
    }
  }, [session?.user?.id])

  // Kullanıcının beğendiği yorumları yükle
  const loadLikedPosts = async () => {
    try {
      const response = await fetch(`/api/forum/liked-posts?topicId=${topic.id}`)
      if (response.ok) {
        const data = await response.json()
        setLikedComments(new Set(data.likedPostIds))
      }
    } catch (error) {
      console.error('Error loading liked posts:', error)
    }
  }

  // Beğeni durumunu kontrol et
  const checkLikeStatus = async () => {
    try {
      const response = await fetch(`/api/forum/like?topicId=${topic.id}`)
      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
      }
    } catch (error) {
      console.error('Error checking like status:', error)
    }
  }

  // Beğenme/beğenmeme işlemi
  const handleLike = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/forum/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topicId: topic.id }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
        setLikeCount(prevCount => data.liked ? prevCount + 1 : prevCount - 1)
      }
    } catch (error) {
      console.error('Error liking topic:', error)
    }
  }

  // Yorum beğenme/beğenmeme işlemi
  const handleCommentLike = async (postId: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/forum/post-like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      })

      if (response.ok) {
        const data = await response.json()

        // Comment listesini güncelle
        setComments(prevComments =>
          prevComments.map(comment => {
            if (comment.id === postId) {
              return {
                ...comment,
                likeCount: data.liked ? comment.likeCount + 1 : comment.likeCount - 1
              }
            }

            // Replies içinde de arayalım
            if (comment.replies) {
              const updatedReplies = comment.replies.map(reply => {
                if (reply.id === postId) {
                  return {
                    ...reply,
                    likeCount: data.liked ? reply.likeCount + 1 : reply.likeCount - 1
                  }
                }
                return reply
              })
              return { ...comment, replies: updatedReplies }
            }

            return comment
          })
        )

        // Liked comments state'ini güncelle
        setLikedComments(prev => {
          const newSet = new Set(prev)
          if (data.liked) {
            newSet.add(postId)
          } else {
            newSet.delete(postId)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

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
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
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
                  <Link href="/messages" className="text-gray-300 hover:text-white transition-colors">
                    Mesajlar
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
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex items-start space-x-4 mb-4">
                {getUserAvatar(topic.author)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${topic.category.color || '#6b7280'}20`,
                        color: topic.category.color || '#6b7280'
                      }}
                    >
                      {topic.category.name}
                    </span>
                    <span className="text-gray-500 text-xs flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimeAgo(topic.createdAt.toString())}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-3">
                    {topic.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-xs text-gray-400 mb-4">
                    <span className="flex items-center">
                      <User className="h-3.5 w-3.5 mr-1" />
                      {topic.author.name || 'Anonim'}
                    </span>
                    {session?.user ? (
                      <button
                        onClick={handleLike}
                        className={`flex items-center space-x-1 transition-colors ${isLiked
                            ? 'text-orange-400 hover:text-orange-300'
                            : 'hover:text-orange-400'
                          }`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                        <span>{likeCount}</span>
                      </button>
                    ) : (
                      <span className="flex items-center">
                        <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                        {likeCount}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        const commentsSection = document.getElementById('comments-section')
                        if (commentsSection) {
                          commentsSection.scrollIntoView({ behavior: 'smooth' })
                        }
                      }}
                      className="flex items-center hover:text-orange-400 transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />
                      <span>{comments.length}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {topic.content}
                </p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-orange-600 to-orange-400"></div>
          </div>

          {/* Yorum Ekleme Formu */}
          {session?.user && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Yorum Ekle</h2>
              <form onSubmit={handleAddComment}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none mb-3"
                  placeholder="Düşüncelerinizi paylaşın..."
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="bg-orange-600 text-white px-5 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                Yorumlar ({comments.length})
              </h2>
            </div>

            {comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
              </div>
            ) : (
              <div id="comments-section" className="space-y-5">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-800 pb-5 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      {getUserAvatar(comment.author)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-white text-sm">
                            {comment.author.name || 'Anonim'}
                          </span>
                          <span className="text-gray-500 text-xs flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeAgo(comment.createdAt.toString())}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap mb-3">
                          {comment.content}
                        </p>
                        <div className="flex items-center space-x-3">
                          {session?.user ? (
                            <button
                              onClick={() => handleCommentLike(comment.id)}
                              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-colors text-xs ${likedComments.has(comment.id)
                                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                  : 'bg-[#1a1a1a] hover:bg-gray-800 text-gray-400'
                                }`}
                            >
                              <ThumbsUp className="h-3 w-3" />
                              <span>{comment.likeCount}</span>
                            </button>
                          ) : (
                            <div className="flex items-center text-gray-400 text-xs">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              {comment.likeCount}
                            </div>
                          )}
                          {session?.user && (
                            <button
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              className="flex items-center text-gray-400 hover:text-orange-400 transition-colors text-xs"
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Yanıtla
                            </button>
                          )}
                        </div>

                        {/* Yanıt Ekleme Formu */}
                        {replyingTo === comment.id && (
                          <div className="mt-3 ml-4 border-l-2 border-orange-500/30 pl-4">
                            <div className="bg-[#1a1a1a] rounded-lg p-3">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 bg-black border border-gray-800 rounded text-white text-sm placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none mb-2"
                                placeholder="Yanıtınızı yazın..."
                              />
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setReplyingTo(null)
                                    setReplyText('')
                                  }}
                                  className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                                >
                                  İptal
                                </button>
                                <button
                                  onClick={() => handleAddReply(comment.id)}
                                  disabled={submitting || !replyText.trim()}
                                  className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {submitting ? 'Gönderiliyor...' : 'Yanıtla'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Yanıtlar */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 ml-4 border-l-2 border-gray-800 pl-4 space-y-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="bg-[#1a1a1a] rounded-lg p-3">
                                <div className="flex items-start space-x-2">
                                  {getUserAvatar(reply.author)}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1.5">
                                      <span className="font-medium text-white text-xs">
                                        {reply.author.name || 'Anonim'}
                                      </span>
                                      <span className="text-gray-500 text-xs flex items-center">
                                        <Clock className="h-2.5 w-2.5 mr-1" />
                                        {formatTimeAgo(reply.createdAt.toString())}
                                      </span>
                                    </div>
                                    <p className="text-gray-300 text-xs whitespace-pre-wrap mb-2">
                                      {reply.content}
                                    </p>
                                    <div className="flex items-center space-x-3">
                                      {session?.user ? (
                                        <button
                                          onClick={() => handleCommentLike(reply.id)}
                                          className={`flex items-center space-x-1 px-2 py-0.5 rounded transition-colors text-xs ${likedComments.has(reply.id)
                                              ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                              : 'bg-black hover:bg-gray-900 text-gray-400'
                                            }`}
                                        >
                                          <ThumbsUp className="h-2.5 w-2.5" />
                                          <span>{reply.likeCount}</span>
                                        </button>
                                      ) : (
                                        <div className="flex items-center text-gray-400 text-xs">
                                          <ThumbsUp className="h-2.5 w-2.5 mr-1" />
                                          {reply.likeCount}
                                        </div>
                                      )}
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

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-t border-gray-800">
        <div className="flex justify-around items-center py-2">
          <Link href="/home" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Ana Sayfa</span>
          </Link>
          <Link href="/my-courses" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <BookOpen className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Kurslarım</span>
          </Link>
          <Link href="/chef-sosyal" className="flex flex-col items-center py-2 px-3 text-orange-500">
            <Users className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Sosyal</span>
          </Link>
          <Link href="/contact" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Mesajlar</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
