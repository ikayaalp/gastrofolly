'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import { ChefHat, ArrowLeft, MessageCircle, ThumbsUp, Clock, User, Search, Bell, Home, BookOpen, Users, Trash2, Share2, MoreHorizontal, Play, Image as ImageIcon } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import { useRouter } from "next/navigation"
import LeftSidebar from "@/components/forum/LeftSidebar"
import RightSidebar from "@/components/forum/RightSidebar"

interface Author {
  id: string
  name: string | null
  image: string | null
}

interface CategoryBasic {
  id: string
  name: string
  slug: string
  color: string | null
}

interface CategoryWithCount extends CategoryBasic {
  description?: string | null
  _count: {
    topics: number
  }
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
  mediaUrl?: string | null
  mediaType?: 'IMAGE' | 'VIDEO' | null
  thumbnailUrl?: string | null
  author: Author
  category: CategoryBasic
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
  categories: CategoryWithCount[]
}

export default function TopicDetailClient({ session, topic, categories }: TopicDetailClientProps) {
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [comments, setComments] = useState(topic.posts)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(topic.likeCount)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [imageError, setImageError] = useState(false)
  const router = useRouter()

  // Initial Check
  useEffect(() => {
    if (session?.user?.id) {
      checkLikeStatus()
      loadLikedPosts()
    }
  }, [session?.user?.id])

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

  const handleLike = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/forum/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic.id }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
        setLikeCount(prev => data.liked ? prev + 1 : prev - 1)
      }
    } catch (error) {
      console.error('Error liking topic:', error)
    }
  }

  const handleCommentLike = async (postId: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/forum/post-like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => prev.map(c => {
          if (c.id === postId) return { ...c, likeCount: data.liked ? c.likeCount + 1 : c.likeCount - 1 }
          if (c.replies) {
            return { ...c, replies: c.replies.map(r => r.id === postId ? { ...r, likeCount: data.liked ? r.likeCount + 1 : r.likeCount - 1 } : r) }
          }
          return c
        }))
        setLikedComments(prev => {
          const newSet = new Set(prev)
          if (data.liked) newSet.add(postId)
          else newSet.delete(postId)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffInSeconds < 60) return 'Az önce'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dk önce`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} sa önce`
    return date.toLocaleDateString('tr-TR')
  }

  const handleDeleteTopic = async () => {
    if (!confirm('Bu tartışmayı silmek istediğinizden emin misiniz?')) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/forum/topics/${topic.id}/delete`, { method: 'DELETE' })
      if (response.ok) {
        router.push('/chef-sosyal')
      } else {
        alert('Hata oluştu')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setDeleting(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !session?.user) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/forum/topics/${topic.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })
      if (response.ok) {
        const newPost = await response.json()
        setComments([...comments, newPost])
        setNewComment('')
      }
    } catch (error) { console.error(error) }
    finally { setSubmitting(false) }
  }

  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim() || !session?.user) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/forum/topics/${topic.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText, parentId })
      })
      if (response.ok) {
        const newReply = await response.json()
        setComments(comments.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), newReply] } : c))
        setReplyText('')
        setReplyingTo(null)
      }
    } catch (error) { console.error(error) }
    finally { setSubmitting(false) }
  }

  const handleDeleteComment = async (postId: string) => {
    if (!confirm('Silmek istediğinizden emin misiniz?')) return
    try {
      const response = await fetch(`/api/forum/posts/${postId}`, { method: 'DELETE' })
      if (response.ok) {
        setComments(prev => prev.filter(c => {
          if (c.id === postId) return false
          if (c.replies) c.replies = c.replies.filter(r => r.id !== postId)
          return true
        }))
      }
    } catch (error) { console.error(error) }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar (Same as ChefSosyalClient) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-gray-800 h-16">
        <div className="flex items-center justify-between px-4 h-full max-w-[1600px] mx-auto">
          <div className="flex items-center space-x-12">
            <Link href="/chef-sosyal" className="flex items-center space-x-2">
              <ArrowLeft className="h-6 w-6 text-gray-400 hover:text-white" />
              <span className="text-xl font-bold hidden sm:block">Geri</span>
            </Link>
          </div>
          <div className="hidden md:flex flex-1 max-w-xl px-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-800 rounded-full bg-[#1a1a1a] text-gray-300 placeholder-gray-500 focus:outline-none focus:border-orange-500 sm:text-sm" placeholder="Chef Sosyal'de ara" />
            </div>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            {session?.user ? <UserDropdown /> : <Link href="/auth/signin" className="bg-orange-600 px-4 py-2 rounded-full text-sm font-bold">Giriş</Link>}
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto pt-20 flex justify-center">
        <LeftSidebar categories={categories} selectedCategory={topic.category.slug} />

        <div className="w-full max-w-[640px] px-0 sm:px-4 pb-20">

          {/* Extended Topic Card (Layout matching TopicCard.tsx but full content) */}
          <div className="flex bg-[#0a0a0a] border border-gray-800 rounded-md overflow-hidden mb-4">
            {/* Desktop Vote (Left) - Removed as per user request to move to footer, but keeping consistency with new TopicCard design which also removed it */}
            {/* Wait, TopicCard removed left sidebar vote. So we don't put it here either. */}

            <div className="flex-1 p-3 pb-1">
              {/* Header */}
              <div className="flex items-center text-xs text-gray-500 mb-2 space-x-2">
                {topic.author.image ? <img src={topic.author.image} className="w-5 h-5 rounded-full object-cover" /> : <div className="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center"><User className="w-3 h-3 text-gray-400" /></div>}
                <span className="font-medium text-gray-400">u/{topic.author.name || 'anonim'}</span>
                <span className="text-gray-600">•</span>
                <span>{formatTimeAgo(topic.createdAt.toString())}</span>
                <span className="text-gray-600">•</span>
                <span className="font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${topic.category.color}20`, color: topic.category.color || 'gray' }}>{topic.category.name}</span>
              </div>



              {/* Text Content */}
              {topic.content && (
                <div className="text-sm text-gray-300 font-normal whitespace-pre-wrap mb-4 leading-relaxed">
                  {topic.content}
                </div>
              )}

              {/* Media */}
              {topic.mediaUrl && (
                <div className="mb-4 rounded-lg overflow-hidden bg-gray-900 border border-gray-800 flex justify-center items-center">
                  {topic.mediaType === 'VIDEO' ? (
                    <div className="relative w-full aspect-video">
                      <video controls poster={topic.thumbnailUrl || undefined} className="w-full h-full object-contain bg-black">
                        <source src={topic.mediaUrl} type="video/mp4" />
                        Tarayıcınız video oynatmayı desteklemiyor.
                      </video>
                    </div>
                  ) : (
                    <img src={topic.mediaUrl} alt={topic.title} className="max-w-full max-h-[700px] object-contain" />
                  )}
                </div>
              )}



              {/* Action Bar */}
              <div className="flex items-center space-x-3 text-gray-500 text-xs font-bold pt-1 border-t border-gray-800/50 mt-2">
                {/* Vote Button */}
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-full transition-all duration-200 ${isLiked ? 'bg-orange-500/10 text-orange-500' : 'hover:bg-gray-800 text-gray-400 hover:text-orange-500'}`}
                >
                  <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm">{likeCount}</span>
                </button>

                <div className="flex items-center space-x-1.5 px-3 py-2 hover:bg-gray-800 rounded-full transition-colors group cursor-pointer text-gray-400 hover:text-white">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">{comments.length} Yorum</span>
                </div>

                <div className="flex items-center space-x-1.5 px-3 py-2 hover:bg-gray-800 rounded-full transition-colors group cursor-pointer text-gray-400 hover:text-white">
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Paylaş</span>
                </div>

                {session?.user && topic.author.id === session.user.id && (
                  <button onClick={handleDeleteTopic} className="flex items-center space-x-1 px-3 py-2 hover:bg-gray-800 rounded-full text-red-500 hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Sil</span>
                  </button>
                )}
              </div>

              {/* Comment Input Area */}
              {session?.user ? (
                <div className="mt-6 mb-8 flex gap-3">
                  <div className="flex-shrink-0">
                    {session.user.image ? (
                      <img src={session.user.image} className="w-8 h-8 rounded-full object-cover" alt={session.user.name || ''} />
                    ) : (
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleAddComment} className="flex-1 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-[#0a0a0a] border border-gray-800 rounded-2xl focus-within:border-gray-700 transition-colors overflow-hidden">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none min-h-[50px] text-sm"
                        placeholder="Düşüncelerini paylaş..."
                        style={{ minHeight: '48px' }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                      />
                      {/* Action Bar inside the input box */}
                      <div className={`px-2 pb-2 flex justify-between items-center ${!newComment.trim() ? 'hidden' : 'flex'} animate-in fade-in slide-in-from-top-1`}>
                        <div className="text-xs text-gray-500 px-2">
                          <span className="text-orange-500">@{session.user.name}</span> olarak
                        </div>
                        <button
                          type="submit"
                          disabled={!newComment.trim() || submitting}
                          className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Yorum Yap
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="mt-6 mb-8 p-4 border border-gray-800 rounded-md bg-[#1a1a1a] flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Yorum yapmak için giriş yapmalısın.</span>
                  <div className="space-x-2">
                    <Link href="/auth/signin" className="px-4 py-1.5 border border-white rounded-full text-white text-xs font-bold hover:bg-white/10">Giriş</Link>
                    <Link href="/auth/signup" className="px-4 py-1.5 bg-orange-600 rounded-full text-white text-xs font-bold hover:bg-orange-700">Kaydol</Link>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-6">
                {comments.map(comment => (
                  <div key={comment.id} className="flex space-x-2">
                    {/* Comment Avatar */}
                    <div className="flex-shrink-0">
                      {comment.author.image ? (
                        <img src={comment.author.image} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center"><User className="h-4 w-4 text-gray-400" /></div>
                      )}
                    </div>

                    <div className="flex-1">
                      {/* Comment Header */}
                      <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1">
                        <span className="font-bold text-gray-300">{comment.author.name}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(comment.createdAt.toString())}</span>
                      </div>

                      {/* Comment Body */}
                      <div className="text-sm text-gray-200 mb-2 whitespace-pre-wrap">{comment.content}</div>

                      {/* Comment Actions */}
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleCommentLike(comment.id)}
                          className={`flex items-center space-x-1 text-xs font-bold ${likedComments.has(comment.id) ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          <ThumbsUp className={`h-3 w-3 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
                          <span>{comment.likeCount || 0}</span>
                        </button>

                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="flex items-center space-x-1 text-xs font-bold text-gray-500 hover:text-gray-300"
                        >
                          <MessageCircle className="h-3 w-3" />
                          <span>Yanıtla</span>
                        </button>

                        {session?.user && comment.author.id === session.user.id && (
                          <button onClick={() => handleDeleteComment(comment.id)} className="text-xs font-bold text-red-500 hover:text-red-400">
                            Sil
                          </button>
                        )}
                      </div>

                      {/* Reply Form */}
                      {replyingTo === comment.id && (
                        <div className="mt-3">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-sm text-white focus:outline-none"
                            placeholder="Yanıtınız..."
                            rows={3}
                          />
                          <div className="flex justify-end mt-2 space-x-2">
                            <button onClick={() => setReplyingTo(null)} className="text-xs font-bold text-gray-400 px-3 py-1.5 hover:bg-gray-800 rounded">İptal</button>
                            <button onClick={() => handleAddReply(comment.id)} className="text-xs font-bold bg-white text-black px-3 py-1.5 rounded hover:bg-gray-200">Yanıtla</button>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="flex space-x-2">
                              <div className="flex-shrink-0">
                                {reply.author.image ? (
                                  <img src={reply.author.image} className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center"><User className="h-3 w-3 text-gray-400" /></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1">
                                  <span className="font-bold text-gray-300">{reply.author.name}</span>
                                  <span>•</span>
                                  <span>{formatTimeAgo(reply.createdAt.toString())}</span>
                                </div>
                                <div className="text-sm text-gray-200 mb-2 whitespace-pre-wrap">{reply.content}</div>
                                <div className="flex items-center space-x-4">
                                  <button
                                    onClick={() => handleCommentLike(reply.id)}
                                    className={`flex items-center space-x-1 text-xs font-bold ${likedComments.has(reply.id) ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
                                  >
                                    <ThumbsUp className={`h-3 w-3 ${likedComments.has(reply.id) ? 'fill-current' : ''}`} />
                                    <span>{reply.likeCount || 0}</span>
                                  </button>
                                  {session?.user && reply.author.id === session.user.id && (
                                    <button onClick={() => handleDeleteComment(reply.id)} className="text-xs font-bold text-red-500 hover:text-red-400">
                                      Sil
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <RightSidebar />
      </div>
    </div>
  )
}
