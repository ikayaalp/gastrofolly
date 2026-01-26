'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThumbsUp, MessageCircle, MoreHorizontal, User, Play, Clock, Bookmark } from 'lucide-react'

interface TopicCardProps {
    topic: {
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
    isLiked?: boolean
    onLike?: (id: string) => void
    isSaved?: boolean
    onSave?: (id: string) => void
}

export default function TopicCard({ topic, isLiked, onLike, isSaved, onSave }: TopicCardProps) {
    const [imageError, setImageError] = useState(false)

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return 'Az önce'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dk önce`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} sa önce`
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} gün önce`
        return date.toLocaleDateString('tr-TR')
    }

    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (onLike) onLike(topic.id)
    }

    const handleSave = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (onSave) onSave(topic.id)
    }

    return (
        <Link href={`/chef-sosyal/topic/${topic.id}`} className="block">
            <div className="flex bg-[#0a0a0a] border border-gray-800 rounded-md hover:border-gray-700 transition-colors overflow-hidden cursor-pointer mb-3">

                {/* Content Area */}
                <div className="flex-1 p-3 pb-1">
                    {/* Header */}
                    <div className="flex items-center text-xs text-gray-500 mb-2 space-x-2">
                        {topic.author.image ? (
                            <img src={topic.author.image} alt={topic.author.name || ''} className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                            <div className="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-gray-400" />
                            </div>
                        )}
                        <span className="font-medium text-gray-400 hover:text-white transition-colors">
                            u/{topic.author.name || 'anonim'}
                        </span>
                        <span className="text-gray-600">•</span>
                        <span>{formatTimeAgo(topic.createdAt.toString())}</span>
                        <span className="text-gray-600">•</span>
                        <span
                            className="font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${topic.category.color}20`, color: topic.category.color || 'gray' }}
                        >
                            {topic.category.name}
                        </span>
                    </div>

                    {/* Content Preview */}
                    <div
                        className="text-sm text-gray-400 line-clamp-3 mb-3 font-normal"
                        dangerouslySetInnerHTML={{ __html: topic.content.substring(0, 300) }}
                    />

                    {/* Media Preview - Full Width */}
                    {topic.mediaUrl && (
                        <div className="mb-3 rounded-lg overflow-hidden bg-gray-900 border border-gray-800 max-h-[500px] flex justify-center items-center relative group">
                            {topic.mediaType === 'VIDEO' ? (
                                <div className="relative w-full aspect-video">
                                    <img
                                        src={topic.thumbnailUrl || topic.mediaUrl.replace(/\.[^.]+$/, '.jpg')}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        alt="Video preview"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/video-placeholder.png'; // Fallback
                                            setImageError(true);
                                        }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm group-hover:bg-orange-600/80 transition-colors">
                                            <Play className="h-8 w-8 text-white fill-white" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white font-medium flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Video
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={topic.mediaUrl}
                                    alt={topic.title}
                                    className="object-contain max-h-[500px] w-full bg-black"
                                />
                            )}
                        </div>
                    )}



                    {/* Action Bar */}
                    <div className="flex items-center space-x-3 text-gray-500 text-xs font-bold pt-1">
                        {/* Vote Button */}
                        <button
                            onClick={handleLike}
                            className={`flex items-center space-x-1.5 px-3 py-2 rounded-full transition-all duration-200 ${isLiked
                                ? 'bg-orange-500/10 text-orange-500'
                                : 'hover:bg-gray-800 text-gray-400 hover:text-orange-500'
                                }`}
                        >
                            <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm">{topic.likeCount}</span>
                        </button>

                        <div className="flex items-center space-x-1.5 px-3 py-2 hover:bg-gray-800 rounded-full transition-colors group cursor-pointer text-gray-400 hover:text-white">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm">{topic._count.posts}</span>
                            <span className="hidden sm:inline">Yorum</span>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            className={`flex items-center space-x-1.5 px-3 py-2 rounded-full transition-all duration-200 ${isSaved
                                ? 'bg-orange-500/10 text-orange-500'
                                : 'hover:bg-gray-800 text-gray-400 hover:text-orange-500'
                                }`}
                        >
                            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                            <span className="hidden sm:inline">{isSaved ? 'Kaydedildi' : 'Kaydet'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    )
}
