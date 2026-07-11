'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface HashtagTextProps {
    text: string
    className?: string
}

// Global cache to prevent multiple duplicate requests
const mentionCache: Record<string, string | null> = {}
const fetchQueue: string[] = []
let fetchTimeout: any = null
const listeners = new Set<() => void>()

function triggerFetchUsernames(usernames: string[]) {
    const toFetch = usernames.filter(u => mentionCache[u] === undefined && !fetchQueue.includes(u))
    if (toFetch.length === 0) return

    fetchQueue.push(...toFetch)

    if (!fetchTimeout) {
        fetchTimeout = setTimeout(async () => {
            const currentQueue = [...fetchQueue]
            fetchQueue.length = 0
            fetchTimeout = null

            try {
                const res = await fetch(`/api/forum/users/check-usernames`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usernames: currentQueue })
                })
                const data = await res.json()
                
                currentQueue.forEach(u => {
                    mentionCache[u] = data.validUsernames?.[u] || null
                })
                
                listeners.forEach(fn => fn())
            } catch (err) {
                console.error('Failed to fetch usernames', err)
                currentQueue.forEach(u => {
                    mentionCache[u] = null
                })
                listeners.forEach(fn => fn())
            }
        }, 50)
    }
}

export default function HashtagText({ text, className = "" }: HashtagTextProps) {
    const [, forceRender] = useState(0)

    useEffect(() => {
        const update = () => forceRender(prev => prev + 1)
        listeners.add(update)
        return () => {
            listeners.delete(update)
        }
    }, [])

    if (!text) return null;

    // Hashtag ve Mentionları bulmak için regex
    // Mentions: M1/M2 uyarınca sadece a-zA-Z0-9_ kullanılıyor
    const parts = text.split(/(#[a-zA-Z0-9çğıöşüÇĞİÖŞÜ]+|@[a-zA-Z0-9_]+)/g);

    // Çıkarılan mentionları bul ve kontrol için kuyruğa at
    const usernames = parts.filter(p => p.startsWith('@')).map(p => p.slice(1))
    if (usernames.length > 0) {
        triggerFetchUsernames(usernames)
    }

    return (
        <div className={className}>
            {parts.map((part, i) => {
                if (part.startsWith('#')) {
                    return (
                        <Link
                            key={i}
                            href={`/chef-sosyal?search=${encodeURIComponent(part)}`}
                            className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </Link>
                    );
                }
                if (part.startsWith('@')) {
                    const username = part.slice(1)
                    const userId = mentionCache[username]
                    
                    if (userId) {
                        return (
                            <Link 
                                key={i} 
                                href={`/chef-sosyal/profil/${userId}`} 
                                className="text-orange-500 font-bold hover:underline cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {part}
                            </Link>
                        );
                    }
                    
                    // Var olmayan kullanıcı ise ya da henüz yükleniyorsa düz metin olarak dön
                    // Eğer undefined ise henüz kontrol edilmemiştir, null ise kesin yoktur.
                    // Yüklenme aşamasında turuncu fontla düz metin de gösterilebilir ama gereksinime göre
                    // "düz metin olarak kalmalı" dendiği için stil olmadan span dönüyoruz.
                    // Fakat ilk başta düz metin görünüp sonradan turuncuya dönmesi rahatsız edici olabilir.
                    // İstenirse yüklenirken de turuncu görünebilir. Biz şimdilik düz metin (veya varolan stilli ama linksiz) tutalım.
                    // Kullanıcı tıpkı eski sistemdeki gibi text-orange-500 font-bold olarak görmek isterse:
                    if (mentionCache[username] === undefined) {
                        // Henüz yükleniyor
                        return <span key={i} className="text-orange-500 font-bold">{part}</span>
                    }

                    // Bulunamadı -> Normal metin
                    return <span key={i}>{part}</span>;
                }
                return <span key={i}>{part}</span>;
            })}
        </div>
    );
}
