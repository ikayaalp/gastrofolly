'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Bell, Check, BookOpen, Megaphone, X } from 'lucide-react'

interface Notification {
    id: string
    type: 'NEW_COURSE' | 'COURSE_UPDATE' | 'SYSTEM'
    title: string
    message: string
    isRead: boolean
    createdAt: string
    courseId?: string
}

export default function NotificationDropdown() {
    const { data: session } = useSession()
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Dışarı tıklandığında kapat
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Bildirimleri yükle
    const loadNotifications = async () => {
        if (!session?.user) return

        setLoading(true)
        try {
            const response = await fetch('/api/notifications')
            if (response.ok) {
                const data = await response.json()
                setNotifications(data.notifications)
                setUnreadCount(data.unreadCount)
            }
        } catch (error) {
            console.error('Error loading notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    // Dropdown açıldığında bildirimleri yükle
    useEffect(() => {
        if (isOpen && session?.user) {
            loadNotifications()
        }
    }, [isOpen, session?.user])

    // Sayfa yüklendiğinde sadece sayıyı al
    useEffect(() => {
        if (session?.user) {
            loadNotifications()
        }
    }, [session?.user])

    // Tüm bildirimleri okundu işaretle
    const markAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications/read-all', { method: 'PUT' })
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
                setUnreadCount(0)
            }
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    // Tek bildirimi okundu işaretle
    const markAsRead = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' })
            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                )
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error('Error marking as read:', error)
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

    // Bildirim ikonunu al
    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'NEW_COURSE':
                return <BookOpen className="h-5 w-5 text-green-400" />
            case 'COURSE_UPDATE':
                return <BookOpen className="h-5 w-5 text-blue-400" />
            case 'SYSTEM':
                return <Megaphone className="h-5 w-5 text-orange-400" />
            default:
                return <Bell className="h-5 w-5 text-gray-400" />
        }
    }

    if (!session?.user) {
        return null
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-300 hover:text-white transition-colors focus:outline-none"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0a0a0a] border border-gray-800 rounded-xl shadow-xl z-50 max-h-[80vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                        <h3 className="text-white font-semibold">Bildirimler</h3>
                        <div className="flex items-center space-x-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                                >
                                    Tümünü okundu işaretle
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Bildirim Listesi */}
                    <div className="overflow-y-auto max-h-96">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8 px-4">
                                <Bell className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">Henüz bildiriminiz yok</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`px-4 py-3 hover:bg-[#1a1a1a] transition-colors cursor-pointer ${!notification.isRead ? 'bg-orange-500/5' : ''
                                            }`}
                                        onClick={() => {
                                            if (!notification.isRead) {
                                                markAsRead(notification.id)
                                            }
                                            if (notification.courseId) {
                                                setIsOpen(false)
                                                window.location.href = `/course/${notification.courseId}`
                                            }
                                        }}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-300' : 'text-white'
                                                        }`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.isRead && (
                                                        <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
