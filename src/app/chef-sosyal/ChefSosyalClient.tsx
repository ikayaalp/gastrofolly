'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import { ChefHat, Search, Bell, Plus, MessageCircle, ThumbsUp, Clock, User, Home, BookOpen, Users } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"

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
}

export default function ChefSosyalClient({ 
  session, 
  initialCategories, 
  initialTopics 
}: ChefSosyalClientProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [topics, setTopics] = useState(initialTopics)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(false)
  const [showNewTopicModal, setShowNewTopicModal] = useState(false)
  const [newTopicForm, setNewTopicForm] = useState({
    title: '',
    content: '',
    categoryId: 'default-category' // Varsayılan kategori ID'si
  })
  const [submitting, setSubmitting] = useState(false)

  // Modal açıldığında kategorileri yükle
  useEffect(() => {
    if (showNewTopicModal && categories.length === 0) {
      loadCategories()
    }
  }, [showNewTopicModal, categories.length])

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

  // Başlıkları yeniden yükle
  const loadTopics = async (category = selectedCategory, sort = sortBy) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category,
        sort,
        limit: '10'
      })
      
      const response = await fetch(`/api/forum/topics?${params}`)
      const data = await response.json()
      setTopics(data.topics)
    } catch (error) {
      console.error('Error loading topics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Kategori değiştiğinde başlıkları yeniden yükle
  const handleCategoryChange = (categorySlug: string) => {
    setSelectedCategory(categorySlug)
    loadTopics(categorySlug, sortBy)
  }

  // Sıralama değiştiğinde başlıkları yeniden yükle
  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    loadTopics(selectedCategory, sort)
  }

  // Yeni başlık oluştur
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)


    try {
      const response = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTopicForm)
      })

      if (response.ok) {
        // Başarılı olursa modal'ı kapat ve başlıkları yenile
        setShowNewTopicModal(false)
        setNewTopicForm({ title: '', content: '', categoryId: 'default-category' })
        loadTopics() // Başlıkları yenile
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
  const getUserAvatar = (user: Topic['author']) => {
    if (user.image) {
      return (
        <img
          src={user.image}
          alt={user.name || 'User'}
          className="w-12 h-12 rounded-full object-cover"
        />
      )
    }
    return (
      <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
        <User className="h-6 w-6 text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
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
                <nav className="flex space-x-6">
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
                <nav className="flex space-x-8">
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

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-white">Chef2.0</span>
          </Link>
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-300 hover:text-white transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <UserDropdown />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-16 md:pt-32 pb-12 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Chef Sosyal
            </h1>
            <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
              Gastronomi tutkunlarının buluşma noktası. Tariflerinizi paylaşın, deneyimlerinizi aktarın, sorularınızı sorun!
            </p>
            {session?.user && (
              <button 
                onClick={() => setShowNewTopicModal(true)}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-5 w-5" />
                <span>Yeni Başlık Aç</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar - Kategoriler */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">Kategoriler</h2>
              <div className="space-y-2">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex justify-between items-center ${
                    selectedCategory === 'all'
                      ? 'bg-orange-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span>Tümü</span>
                  <span className="text-sm opacity-70">
                    {categories.reduce((sum, cat) => sum + cat._count.topics, 0)}
                  </span>
                </button>
                {categories.map((category) => (
                  <button
                    key={category.slug}
                    onClick={() => handleCategoryChange(category.slug)}
                    className={`w-full text-left p-3 rounded-lg transition-colors flex justify-between items-center ${
                      selectedCategory === category.slug
                        ? 'bg-orange-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="text-sm opacity-70">{category._count.topics}</span>
                  </button>
                ))}
              </div>

              {/* Popüler Etiketler */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Popüler Etiketler</h3>
                <div className="flex flex-wrap gap-2">
                  {['#makarna', '#et-yemekleri', '#tatlı', '#vegan', '#mutfak-ekipmanları', '#pastane'].map((tag) => (
                    <span key={tag} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-gray-700 cursor-pointer">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Ana İçerik - Tartışmalar */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Son Tartışmalar</h2>
                <p className="text-gray-400 mt-1">Topluluktan en yeni konular</p>
              </div>
              <div className="flex items-center space-x-3">
                <select 
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="newest">En Yeni</option>
                  <option value="popular">En Popüler</option>
                  <option value="mostReplies">En Çok Yanıtlanan</option>
                </select>
              </div>
            </div>

            {/* Tartışma Listesi */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="text-gray-400 mt-2">Yükleniyor...</p>
                </div>
              ) : (
                topics.map((topic) => (
                  <Link key={topic.id} href={`/chef-sosyal/topic/${topic.id}`}>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-start space-x-4">
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
                        <h3 className="text-xl font-semibold text-white mb-2 hover:text-orange-400 transition-colors">
                          {topic.title}
                        </h3>
                        <p className="text-gray-300 mb-4 line-clamp-2">
                          {topic.content}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {topic.author.name || 'Anonim'}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {topic._count.posts} yanıt
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
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Daha Fazla Yükle */}
            {!loading && topics.length > 0 && (
              <div className="text-center mt-8">
                <button 
                  onClick={() => loadTopics()}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Daha Fazla Tartışma Yükle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button - Mobil */}
      {session?.user && (
        <button 
          onClick={() => setShowNewTopicModal(true)}
          className="fixed bottom-6 right-6 bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg transition-colors md:hidden"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Yeni Başlık Modal */}
      {showNewTopicModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Yeni Başlık Aç</h2>
              <button
                onClick={() => setShowNewTopicModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Başlık
                </label>
                <input
                  type="text"
                  id="title"
                  value={newTopicForm.title}
                  onChange={(e) => setNewTopicForm({ ...newTopicForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
                  placeholder="Başlığınızı yazın..."
                  required
                />
              </div>


              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
                  İçerik
                </label>
                <textarea
                  id="content"
                  value={newTopicForm.content}
                  onChange={(e) => setNewTopicForm({ ...newTopicForm, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none resize-none"
                  placeholder="Tartışmanızı detaylandırın..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowNewTopicModal(false)}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{submitting ? 'Oluşturuluyor...' : 'Başlık Aç'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            <span className="text-xs font-medium mt-1">İletişim</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
