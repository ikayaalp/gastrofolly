'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, Loader2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Image from 'next/image'

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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
        >
            <div className="max-h-[60vh] overflow-y-auto -mx-6 -mb-6 px-6 pb-6 pt-2 scrollbar-thin scrollbar-thumb-zinc-700">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                        {type === 'followers' ? 'Henüz takipçi yok' : 'Henüz kimse takip edilmiyor'}
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800/50">
                        {users.map((user) => (
                            <Link
                                key={user.id}
                                href={`/chef-sosyal/profil/${user.id}`}
                                onClick={onClose}
                                className="flex items-center gap-3 py-3 hover:bg-white/5 transition-colors -mx-4 px-4 rounded-xl"
                            >
                                {user.image ? (
                                    <Image
                                        width={44}
                                        height={44}
                                        src={user.image}
                                        alt={user.name || ''}
                                        className="rounded-full object-cover border border-zinc-700"
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
                                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                                            {user.bio}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    )
}
