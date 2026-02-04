"use client"

import { useState } from "react"
import { Send, Loader2, AlertCircle, CheckCircle } from "lucide-react"

interface PushNotificationSenderProps {
    courses: { id: string; title: string }[]
}

export default function PushNotificationSender({ courses }: PushNotificationSenderProps) {
    const [title, setTitle] = useState("")
    const [message, setMessage] = useState("")
    const [courseId, setCourseId] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setStatus(null)

        try {
            const response = await fetch("/api/admin/notifications/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    message,
                    courseId: courseId || undefined
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setStatus({
                    type: 'success',
                    message: `Bildirim gönderildi! (${data.inAppCount} kişiye uygulama içi, ${data.result.success} kişiye push)`
                })
                setTitle("")
                setMessage("")
                setCourseId("")
            } else {
                setStatus({ type: 'error', message: data.error || 'Bir hata oluştu' })
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Sunucu hatası' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
                <div className="bg-purple-500/20 p-3 rounded-lg">
                    <Send className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Bildirim Gönder</h2>
                    <p className="text-gray-400 text-sm">Tüm kullanıcılara push bildirimi gönderin</p>
                </div>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Başlık
                    </label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Örn: Hafta Sonu İndirimi!"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Mesaj
                    </label>
                    <textarea
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Bildirim içeriği buraya..."
                        rows={3}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Kurs Seç (Opsiyonel - Tıklanınca açılacak kurs)
                    </label>
                    <select
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                    >
                        <option value="">Kurs seçiniz...</option>
                        {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                                {course.title}
                            </option>
                        ))}
                    </select>
                </div>

                {status && (
                    <div className={`p-4 rounded-lg flex items-center space-x-2 ${status.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {status.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        <span>{status.message}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Gönderiliyor...</span>
                        </>
                    ) : (
                        <>
                            <Send className="h-5 w-5" />
                            <span>Gönder</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}
