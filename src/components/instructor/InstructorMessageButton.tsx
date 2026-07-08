'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

interface InstructorMessageButtonProps {
    instructorId: string
    isPremium: boolean
}

export default function InstructorMessageButton({ instructorId, isPremium }: InstructorMessageButtonProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showPremiumModal, setShowPremiumModal] = useState(false)

    const handleMessageClick = async () => {
        if (!isPremium) {
            setShowPremiumModal(true)
            return
        }

        if (loading) return
        setLoading(true)

        try {
            const response = await fetch('/api/dm/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ otherUserId: instructorId }),
            })

            const data = await response.json()

            if (!response.ok) {
                if (data.code === 'PREMIUM_REQUIRED') {
                    toast.error('Mesaj göndermek için premium üyelik gerekiyor.')
                } else {
                    toast.error(data.error || 'Mesaj başlatılamadı.')
                }
                return
            }

            // Redirect to the conversation
            router.push(`/messages/${data.data.conversationId}`)
        } catch (error) {
            console.error('Error starting conversation:', error)
            toast.error('Bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={handleMessageClick}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium transition-colors ${
                    isPremium
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-gray-700 cursor-not-allowed opacity-50'
                }`}
            >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
                <span>Mesaj Gönder</span>
            </button>
            <ConfirmationModal
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
                onConfirm={() => {
                    setShowPremiumModal(false)
                    router.push('/subscription')
                }}
                title="Premium Üyelik Gerekli"
                message="Eğitmenlere mesaj gönderebilmek için premium üyeliğe sahip olmanız gerekiyor."
                confirmText="Abone Ol"
                cancelText="Vazgeç"
            />
        </>
    )
}
