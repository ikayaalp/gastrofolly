'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ChefHat, Search, Bell, Plus, MessageCircle, ThumbsUp, Clock, User, Home, BookOpen, Users, Image as ImageIcon, Play, Menu, X, Filter, Type, ArrowDown, Camera, Film, Bookmark } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import NotificationDropdown from "@/components/ui/NotificationDropdown"
import MediaUploader from "@/components/forum/MediaUploader"
import LeftSidebar from "@/components/forum/LeftSidebar"
import RightSidebar from "@/components/forum/RightSidebar"
import TopicCard from "@/components/forum/TopicCard"

interface Category {
  id: string
  name: string
  description: string | null
  slug: string
  color: string | null
  _count: {
    topics: number
  }
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
  author: {
    id: string
    name: string | null
    image: string | null
  }
  category: {
    id: string
    name: string
    slug: string
    color: string | null
  }
  _count: {
    posts: number
  }
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

interface ChefSosyalClientProps {
  session: Session | null
  initialCategories: Category[]
  initialTopics: Topic[]
  memberCount: number
}

export default function ChefSosyalClient({
  session,
  initialCategories,
  initialTopics,
  memberCount
}: ChefSosyalClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // URL'den başlangıç değerlerini al
  const initialCategoryParam = searchParams.get('category') || 'all'
  const initialSortParam = searchParams.get('sort') || 'newest'
  const initialSearchParam = searchParams.get('search') || ''

  const [categories, setCategories] = useState(initialCategories)
  const [topics, setTopics] = useState(initialTopics)
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryParam)
  const [sortBy, setSortBy] = useState(initialSortParam)
  const [searchTerm, setSearchTerm] = useState(initialSearchParam)
  const [loading, setLoading] = useState(false)
  const [showNewTopicModal, setShowNewTopicModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'post' | 'image'>('post') // Modal tab state

  const [newTopicForm, setNewTopicForm] = useState({
    title: '',
    content: '',
    categoryId: initialCategories.length > 0 ? initialCategories[0].id : ''
  })

  const [topicMedia, setTopicMedia] = useState<{
    mediaUrl: string
    mediaType: 'IMAGE' | 'VIDEO'
    thumbnailUrl?: string
  } | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [likedTopics, setLikedTopics] = useState<Set<string>>(new Set())
  const [savedTopics, setSavedTopics] = useState<Set<string>>(new Set())

  // Props değiştiğinde (URL değişimi sonrası yeni veri geldiğinde) state'i güncelle
  useEffect(() => {
    setTopics(initialTopics)
  }, [initialTopics])

  // URL parametreleri değiştiğinde state'i güncelle
  useEffect(() => {
    const category = searchParams.get('category') || 'all'
    const sort = searchParams.get('sort') || 'newest'
    const search = searchParams.get('search') || ''
    setSelectedCategory(category)
    setSortBy(sort)
    setSearchTerm(search)
  }, [searchParams])

  // Arama İşlemi
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const params = new URLSearchParams(searchParams.toString())
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
      } else {
        params.delete('search')
      }
      router.push(`/chef-sosyal?${params.toString()}`)
    }
  }

  // Modal açıldığında kategorileri yükle
  useEffect(() => {
    if (showNewTopicModal && categories.length === 0) {
      loadCategories()
    }
    // Set default category if not set
    if (categories.length > 0 && !newTopicForm.categoryId) {
      setNewTopicForm(prev => ({ ...prev, categoryId: categories[0].id }))
    }
  }, [showNewTopicModal, categories.length])

  // Sayfa yüklendiğinde kullanıcının beğendiği başlıkları yükle
  useEffect(() => {
    if (session?.user?.id) {
      loadLikedTopics()
    }
  }, [session?.user?.id])

  // Kullanıcının beğendiği başlıkları yükle
  const loadLikedTopics = async () => {
    try {
      const response = await fetch('/api/forum/liked-topics')
      if (response.ok) {
        const data = await response.json()
        setLikedTopics(new Set(data.likedTopicIds))
      }
    } catch (error) {
      console.error('Error loading liked topics:', error)
    }
  }

  // Load saved topics from localStorage
  useEffect(() => {
    const storedSaved = localStorage.getItem('chef-saved-topics')
    if (storedSaved) {
      try {
        const savedIds = JSON.parse(storedSaved)
        setSavedTopics(new Set(savedIds))
      } catch (e) {
        console.error('Error parsing saved topics:', e)
      }
    }
  }, [])

  // Kategorileri yeniden yükle
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/forum/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // Like/Unlike işlemi
  const handleLike = async (topicId: string) => {
    if (!session?.user?.id) {
      return
    }

    try {
      const response = await fetch('/api/forum/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topicId }),
      })

      if (response.ok) {
        const data = await response.json()

        setTopics(prevTopics =>
          prevTopics.map(topic =>
            topic.id === topicId
              ? { ...topic, likeCount: data.liked ? topic.likeCount + 1 : topic.likeCount - 1 }
              : topic
          )
        )

        setLikedTopics(prev => {
          const newSet = new Set(prev)
          if (data.liked) {
            newSet.add(topicId)
          } else {
            newSet.delete(topicId)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('Error liking topic:', error)
    }
  }

  // Save/Unsave topic
  const handleSave = (topicId: string) => {
    setSavedTopics(prev => {
      const newSet = new Set(prev)
      if (newSet.has(topicId)) {
        newSet.delete(topicId)
      } else {
        newSet.add(topicId)
      }
      // Persist to localStorage
      localStorage.setItem('chef-saved-topics', JSON.stringify([...newSet]))
      return newSet
    })
  }

  // Client side fetching logic (for actions that don't change URL like refresh button, though mostly we use URL now)
  const loadTopics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(searchParams.toString())
      const response = await fetch(`/api/forum/topics?${params.toString()}`)
      const data = await response.json()
      setTopics(data.topics)
    } catch (error) {
      console.error('Error loading topics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sıralama değiştiğinde
  const handleSortChange = (sort: string) => {
    // 'saved' is client-side only filter, don't update URL
    if (sort === 'saved') {
      setSortBy('saved')
      return
    }
    setSortBy(sort)
    // URL güncelle ve SSR tetikle
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sort)
    router.push(`/chef-sosyal?${params.toString()}`)
    router.refresh()
  }

  // Yeni başlık oluştur
  // Handle media selection from hidden inputs
  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'IMAGE' | 'VIDEO') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Simple validation
    if (file.size > (type === 'VIDEO' ? 100 * 1024 * 1024 : 10 * 1024 * 1024)) {
      alert('Dosya boyutu çok yüksek.')
      return
    }

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('file', file)

      // Upload directly
      // In a real app we might want to show loading state specifically for media
      // For now let's just use a simple approach to get the URL

      // Temporary optimistic preview
      const objectUrl = URL.createObjectURL(file)
      setTopicMedia({
        mediaUrl: objectUrl,
        mediaType: type
      })

      // Real upload
      const response = await fetch('/api/forum/upload-media', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      // Update with real data
      setTopicMedia({
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType as 'IMAGE' | 'VIDEO'
      })

    } catch (error) {
      console.error('Upload error:', error)
      alert('Medya yüklenirken hata oluştu.')
      setTopicMedia(null)
    }
  }

  const handleCreateTopic = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newTopicForm,
          mediaUrl: topicMedia?.mediaUrl || null,
          mediaType: topicMedia?.mediaType || null,
          thumbnailUrl: topicMedia?.thumbnailUrl || null
        })
      })

      if (response.ok) {
        setShowNewTopicModal(false)
        setNewTopicForm({ title: '', content: '', categoryId: categories.length > 0 ? categories[0].id : '' })
        setTopicMedia(null)
        setActiveTab('post')
        // Sayfayı yenile veya yeniden fetch et
        router.refresh()
      } else {
        const error = await response.json()
        console.error('Topic creation failed:', error)
        alert('Hata: ' + (error.error || 'Bilinmeyen hata'))
      }
    } catch (error) {
      console.error('Error creating topic:', error)
      alert('Başlık oluşturulurken hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-gray-800 h-16">
        <div className="flex items-center justify-between px-4 h-full max-w-[1600px] mx-auto">
          {/* Sol: Logo */}
          <div className="flex items-center space-x-12">
            <Link href="/home" className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-500" />
              <span className="text-xl font-bold hidden sm:block">Chef2.0</span>
            </Link>
          </div>

          {/* Orta: Arama Çubuğu (Reddit Style) */}
          <div className="hidden md:flex flex-1 max-w-xl px-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
                className="block w-full pl-10 pr-3 py-2 border border-gray-800 rounded-full leading-5 bg-[#1a1a1a] text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-black focus:border-orange-500 sm:text-sm transition-colors"
                placeholder="Chef Sosyal'de ara..."
              />
            </div>
          </div>

          {/* Sağ: İkonlar ve Profil */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {session?.user ? (
              <>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Bell className="h-6 w-6" />
                </button>
                <UserDropdown />
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/signin" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                  Giriş
                </Link>
                <Link href="/auth/signup" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                  Kaydol
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="max-w-[1600px] mx-auto pt-20 flex justify-center">

        <LeftSidebar categories={categories} selectedCategory={selectedCategory} />

        {/* Main Feed */}
        <div className="w-full max-w-[640px] px-0 sm:px-4 pb-20">

          {/* Create Post Input Trigger */}
          {session?.user && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-md p-3 mb-4 flex items-center space-x-3">
              {session.user.image ? (
                <img src={session.user.image} alt={session.user.name || ''} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-orange-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
              <input
                type="text"
                placeholder="Bir şeyler paylaş..."
                className="flex-1 bg-[#1a1a1a] border border-gray-700 hover:border-white hover:bg-[#0a0a0a] rounded py-2 px-4 text-sm text-white placeholder-gray-500 transition-colors cursor-text focus:outline-none"
                onClick={() => setShowNewTopicModal(true)}
              />
              <button onClick={() => { setActiveTab('image'); setShowNewTopicModal(true); }} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors">
                <ImageIcon className="h-6 w-6" />
              </button>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center space-x-4 mb-4 px-2 sm:px-0">
            <button
              onClick={() => handleSortChange('newest')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full font-bold text-sm transition-colors ${sortBy === 'newest' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <Clock className="h-4 w-4" />
              <span>Yeni</span>
            </button>
            <button
              onClick={() => handleSortChange('popular')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full font-bold text-sm transition-colors ${sortBy === 'popular' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <span>Popüler</span>
            </button>
            <button
              onClick={() => handleSortChange('saved')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full font-bold text-sm transition-colors ${sortBy === 'saved' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <Bookmark className="h-4 w-4" />
              <span>Kaydedilenler</span>
            </button>
          </div>

          {/* Posts Feed */}
          <div className="">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              sortBy === 'saved' ? (
                topics.filter(t => savedTopics.has(t.id)).map(topic => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    isLiked={likedTopics.has(topic.id)}
                    onLike={handleLike}
                    isSaved={savedTopics.has(topic.id)}
                    onSave={handleSave}
                  />
                ))
              ) : (
                topics.map(topic => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    isLiked={likedTopics.has(topic.id)}
                    onLike={handleLike}
                    isSaved={savedTopics.has(topic.id)}
                    onSave={handleSave}
                  />
                ))
              )
            )}

            {!loading && sortBy === 'saved' && topics.filter(t => savedTopics.has(t.id)).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Henüz kaydedilen paylasım yok.
              </div>
            )}

            {!loading && sortBy !== 'saved' && topics.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? 'Aradığınız kriterlere uygun sonuç bulunamadı.' : 'Henüz hiç içerik yok. İlk paylasımı sen yap!'}
              </div>
            )}
          </div>
        </div>

        <RightSidebar memberCount={memberCount} />

      </div>

      {/* New Topic Modal (Twitter-style modern & simple) */}
      {showNewTopicModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowNewTopicModal(false)}></div>
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl bg-[#000] sm:border sm:border-gray-800 flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-900">
              <button onClick={() => setShowNewTopicModal(false)} className="p-2 -ml-2 text-white hover:bg-gray-900 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>

              <button
                onClick={handleCreateTopic}
                disabled={submitting || (!newTopicForm.title.trim() && !newTopicForm.content.trim() && !topicMedia)}
                className={`px-5 py-1.5 rounded-full font-bold text-sm transition-all ${submitting || (!newTopicForm.title.trim() && !newTopicForm.content.trim() && !topicMedia)
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-[#ea580c] text-white hover:bg-[#c2410c]'
                  }`}
              >
                {submitting ? 'Paylaşılıyor...' : 'Paylaş'}
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
              {/* User Info Row */}
              <div className="flex items-center space-x-3 mb-6">
                {session?.user?.image ? (
                  <img src={session.user.image} alt={session.user.name || 'User'} className="w-10 h-10 rounded-full object-cover border border-gray-800" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">{session?.user?.name || 'Kullanıcı'}</span>
                  <div className="px-2 py-0.5 rounded-full border border-gray-800 bg-gray-900 w-fit mt-1">
                    <span className="text-[10px] font-bold text-gray-400 flex items-center">
                      Genel <ArrowDown className="h-3 w-3 ml-1" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Title Input */}
              <input
                type="text"
                value={newTopicForm.title}
                onChange={(e) => setNewTopicForm({ ...newTopicForm, title: e.target.value })}
                placeholder="Başlık"
                className="w-full bg-transparent border-none p-0 text-xl font-bold text-white placeholder-gray-500 focus:ring-0 mb-3"
              />

              {/* Content Input (Auto-growing textarea ideally, but standardfghgfgow) */}
              <textarea
                value={newTopicForm.content}
                onChange={(e) => setNewTopicForm({ ...newTopicForm, content: e.target.value })}
                placeholder="Neler oluyor? Bir şeyler paylaş..."
                className="w-full bg-transparent border-none p-0 text-base text-gray-300 placeholder-gray-600 focus:ring-0 min-h-[120px] resize-none"
              />

              {/* Media Preview */}
              {topicMedia && (
                <div className="relative mt-4 rounded-xl overflow-hidden bg-gray-900 border border-gray-800 group">
                  <button
                    onClick={() => setTopicMedia(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {topicMedia.mediaType === 'VIDEO' ? (
                    <video
                      src={topicMedia.mediaUrl}
                      className="w-full max-h-[400px] object-contain bg-black"
                      controls
                    />
                  ) : (
                    <img
                      src={topicMedia.mediaUrl}
                      alt="Preview"
                      className="w-full max-h-[400px] object-cover"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Bottom Toolbar */}
            <div className="p-4 border-t border-gray-900 bg-black/50 backdrop-blur-xl">
              <div className="flex items-center space-x-6 text-[#ea580c]">
                <button
                  onClick={() => document.getElementById('media-upload-image')?.click()}
                  className="p-2 -ml-2 hover:bg-[#ea580c]/10 rounded-full transition-colors"
                  title="Resim Ekle"
                >
                  <ImageIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={() => document.getElementById('media-upload-camera')?.click()}
                  className="p-2 hover:bg-[#ea580c]/10 rounded-full transition-colors"
                  title="Fotoğraf Çek"
                >
                  <Camera className="h-6 w-6" />
                </button>
                <button
                  onClick={() => document.getElementById('media-upload-video')?.click()}
                  className="p-2 hover:bg-[#ea580c]/10 rounded-full transition-colors"
                  title="Video Ekle"
                >
                  <Film className="h-6 w-6" />
                </button>
              </div>

              {/* Hidden Inputs for Media */}
              <input
                type="file"
                id="media-upload-image"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleMediaSelect(e, 'IMAGE')}
              />
              <input
                type="file"
                id="media-upload-camera"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => handleMediaSelect(e, 'IMAGE')}
              />
              <input
                type="file"
                id="media-upload-video"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleMediaSelect(e, 'VIDEO')}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800">
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
          <Link href="/chef-sor" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Chef'e Sor</span>
          </Link>
        </div>
      </div>

    </div>
  )
}
