'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Calendar } from 'lucide-react'

interface PollCreationModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function PollCreationModal({ isOpen, onClose, onSuccess }: PollCreationModalProps) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('Anket')
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState<string[]>(['', ''])
    const [days, setDays] = useState(1)
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleOptionChange = (idx: number, value: string) => {
        const newOptions = [...options]
        newOptions[idx] = value
        setOptions(newOptions)
    }

    const addOption = () => {
        setOptions([...options, ''])
    }

    const removeOption = (idx: number) => {
        if (options.length <= 2) return
        const newOptions = options.filter((_, i) => i !== idx)
        setOptions(newOptions)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!question.trim()) return alert('Soru zorunludur')
        if (options.some(o => !o.trim())) return alert('Tüm seçenekleri doldurun')
        if (options.length < 2) return alert('En az 2 seçenek gerekli')

        setLoading(true)

        try {
            const res = await fetch('/api/forum/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title || question,
                    content,
                    question,
                    options,
                    days
                })
            })

            if (res.ok) {
                onSuccess()
                onClose()
                // Reset form
                setQuestion('')
                setOptions(['', ''])
                setTitle('')
            } else {
                const data = await res.json()
                alert(data.error || 'Bir hata oluştu')
            }
        } catch (error) {
            console.error(error)
            alert('Bağlantı hatası')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-black/40">
                    <h2 className="text-lg font-bold text-white">Yeni Anket Oluştur</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Anket Sorusu</label>
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Sormak istediğiniz soru..."
                                className="w-full bg-black/50 border border-neutral-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-400">Seçenekler</label>
                            {options.map((opt, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                        placeholder={`${idx + 1}. Seçenek`}
                                        className="flex-1 bg-black/50 border border-neutral-800 rounded-lg p-2 text-sm text-white focus:border-orange-500 outline-none"
                                        required
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(idx)}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addOption}
                                className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1 font-medium mt-1"
                            >
                                <Plus className="w-4 h-4" /> Seçenek Ekle
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Süre</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 3, 7, 30].map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setDays(d)}
                                        className={`p-2 rounded-lg text-sm border transition-all ${days === d
                                                ? 'bg-orange-600 border-orange-600 text-white'
                                                : 'bg-black/50 border-neutral-800 text-gray-400 hover:border-gray-600'
                                            }`}
                                    >
                                        {d} Gün
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Oluşturuluyor...' : 'Anketi Başlat'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
