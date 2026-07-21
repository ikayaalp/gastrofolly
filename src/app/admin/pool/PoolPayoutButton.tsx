"use client"

import { useState } from "react"
import { Check } from "lucide-react"

export default function PoolPayoutButton({ instructorId, month, year, amount, isPaid }: { instructorId: string, month: number, year: number, amount: number, isPaid: boolean }) {
    const [loading, setLoading] = useState(false)
    const [paid, setPaid] = useState(isPaid)

    const handlePayout = async () => {
        if (!confirm("Emin misiniz? Ödeme kaydı oluşturulacak.")) return
        
        setLoading(true)
        try {
            const res = await fetch('/api/admin/pool/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instructorId, month, year, amount })
            })
            if (res.ok) {
                setPaid(true)
                alert("Ödeme başarıyla kaydedildi.")
            } else {
                const data = await res.json()
                alert(data.error || "Bir hata oluştu.")
            }
        } catch (e) {
            console.error(e)
            alert("Bağlantı hatası.")
        } finally {
            setLoading(false)
        }
    }

    if (paid) {
        return (
            <span className="inline-flex items-center text-green-500 font-medium text-xs bg-green-500/10 px-2 py-1 rounded">
                <Check className="w-3 h-3 mr-1" /> Ödendi
            </span>
        )
    }

    return (
        <button 
            onClick={handlePayout}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-500 text-white text-xs px-3 py-1 rounded font-medium transition-colors disabled:opacity-50"
        >
            {loading ? 'İşleniyor...' : 'Öde'}
        </button>
    )
}
