'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, User, Loader2 } from 'lucide-react'

interface FollowUser {
    id: string
    name: string | null
    image: string | null
    bio: string | null
}

interface FollowListModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    type: 'followers' | 'following'
    title: string
}

export default function FollowListModal({ isOpen, onClose, userId, type, title }: FollowListModalProps) {
    const [users, setUsers] = useState<FollowUser[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen) {
            loadUsers()
        }
    }, [isOpen, userId, type])

    const loadUsers = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/forum/followers/${userId}?type=${type}`)
            if (response.ok) {
                const data = await response.json()
                setUsers(data.users)
            }
        } catch (error) {
            console.error('Error loading follow list:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative z-10 w-full max-w-md bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Users List */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {type === 'followers' ? 'Henüz takipçi yok' : 'Henüz kimse takip edilmiyor'}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-800/50">
                            {users.map((user) => (
                                <Link
                                    key={user.id}
                                    href={`/chef-sosyal/profil/${user.id}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                                >
                                    {user.image ? (
                                        <img
                                            src={user.image}
                                            alt={user.name || ''}
                                            className="w-11 h-11 rounded-full object-cover border border-gray-700"
                                        />
                                    ) : (
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center flex-shrink-0">
                                            <User className="h-5 w-5 text-white" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">
                                            {user.name || 'Anonim'}
                                        </p>
                                        {user.bio && (
                                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                                {user.bio}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
