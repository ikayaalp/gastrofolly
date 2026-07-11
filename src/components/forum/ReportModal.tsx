'use client'

import { useState } from 'react'
import { X, ShieldAlert } from 'lucide-react'

interface ReportModalProps {
    isOpen: boolean
    onClose: () => void
    targetId: string
    targetType: 'topic' | 'post'
}

export default function ReportModal({ isOpen, onClose, targetId, targetType }: ReportModalProps) {
    const [reason, setReason] = useState('SPAM')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/forum/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId, targetType, reason, description })
            })

            const data = await res.json()

            if (res.ok) {
                setSuccess(true)
                setTimeout(() => {
                    onClose()
                }, 2000)
            } else {
                setError(data.error || 'Şikayet gönderilemedi')
            }
        } catch (err) {
            setError('Bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a1a] rounded-2xl max-w-md w-full border border-gray-800 shadow-xl overflow-hidden relative">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center space-x-2">
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                        <h2 className="text-lg font-bold text-gray-100">İçeriği Şikayet Et</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 text-green-500 mb-4">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">Şikayetiniz Alındı</h3>
                            <p className="text-gray-400">Bildiriminiz için teşekkürler. İnceleme başlatılacaktır.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Şikayet Nedeni</label>
                                <select 
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 appearance-none"
                                >
                                    <option value="SPAM">Spam / Reklam</option>
                                    <option value="HARASSMENT">Taciz / Zorbalık</option>
                                    <option value="INAPPROPRIATE">Uygunsuz İçerik</option>
                                    <option value="HATE_SPEECH">Nefret Söylemi</option>
                                    <option value="OTHER">Diğer</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Ek Açıklama (İsteğe Bağlı)</label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Lütfen durumu detaylandırın..."
                                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 min-h-[100px] resize-y"
                                />
                            </div>

                            <div className="pt-2 flex space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors font-medium"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Gönderiliyor...' : 'Gönder'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
