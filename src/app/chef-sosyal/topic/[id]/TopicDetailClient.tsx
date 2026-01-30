'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import { ChefHat, ArrowLeft, MessageCircle, ThumbsUp, Clock, User, Search, Bell, Home, BookOpen, Users, Trash2, Share2, MoreHorizontal, Play, Image as ImageIcon } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import { useRouter } from "next/navigation"
import LeftSidebar from "@/components/forum/LeftSidebar"
import RightSidebar from "@/components/forum/RightSidebar"
import HashtagText from "@/components/forum/HashtagText"
import ConfirmationModal from "@/components/ui/ConfirmationModal"
import { getOptimizedMediaUrl } from "@/lib/utils"

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
  const [replyingToName, setReplyingToName] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(topic.likeCount)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const router = useRouter()

  // Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'topic' | 'comment';
    id: string | null;
  }>({
    isOpen: false,
    type: 'topic',
    id: null
  });

  // Alert Modal State
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLightboxOpen(true)
  }

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

  const handleDeleteTopicClick = () => {
    setDeleteModal({ isOpen: true, type: 'topic', id: topic.id })
  }

  const handleDeleteCommentClick = (commentId: string) => {
    setDeleteModal({ isOpen: true, type: 'comment', id: commentId })
  }

  const handleConfirmDelete = async () => {
    setDeleteLoading(true)
    try {
      if (deleteModal.type === 'topic') {
        const response = await fetch(`/api/forum/topics/${topic.id}/delete`, { method: 'DELETE' })
        if (response.ok) {
          router.push('/chef-sosyal')
        } else {
          setAlertModal({
            isOpen: true,
            title: 'Hata',
            message: 'Silme işlemi başarısız oldu.',
            type: 'error'
          });
        }
      } else if (deleteModal.type === 'comment' && deleteModal.id) {
        const postId = deleteModal.id
        const response = await fetch(`/api/forum/posts/${postId}`, { method: 'DELETE' })
        if (response.ok) {
          setComments(prev => prev.filter(c => {
            if (c.id === postId) return false
            if (c.replies) c.replies = c.replies.filter(r => r.id !== postId)
            return true
          }))
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setDeleteLoading(false)
      setDeleteModal({ isOpen: false, type: 'topic', id: null })
      setDeleting(false)
    }
  }

  const handleReplyTo = (commentId: string, authorName: string) => {
    setReplyingTo(commentId)
    setReplyingToName(authorName)
    window.scrollTo({ top: document.getElementById('comment-form')?.offsetTop ? document.getElementById('comment-form')!.offsetTop - 100 : 0, behavior: 'smooth' })
  }

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !session?.user || !replyingTo) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/forum/topics/${topic.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment, parentId: replyingTo })
      })
      if (response.ok) {
        const newReply = await response.json()
        setComments(comments.map(c => c.id === replyingTo ? { ...c, replies: [...(c.replies || []), newReply] } : c))
        setNewComment('')
        setReplyingTo(null)
        setReplyingToName(null)
      }
    } catch (error) { console.error(error) }
    finally { setSubmitting(false) }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !session?.user) return
    if (replyingTo) return handleAddReply(e)

    setSubmitting(true)
    try {
      const response = await fetch(`/api/forum/topics/${topic.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })
      if (response.ok) {
        const newPost = await response.json()
        setComments([newPost, ...comments])
        setNewComment('')
      }
    } catch (error) { console.error(error) }
    finally { setSubmitting(false) }
  }



  return (
    <div className="min-h-screen bg-black text-white">
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
          <div className="flex bg-[#0a0a0a] border border-gray-800 rounded-md overflow-hidden mb-4">
            <div className="flex-1 p-3 pb-1">
              <div className="flex items-center text-xs text-gray-500 mb-2 space-x-2">
                {topic.author.image ? <img src={getOptimizedMediaUrl(topic.author.image, 'IMAGE')} className="w-5 h-5 rounded-full object-cover" /> : <div className="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center"><User className="w-3 h-3 text-gray-400" /></div>}
                <span className="font-medium text-gray-400">u/{topic.author.name || 'anonim'}</span>
                <span className="text-gray-600">•</span>
                <span>{formatTimeAgo(topic.createdAt.toString())}</span>
                <span className="text-gray-600">•</span>
                <span className="font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${topic.category.color}20`, color: topic.category.color || 'gray' }}>{topic.category.name}</span>
              </div>

              {topic.content && (
                <div className="text-sm text-white font-normal whitespace-pre-wrap mb-4 leading-relaxed">
                  <HashtagText text={topic.content} />
                </div>
              )}

              {topic.mediaUrl && (
                <div
                  onClick={handleImageClick}
                  className="mb-4 rounded-lg overflow-hidden bg-gray-900 border border-gray-800 flex justify-center items-center cursor-pointer relative group"
                >
                  {topic.mediaType === 'VIDEO' ? (
                    <div className="relative w-full aspect-video">
                      <video
                        controls
                        controlsList="nodownload"
                        onContextMenu={(e) => e.preventDefault()}
                        poster={topic.thumbnailUrl || undefined}
                        className="w-full h-full object-contain bg-black"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <source src={getOptimizedMediaUrl(topic.mediaUrl, 'VIDEO')} type="video/mp4" />
                      </video>
                    </div>
                  ) : (
                    <img src={getOptimizedMediaUrl(topic.mediaUrl, 'IMAGE')} alt={topic.title} className="max-w-full max-h-[700px] object-contain" />
                  )}
                </div>
              )}

              <div className="flex items-center space-x-3 text-gray-500 text-xs font-bold pt-1 border-t border-gray-800/50 mt-2">
                <button onClick={handleLike} className={`flex items-center space-x-1.5 px-3 py-2 rounded-full transition-all duration-200 ${isLiked ? 'bg-orange-500/10 text-orange-500' : 'hover:bg-gray-800 text-gray-400 hover:text-orange-500'}`}>
                  <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm">{likeCount}</span>
                </button>
                <div className="flex items-center space-x-1.5 px-3 py-2 hover:bg-gray-800 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-white">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">{comments.length} Yorum</span>
                </div>
                {session?.user && topic.author.id === session.user.id && (
                  <button onClick={handleDeleteTopicClick} className="flex items-center space-x-1 px-3 py-2 hover:bg-gray-800 rounded-full text-red-500 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Sil</span>
                  </button>
                )}
              </div>

              {session?.user ? (
                <div className="mt-6 mb-8 flex gap-3" id="comment-form">
                  <div className="flex-shrink-0">
                    {session.user.image ? <img src={getOptimizedMediaUrl(session.user.image, 'IMAGE')} className="w-8 h-8 rounded-full object-cover" alt={session.user.name || ''} /> : <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-gray-400" /></div>}
                  </div>
                  <form onSubmit={handleAddComment} className="flex-1 relative group">
                    {replyingTo && (
                      <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-t-xl mb-0 text-xs">
                        <span className="text-orange-400">@{replyingToName} kullanıcısına yanıt veriyorsun</span>
                        <button type="button" onClick={() => { setReplyingTo(null); setReplyingToName(null); }} className="text-gray-500 hover:text-white uppercase font-bold text-[10px]">İptal</button>
                      </div>
                    )}
                    <div className={`relative bg-[#0a0a0a] border border-gray-800 ${replyingTo ? 'rounded-b-2xl' : 'rounded-2xl'} focus-within:border-gray-700 transition-colors overflow-hidden`}>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none min-h-[50px] text-sm"
                        placeholder={replyingTo ? "Yanıtını yaz..." : "Düşüncelerini paylaş..."}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                      />
                      <div className={`px-2 pb-2 flex justify-between items-center ${!newComment.trim() ? 'hidden' : 'flex'}`}>
                        <div className="text-xs text-gray-500 px-2"><span className="text-orange-500">@{session.user.name}</span> olarak</div>
                        <button type="submit" disabled={!newComment.trim() || submitting} className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded-full hover:bg-gray-200 disabled:opacity-50">
                          {replyingTo ? 'Yanıtla' : 'Yorum Yap'}
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
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {comments.map(comment => (
                  <div key={comment.id} className="flex space-x-2">
                    <div className="flex-shrink-0">
                      {comment.author.image ? <img src={getOptimizedMediaUrl(comment.author.image, 'IMAGE')} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center"><User className="h-4 w-4 text-gray-400" /></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1">
                        <span className="font-bold text-gray-200">{comment.author.name}</span><span>•</span><span className="text-gray-500">{formatTimeAgo(comment.createdAt.toString())}</span>
                      </div>
                      <div className="text-sm text-white mb-2 whitespace-pre-wrap">{comment.content}</div>
                      <div className="flex items-center space-x-4">
                        <button onClick={() => handleCommentLike(comment.id)} className={`flex items-center space-x-1 text-xs font-bold ${likedComments.has(comment.id) ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'}`}><ThumbsUp className={`h-3 w-3 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} /><span>{comment.likeCount || 0}</span></button>
                        <button onClick={() => handleReplyTo(comment.id, comment.author.name || 'anonim')} className={`flex items-center space-x-1 text-xs font-bold ${replyingTo === comment.id ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'}`}><MessageCircle className="h-3 w-3" /><span>Yanıtla</span></button>
                        {session?.user && comment.author.id === session.user.id && <button onClick={() => handleDeleteCommentClick(comment.id)} className="text-xs font-bold text-red-500 hover:text-red-400">Sil</button>}
                      </div>
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 space-y-4 border-l border-gray-800/50 ml-2 pl-4">
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="flex space-x-2 relative">
                              <div className="flex-shrink-0">
                                {reply.author.image ? <img src={getOptimizedMediaUrl(reply.author.image, 'IMAGE')} className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center"><User className="h-3 w-3 text-gray-400" /></div>}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1"><span className="font-bold text-gray-200">{reply.author.name}</span><span>•</span><span className="text-gray-500">{formatTimeAgo(reply.createdAt.toString())}</span></div>
                                <div className="text-sm text-white mb-2 whitespace-pre-wrap">{reply.content}</div>
                                <div className="flex items-center space-x-4">
                                  <button onClick={() => handleCommentLike(reply.id)} className={`flex items-center space-x-1 text-xs font-bold ${likedComments.has(reply.id) ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'}`}><ThumbsUp className={`h-3 w-3 ${likedComments.has(reply.id) ? 'fill-current' : ''}`} /><span>{reply.likeCount || 0}</span></button>
                                  <button onClick={() => handleReplyTo(comment.id, reply.author.name || 'anonim')} className="flex items-center space-x-1 text-xs font-bold text-gray-500 hover:text-gray-300"><MessageCircle className="h-3 w-3" /><span>Yanıtla</span></button>
                                  {session?.user && reply.author.id === session.user.id && <button onClick={() => handleDeleteCommentClick(reply.id)} className="text-xs font-bold text-red-500 hover:text-red-400">Sil</button>}
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

      {/* Lightbox Overlay */}
      {isLightboxOpen && topic.mediaUrl && topic.mediaType !== 'VIDEO' && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-7xl max-h-screen w-full h-full flex items-center justify-center">
            <img
              src={getOptimizedMediaUrl(topic.mediaUrl, 'IMAGE')}
              alt={topic.title}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title={deleteModal.type === 'topic' ? "Tartışmayı Sil" : "Yorumu Sil"}
        message={deleteModal.type === 'topic'
          ? "Bu tartışmayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          : "Bu yorumu silmek istediğinizden emin misiniz?"
        }
        confirmText="Evet, Sil"
        isDanger={true}
        isLoading={deleteLoading}
      />

      {/* Alert Modal */}
      <ConfirmationModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="Tamam"
        showCancelButton={false}
        isDanger={alertModal.type === 'error'}
      />
    </div>
  )
}
