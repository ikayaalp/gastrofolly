'use client'

import Link from "next/link"
import Image from "next/image"
import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft, User, Calendar, Heart, MessageCircle,
    Users, UserPlus, UserCheck, Edit3, ChefHat,
    Home, BookOpen, ThumbsUp, Bookmark, Loader2,
    MapPin
} from "lucide-react"
import TopicCard from "@/components/forum/TopicCard"
import FollowListModal from "@/components/forum/FollowListModal"
import UserDropdown from "@/components/ui/UserDropdown"

interface Profile {
    id: string
    name: string | null
    image: string | null
    coverImage: string | null
    bio: string | null
    role: string
    createdAt: string
    followersCount: number
    followingCount: number
    topicsCount: number
    totalLikes: number
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

interface ChefProfilClientProps {
    profile: Profile
    initialTopics: Topic[]
    isFollowing: boolean
    initialIsBlocked?: boolean
    isOwnProfile: boolean
    currentUserId?: string
}

export default function ChefProfilClient({
    profile,
    initialTopics,
    isFollowing: initialIsFollowing,
    initialIsBlocked = false,
    isOwnProfile,
    currentUserId
}: ChefProfilClientProps) {
    const router = useRouter()
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
    const [isBlocked, setIsBlocked] = useState(initialIsBlocked)
    const [followLoading, setFollowLoading] = useState(false)
    const [blockLoading, setBlockLoading] = useState(false)
    const [messageLoading, setMessageLoading] = useState(false)
    const [followersCount, setFollowersCount] = useState(profile.followersCount)
    const [topics, setTopics] = useState(initialTopics)
    const [likedTopics, setLikedTopics] = useState<Set<string>>(new Set())
    const [savedTopics, setSavedTopics] = useState<Set<string>>(new Set())
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(initialTopics.length >= 20)
    const [loadingMore, setLoadingMore] = useState(false)
    const [showFollowModal, setShowFollowModal] = useState<'followers' | 'following' | null>(null)
    const [bioEditing, setBioEditing] = useState(false)
    const [bioText, setBioText] = useState(profile.bio || '')
    const [bioSaving, setBioSaving] = useState(false)

    // Load liked topics
    useEffect(() => {
        if (currentUserId) {
            loadLikedTopics()
        }
    }, [currentUserId])

    // Fetch saved topics from API
    useEffect(() => {
        if (!currentUserId) return;
        fetch('/api/forum/save')
          .then(res => res.json())
          .then(data => {
            if (data.savedTopicIds) {
              setSavedTopics(new Set(data.savedTopicIds))
            }
          })
          .catch(err => console.error(err))
    }, [currentUserId])

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

    const handleFollow = async () => {
        if (followLoading || !currentUserId) return
        setFollowLoading(true)

        // Optimistic update
        const wasFollowing = isFollowing
        setIsFollowing(!wasFollowing)
        setFollowersCount(prev => wasFollowing ? prev - 1 : prev + 1)

        try {
            const response = await fetch('/api/forum/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: profile.id })
            })

            if (!response.ok) {
                // Revert
                setIsFollowing(wasFollowing)
                setFollowersCount(prev => wasFollowing ? prev + 1 : prev - 1)
            }
        } catch (error) {
            // Revert
            setIsFollowing(wasFollowing)
            setFollowersCount(prev => wasFollowing ? prev + 1 : prev - 1)
        } finally {
            setFollowLoading(false)
        }
    }

