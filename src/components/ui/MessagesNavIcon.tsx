'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { getPusherClient } from '@/lib/pusherClient'

export default function MessagesNavIcon() {
    const { data: session } = useSession()
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (!session?.user) return

        // Fetch initial unread count
        const fetchUnread = async () => {
            try {
                const response = await fetch('/api/dm/conversations')
                if (response.ok) {
                    const data = await response.json()
                    const total = (data.data || []).reduce(
                        (sum: number, conv: { unreadCount: number }) => sum + (conv.unreadCount || 0),
                        0
                    )
                    setUnreadCount(total)
                }
            } catch (error) {
                console.error('Error fetching unread DM count:', error)
            }
        }

        fetchUnread()

        // Subscribe to Pusher for real-time updates
        const pusher = getPusherClient()
        const channel = pusher.subscribe(`private-user-${session.user.id}`)

        channel.bind('inbox-update', () => {
            setUnreadCount((prev) => prev + 1)
        })

        return () => {
            channel.unbind_all()
            pusher.unsubscribe(`private-user-${session.user.id}`)
        }
    }, [session?.user])

    if (!session?.user) return null

    return (
        <Link
            href="/messages"
            className="relative p-2 text-gray-300 hover:text-white transition-colors"
        >
            <MessageCircle className="h-5 w-5" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </Link>
    )
}
