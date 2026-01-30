'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThumbsUp, MessageCircle, MoreHorizontal, User, Play, Clock, Bookmark, ChefHat } from 'lucide-react'
import HashtagText from './HashtagText'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import { getOptimizedMediaUrl } from '@/lib/utils'

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
        poll?: {
            id: string
            question: string
            startDate: string | Date
            endDate: string | Date
            options: {
                id: string
                text: string
                votes?: { id: string, userId: string }[]
                _count?: { votes: number }
            }[]
            votes: { userId: string }[]
            _count?: { votes: number }
        } | null
    }
    isLiked?: boolean
    onLike?: (id: string) => void
    isSaved?: boolean
    onSave?: (id: string) => void
    currentUserId?: string
}

export default function TopicCard({ topic, isLiked, onLike, isSaved, onSave, currentUserId }: TopicCardProps) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false)
    const [votingLoading, setVotingLoading] = useState<string | null>(null)
    const [internalPollData, setInternalPollData] = useState(topic.poll)
    const [alertState, setAlertState] = useState<{ isOpen: boolean, message: string }>({ isOpen: false, message: '' })

    // Check if current user has voted (client-side approximation if we don't have user ID handy easily, 
    // but the API response includes votes by user. Ideally we need current User ID.
    // However, the `votes` array in `poll` usually contains ALL votes or user's vote depending on the query.
    // In our API `votes` in `poll` includes ALL votes.
    // Wait, `votes: { userId: string }[]` allows checking if *some* user voted. 
    // We need the logged-in user's ID to know if THEY voted.
    // For now, let's assume if the API returns a vote matching the session, we show results.
    // Actually, `src/app/api/forum/topics/route.ts` included `votes: true`.
    // In `TopicCard` usage, we might not have the session user ID readily available in props unless passed.
    // But we can check if we successfully voted to toggle state locally.


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

    const handleImageClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsLightboxOpen(true)
    }

    return (
        <>
            <div className="block">
                <div className="flex bg-black border border-gray-800 rounded-md hover:border-gray-700 transition-colors overflow-hidden mb-3">

                    {/* Content Area */}
                    <div className="flex-1 p-3 pb-1">
                        {/* Header */}
                        <div className="flex items-center text-xs text-gray-500 mb-2 space-x-2">
                            {internalPollData ? (
                                <>
                                    <div className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center">
                                        <ChefHat className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="font-bold text-white">
                                        Culinora Anket
                                    </span>
                                </>
                            ) : (
                                <>
                                    {topic.author.image ? (
                                        <img src={getOptimizedMediaUrl(topic.author.image, 'IMAGE')} alt={topic.author.name || ''} className="w-5 h-5 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center">
                                            <User className="w-3 h-3 text-gray-400" />
                                        </div>
                                    )}
                                    <span className="font-bold text-[#e7e9ea] hover:underline transition-all cursor-pointer">
                                        u/{topic.author.name || 'anonim'}
                                    </span>
                                </>
                            )}
                            <span className="text-[#71767b]">•</span>
                            <span className="text-[#71767b]">{formatTimeAgo(topic.createdAt.toString())}</span>
                        </div>

                        {/* Content Preview - Clickable to Detail */}
                        {!internalPollData && (
                            <Link href={`/chef-sosyal/topic/${topic.id}`}>
                                <div className="text-[15px] text-[#e7e9ea] line-clamp-6 mb-3 font-normal cursor-pointer transition-colors leading-relaxed">
                                    <HashtagText text={topic.content.substring(0, 500)} />
                                </div>
                            </Link>
                        )}

                        {/* Media Preview - Full Width */}
                        {topic.mediaUrl && (
                            <div
                                onClick={handleImageClick}
                                className="mb-3 rounded-lg overflow-hidden bg-gray-900 border border-gray-800 max-h-[500px] flex justify-center items-center relative group cursor-pointer"
                            >
                                {topic.mediaType === 'VIDEO' ? (
                                    <div className="relative w-full aspect-video">
                                        <video
                                            src={getOptimizedMediaUrl(topic.mediaUrl, 'VIDEO')}
                                            className="w-full h-full object-contain bg-black"
                                            controls
                                            controlsList="nodownload"
                                            onContextMenu={(e) => e.preventDefault()}
                                            onClick={(e) => e.stopPropagation()} // Video controls should work
                                        />
                                    </div>
                                ) : (
                                    <img
                                        src={getOptimizedMediaUrl(topic.mediaUrl, 'IMAGE')}
                                        alt={topic.title}
                                        className="object-contain max-h-[500px] w-full bg-black"
                                    />
                                )}
                            </div>
                        )}

                        {/* Poll Display */}
                        {internalPollData && (
                            <div className="mb-3 p-4 bg-black border border-gray-800 rounded-xl">
                                <h3 className="text-white font-medium mb-3">{internalPollData.question}</h3>
                                <div className="space-y-2">
                                    {internalPollData.options.map((option) => {
                                        const totalVotes = internalPollData._count?.votes ?? (internalPollData.votes?.length || 0)
                                        const optionVotes = option._count?.votes ?? (option.votes?.length || 0)
                                        const percent = totalVotes > 0 ? Math.round(optionVotes / totalVotes * 100) : 0
                                        const isExpired = new Date() > new Date(internalPollData.endDate)
                                        const userVotedThisOption = option.votes?.some((v: any) => v.userId === currentUserId)

                                        return (
                                            <div key={option.id} className="relative">
                                                {/* Background Bar */}
                                                <div className="absolute inset-0 bg-gray-800 rounded-lg overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${userVotedThisOption ? 'bg-orange-600' : 'bg-gray-700'}`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>

                                                <button
                                                    onClick={async () => {
                                                        if (isExpired || votingLoading) return;
                                                        setVotingLoading(option.id)

                                                        // Optimistic Update
                                                        const previousPollData = { ...internalPollData }

                                                        // Find previous vote
                                                        let previousOptionId: string | undefined
                                                        internalPollData.options.forEach(opt => {
                                                            if (opt.votes?.some((v: any) => v.userId === currentUserId)) {
                                                                previousOptionId = opt.id
                                                            }
                                                        })

                                                        // Update state
                                                        setInternalPollData(prev => {
                                                            if (!prev) return null
                                                            const newOptions = prev.options.map(opt => {
                                                                let newVotes = opt.votes ? [...opt.votes] : []
                                                                let newCount = opt._count?.votes || 0

                                                                // Remove previous vote if exists
                                                                if (opt.id === previousOptionId) {
                                                                    newVotes = newVotes.filter((v: any) => v.userId !== currentUserId)
                                                                    newCount = Math.max(0, newCount - 1)
                                                                }

                                                                // Add new vote
                                                                if (opt.id === option.id) {
                                                                    newVotes.push({ id: 'temp', userId: currentUserId || 'temp' })
                                                                    newCount++
                                                                }

                                                                return {
                                                                    ...opt,
                                                                    votes: newVotes,
                                                                    _count: { votes: newCount }
                                                                }
                                                            })

                                                            // Update total count
                                                            let newTotalCount = prev._count?.votes || 0
                                                            if (!previousOptionId) {
                                                                newTotalCount++
                                                            }

                                                            return {
                                                                ...prev,
                                                                options: newOptions,
                                                                _count: { votes: newTotalCount }
                                                            }
                                                        })

                                                        try {
                                                            const res = await fetch('/api/forum/polls/vote', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ pollId: internalPollData.id, optionId: option.id })
                                                            })

                                                            if (!res.ok) {
                                                                // Revert on failure
                                                                setInternalPollData(previousPollData)
                                                                const err = await res.json()
                                                                setAlertState({ isOpen: true, message: err.error || 'Hata oluştu' })
                                                            }
                                                        } catch (e) {
                                                            console.error(e)
                                                            setInternalPollData(previousPollData)
                                                        } finally {
                                                            setVotingLoading(null)
                                                        }
                                                    }}
                                                    disabled={!!votingLoading || isExpired}
                                                    className="relative w-full text-left px-4 py-3 flex justify-between items-center z-10 hover:bg-white/5 transition-colors rounded-lg"
                                                >
                                                    <span className={`text-sm font-medium ${userVotedThisOption ? 'text-white' : 'text-gray-200'}`}>
                                                        {option.text}
                                                    </span>
                                                    <span className={`text-xs font-mono ${userVotedThisOption ? 'text-white/90' : 'text-[#71767b]'}`}>
                                                        {percent}% ({optionVotes})
                                                    </span>
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-[#71767b]">
                                    <span>Toplam Oy: {internalPollData._count?.votes ?? (internalPollData.votes?.length || 0)}</span>
                                    <span>
                                        {new Date() > new Date(internalPollData.endDate) ? 'Anket Sona Erdi' : `Bitiş: ${new Date(internalPollData.endDate).toLocaleDateString()}`}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Action Bar */}
                        {!internalPollData && (
                            <div className="flex items-center space-x-3 text-[#71767b] text-xs font-bold pt-1 pb-1">
                                {/* Vote Button */}
                                <button
                                    onClick={handleLike}
                                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-full transition-all duration-200 ${isLiked
                                        ? 'bg-orange-500/10 text-orange-500'
                                        : 'hover:bg-white/5 text-[#71767b] hover:text-[#e7e9ea]'
                                        }`}
                                >
                                    <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                                    <span className="text-sm">{topic.likeCount}</span>
                                </button>

                                <Link href={`/chef-sosyal/topic/${topic.id}`} className="flex items-center space-x-1.5 px-3 py-2 hover:bg-white/5 rounded-full transition-colors group cursor-pointer text-[#71767b] hover:text-[#e7e9ea]">
                                    <MessageCircle className="h-4 w-4" />
                                    <span className="text-sm">{topic._count.posts}</span>
                                    <span className="hidden sm:inline">Yorum</span>
                                </Link>

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
                        )}

                    </div>
                </div>
            </div >

            {/* Lightbox Overlay */}
            {
                isLightboxOpen && topic.mediaUrl && topic.mediaType !== 'VIDEO' && (
                    <div
                        className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <div className="relative max-w-7xl max-h-screen w-full h-full flex items-center justify-center">
                            <img
                                src={topic.mediaUrl}
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
                )
            }

            <ConfirmationModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState({ isOpen: false, message: '' })}
                onConfirm={() => setAlertState({ isOpen: false, message: '' })}
                title="Hata"
                message={alertState.message}
                confirmText="Tamam"
                showCancelButton={false}
                isDanger={true}
            />
        </>
    )
}
