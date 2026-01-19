'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, User, Play, Clock } from 'lucide-react'

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
}

export default function TopicCard({ topic, isLiked, onLike }: TopicCardProps) {
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

    return (
        <Link href={`/chef-sosyal/topic/${topic.id}`} className="block">
            <div className="flex bg-[#0a0a0a] border border-gray-800 rounded-md hover:border-gray-700 transition-colors overflow-hidden cursor-pointer mb-3">

                {/* Left Side: Vote (Desktop) */}
                <div className="hidden sm:flex flex-col items-center p-3 bg-[#0d0d0d] w-12 border-r border-gray-800/50">
                    <button
                        onClick={handleLike}
                        className={`p-1 rounded hover:bg-gray-800 transition-colors ${isLiked ? 'text-orange-500' : 'text-gray-500 hover:text-orange-400'}`}
                    >
                        <ThumbsUp className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                    <span className={`text-xs font-bold my-1 ${isLiked ? 'text-orange-500' : 'text-gray-400'}`}>
                        {topic.likeCount}
                    </span>
                </div>

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

                    {/* Title */}
                    <h3 className="text-lg font-medium text-gray-200 mb-2 leading-snug">
                        {topic.title}
                    </h3>

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

                    {/* Text Content Preview (if no media or short text) */}
                    {!topic.mediaUrl && (
                        <div
                            className="text-sm text-gray-400 line-clamp-3 mb-3 font-normal"
                            dangerouslySetInnerHTML={{ __html: topic.content.substring(0, 300) }}
                        />
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center space-x-1 text-gray-500 text-xs font-bold pt-1">
                        <div className="sm:hidden flex items-center space-x-1 p-2 hover:bg-gray-800 rounded">
                            <ThumbsUp className={`h-4 w-4 ${isLiked ? 'text-orange-500' : ''}`} />
                            <span className={isLiked ? 'text-orange-500' : ''}>{topic.likeCount}</span>
                        </div>

                        <div className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded transition-colors group">
                            <MessageCircle className="h-4 w-4 group-hover:text-gray-300" />
                            <span className="group-hover:text-gray-300">{topic._count.posts} Yorum</span>
                        </div>

                        <div className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded transition-colors group">
                            <Share2 className="h-4 w-4 group-hover:text-gray-300" />
                            <span className="group-hover:text-gray-300">Paylaş</span>
                        </div>

                        <div className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded transition-colors group">
                            <MoreHorizontal className="h-4 w-4 group-hover:text-gray-300" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