    const handleBlock = async () => {
        if (blockLoading || !currentUserId || isOwnProfile) return
        setBlockLoading(true)

        try {
            const response = await fetch('/api/forum/block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blockedId: profile.id })
            })

            if (response.ok) {
                setIsBlocked(!isBlocked)
                // If blocking, unfollow optimistically as well to reflect backend
                if (!isBlocked && isFollowing) {
                    setIsFollowing(false)
                    setFollowersCount(prev => prev - 1)
                }
                router.refresh()
            } else {
                console.error('Block operation failed')
            }
        } catch (error) {
            console.error('Error during block:', error)
        } finally {
            setBlockLoading(false)
        }
    }

    const handleMessageClick = async () => {
        if (messageLoading || !currentUserId) return
        setMessageLoading(true)

        try {
            const response = await fetch('/api/dm/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otherUserId: profile.id })
            })
            
            if (response.ok) {
                const result = await response.json()
                if (result.success && result.data?.conversationId) {
                    router.push(`/messages/${result.data.conversationId}`)
                }
            }
        } catch (error) {
            console.error('Error starting conversation:', error)
        } finally {
            setMessageLoading(false)
        }
    }

    const handleLike = useCallback(async (topicId: string) => {
        if (!currentUserId) return

        try {
            const response = await fetch('/api/forum/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topicId })
            })

            if (response.ok) {
                const data = await response.json()
                setTopics(prev =>
                    prev.map(t =>
                        t.id === topicId
                            ? { ...t, likeCount: data.liked ? t.likeCount + 1 : t.likeCount - 1 }
                            : t
                    )
                )
                setLikedTopics(prev => {
                    const newSet = new Set(prev)
                    if (data.liked) newSet.add(topicId)
                    else newSet.delete(topicId)
                    return newSet
                })
            }
        } catch (error) {
            console.error('Error liking topic:', error)
        }
    }, [currentUserId])

    const handleSaveTopic = async (topicId: string) => {
        if (!currentUserId) return

        try {
            const res = await fetch('/api/forum/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topicId })
            })

            if (res.ok) {
                const data = await res.json()
                setSavedTopics(prev => {
                    const newSet = new Set(prev)
                    if (data.saved) {
                        newSet.add(topicId)
                    } else {
                        newSet.delete(topicId)
                    }
                    return newSet
                })
            }
        } catch (error) {
            console.error('Error toggling save:', error)
        }
    }

    const handleBioSave = async () => {
        setBioSaving(true)
        try {
            const response = await fetch('/api/user/update-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bio: bioText })
            })
            if (response.ok) {
                setBioEditing(false)
            }
        } catch (error) {
            console.error('Error updating bio:', error)
        } finally {
            setBioSaving(false)
        }
    }

    const loadMoreTopics = async () => {
        if (loadingMore || !hasMore) return
        setLoadingMore(true)
        const nextPage = page + 1

        try {
            const response = await fetch(`/api/forum/profile/${profile.id}?page=${nextPage}&limit=10`)
            if (response.ok) {
                const data = await response.json()
                const newTopics = data.topics || []
                setTopics(prev => {
                    const existingIds = new Set(prev.map(t => t.id))
                    const filtered = newTopics.filter((t: any) => !existingIds.has(t.id))
                    return [...prev, ...filtered]
                })
                setPage(nextPage)
                setHasMore(nextPage < (data.pagination?.pages || 1))
            }
        } catch (error) {
            console.error('Error loading more topics:', error)
        } finally {
            setLoadingMore(false)
        }
    }

    // Infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 800 &&
                hasMore && !loadingMore
            ) {
                loadMoreTopics()
            }
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [hasMore, loadingMore, page])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            month: 'long',
            year: 'numeric'
        })
    }



    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-gray-800 h-14">
                <div className="flex items-center justify-between px-4 h-full max-w-[700px] mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-white" />
                        </button>
                        <div>
                            <h1 className="text-base font-bold text-white leading-tight">{profile.name || 'Anonim'}</h1>
                            <p className="text-xs text-gray-500">{profile.topicsCount} gönderi</p>
                        </div>
                    </div>
                    <UserDropdown />
                </div>
            </header>

            {/* Content */}
            <div className="max-w-[700px] mx-auto">
                {/* Cover / Banner */}
                <div className="relative h-40 mt-14 overflow-hidden">
                    {profile.coverImage ? (
                        <Image
                            src={profile.coverImage}
                            alt="Cover"
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="absolute inset-0 bg-[#1a1a1a] flex items-center justify-center">
                            <ChefHat className="h-12 w-12 text-gray-700" />
                        </div>
                    )}
                </div>

                {/* Profile Info Section */}
                <div className="relative px-4 pb-4">
                    {/* Avatar */}
                    <div className="relative pt-4 mb-3 flex flex-row items-center justify-between">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-black overflow-hidden bg-gray-900">
                                {profile.image ? (
                                    <Image
                                        width={96}
                                        height={96}
                                        src={profile.image}
                                        alt={profile.name || 'User'}
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center">
                                        <span className="text-3xl font-bold text-white">
                                            {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pb-2">
                            {isOwnProfile ? (
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 px-5 py-2 rounded-full border border-gray-600 text-sm font-bold text-white hover:bg-white/10 transition-all duration-200"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    Profili Düzenle
                                </Link>
                            ) : currentUserId ? (
                                <>
                                    <button
                                        onClick={handleFollow}
                                        disabled={followLoading || isBlocked}
                                        className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 transform active:scale-95 ${isFollowing
                                            ? 'bg-transparent border border-orange-600 text-orange-500 hover:bg-orange-600/10'
                                            : 'bg-orange-600 hover:bg-orange-700 text-white'
                                            } ${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {followLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : isFollowing ? (
                                            <>
                                                <UserCheck className="h-4 w-4" />
                                                <span>Takip Ediliyor</span>
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="h-4 w-4" />
                                                Takip Et
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleBlock}
                                        disabled={blockLoading}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all duration-300 transform active:scale-95 ${isBlocked
                                            ? 'border-gray-600 text-gray-400 hover:bg-gray-800'
                                            : 'border-red-600 text-red-500 hover:bg-red-600/10'
                                            }`}
                                    >
                                        {blockLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : isBlocked ? (
                                            <span>Engeli Kaldır</span>
                                        ) : (
                                            <span>Engelle</span>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/auth/signin"
                                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-colors"
                                >
                                    <UserPlus className="h-4 w-4" />
                                    Takip Et
                                </Link>
                            )}

                            {!isOwnProfile && currentUserId && (
                                <button
                                    onClick={handleMessageClick}
                                    disabled={messageLoading}
                                    className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-600 text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    {messageLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <MessageCircle className="h-4 w-4" />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Name */}
                    <div className="mb-3">
                        <h2 className="text-xl font-extrabold text-white">
                            {profile.name || 'Anonim'}
                        </h2>
                    </div>

                    {/* Bio */}
                    {isOwnProfile && bioEditing ? (
                        <div className="mb-3">
                            <textarea
                                value={bioText}
                                onChange={(e) => setBioText(e.target.value)}
                                maxLength={160}
                                placeholder="Kendinizden bahsedin..."
                                className="w-full bg-transparent border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
                                rows={3}
                                autoFocus
                            />
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-600">{bioText.length}/160</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setBioEditing(false); setBioText(profile.bio || '') }}
                                        className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        onClick={handleBioSave}
                                        disabled={bioSaving}
                                        className="px-4 py-1 bg-orange-600 text-white text-xs font-bold rounded-full hover:bg-orange-700 transition-colors disabled:opacity-50"
                                    >
                                        {bioSaving ? 'Kaydediliyor...' : 'Kaydet'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-3">
                            {profile.bio ? (
                                <p className="text-[15px] text-gray-200 leading-relaxed">
                                    {profile.bio}
                                </p>
                            ) : isOwnProfile ? (
                                <button
                                    onClick={() => setBioEditing(true)}
                                    className="text-sm text-orange-500 hover:text-orange-400 transition-colors"
                                >
                                    + Bio ekle
                                </button>
                            ) : null}
                            {isOwnProfile && profile.bio && (
                                <button
                                    onClick={() => setBioEditing(true)}
                                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors mt-1 block"
                                >
                                    Düzenle
                                </button>
                            )}
                        </div>
                    )}

                    {/* Join Date */}
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(profile.createdAt)} tarihinde katıldı</span>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-5 mb-1">
                        <button
                            onClick={() => setShowFollowModal('following')}
                            className="group flex items-center gap-1"
                        >
                            <span className="text-sm font-bold text-white">{profile.followingCount}</span>
                            <span className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">Takip</span>
                        </button>
                        <button
                            onClick={() => setShowFollowModal('followers')}
                            className="group flex items-center gap-1"
                        >
                            <span className="text-sm font-bold text-white">{followersCount}</span>
                            <span className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">Takipçi</span>
                        </button>
                    </div>
                </div>


                {/* Tab Header */}
                <div className="border-b border-gray-800">
                    <div className="flex">
                        <div className="flex-1 text-center py-3 border-b-2 border-orange-500">
                            <span className="text-sm font-bold text-white">Gönderiler</span>
                        </div>
                    </div>
                </div>

                {/* Topics Feed */}
                <div className="pb-24">
                    {topics.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-900 rounded-full flex items-center justify-center">
                                <MessageCircle className="h-8 w-8 text-gray-700" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Henüz gönderi yok</h3>
                            <p className="text-sm text-gray-500">
                                {isOwnProfile
                                    ? 'İlk gönderinizi paylaşmak için Chef Sosyal\'e gidin!'
                                    : 'Bu kullanıcı henüz bir gönderi paylaşmamış.'}
                            </p>
                            {isOwnProfile && (
                                <Link
                                    href="/chef-sosyal"
                                    className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-orange-600 text-white rounded-full text-sm font-bold hover:bg-orange-700 transition-colors"
                                >
                                    Chef Sosyal'e Git
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            {topics.map(topic => (
                                <TopicCard
                                    key={topic.id}
                                    topic={topic}
                                    isLiked={likedTopics.has(topic.id)}
                                    onLike={handleLike}
                                    isSaved={savedTopics.has(topic.id)}
                                    onSave={handleSaveTopic}
                                    currentUserId={currentUserId}
                                />
                            ))}

                            {loadingMore && (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
                                </div>
                            )}

                            {!hasMore && topics.length > 0 && (
                                <div className="text-center py-8 text-gray-600 text-sm">
                                    Tüm gönderiler gösteriliyor
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

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
                </div>
            </div>

            {/* Follow List Modal */}
            {showFollowModal && (
                <FollowListModal
                    isOpen={true}
                    onClose={() => setShowFollowModal(null)}
                    userId={profile.id}
                    type={showFollowModal}
                    title={showFollowModal === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
                />
            )}
        </div>
    )
}
