'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

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
    const [alertState, setAlertState] = useState<{ isOpen: boolean, message: string }>({ isOpen: false, message: '' })

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
        if (!question.trim()) return setAlertState({ isOpen: true, message: 'Soru zorunludur' })
        if (options.some(o => !o.trim())) return setAlertState({ isOpen: true, message: 'Tüm seçenekleri doldurun' })
        if (options.length < 2) return setAlertState({ isOpen: true, message: 'En az 2 seçenek gerekli' })

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
                setAlertState({ isOpen: true, message: data.error || 'Bir hata oluştu' })
            }
        } catch (error) {
            console.error(error)
            setAlertState({ isOpen: true, message: 'Bağlantı hatası' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Yeni Anket Oluştur" size="md">
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
                    <Input
                        label="Anket Sorusu"
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Sormak istediğiniz soru..."
                        required
                    />

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Seçenekler</label>
                        {options.map((opt, idx) => (
                            <div key={idx} className="flex gap-2">
                                <Input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                    placeholder={`${idx + 1}. Seçenek`}
                                    required
                                />
                                {options.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => removeOption(idx)}
                                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addOption}
                            className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1 font-medium mt-2"
                        >
                            <Plus className="w-4 h-4" /> Seçenek Ekle
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Süre</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 3, 7, 30].map(d => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDays(d)}
                                    className={`p-2 rounded-xl text-sm border transition-all ${days === d
                                        ? 'bg-orange-600 border-orange-600 text-white'
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                                        }`}
                                >
                                    {d} Gün
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            isLoading={loading}
                            className="w-full"
                        >
                            {loading ? 'Oluşturuluyor...' : 'Anketi Başlat'}
                        </Button>
                    </div>
                </form>
            </Modal>

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
