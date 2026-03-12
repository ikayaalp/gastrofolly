"use client"

import React, { useState, useEffect } from "react"
import { CreditCard, Calendar, Lock, User, CheckCircle2, AlertCircle, Loader2, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

interface CustomCardFormProps {
    onSuccess: (cardData: any) => void
    loading: boolean
}

export default function CustomCardForm({ onSuccess, loading }: CustomCardFormProps) {
    const [formData, setFormData] = useState({
        cardHolderName: "",
        cardNumber: "",
        expireDate: "",
        cvc: ""
    })

    const [agreements, setAgreements] = useState({
        subscription: false,
        preliminary: false
    })

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [cardType, setCardType] = useState<"visa" | "mastercard" | "troy" | "unknown">("unknown")

    // Card type detection logic
    useEffect(() => {
        const num = formData.cardNumber.replace(/\s+/g, "")
        if (num.startsWith("4")) {
            setCardType("visa")
        } else if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) {
            setCardType("mastercard")
        } else if (num.startsWith("9792")) {
            setCardType("troy")
        } else {
            setCardType("unknown")
        }
    }, [formData.cardNumber])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target

        if (name === "cardNumber") {
            value = value.replace(/\D/g, "").substring(0, 16)
            value = value.replace(/(\d{4})(?=\d)/g, "$1 ")
        } else if (name === "expireDate") {
            value = value.replace(/\D/g, "").substring(0, 4)
            if (value.length > 2) {
                value = value.substring(0, 2) + "/" + value.substring(2)
            }
        } else if (name === "cvc") {
            value = value.replace(/\D/g, "").substring(0, 3)
        }

        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear error when typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.cardHolderName.trim()) newErrors.cardHolderName = "Kart üzerindeki isim gereklidir"
        if (formData.cardNumber.replace(/\s+/g, "").length < 16) newErrors.cardNumber = "Geçersiz kart numarası"
        if (formData.expireDate.length < 5) newErrors.expireDate = "Geçersiz tarih"
        if (formData.cvc.length < 3) newErrors.cvc = "Geçersiz CVC"

        if (!agreements.subscription) newErrors.subscription = "Sözleşmeyi kabul etmelisiniz"
        if (!agreements.preliminary) newErrors.preliminary = "Ön bilgilendirme formunu onaylamalısınız"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validate()) {
            const [month, year] = formData.expireDate.split("/")
            onSuccess({
                cardHolderName: formData.cardHolderName,
                cardNumber: formData.cardNumber.replace(/\s+/g, ""),
                expireMonth: month,
                expireYear: "20" + year,
                cvc: formData.cvc
            })
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto"
        >
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Lock className="w-5 h-5 text-orange-500" />
                        Güvenli Ödeme
                    </h2>
                    <div className="flex gap-2">
                        <div className={`w-10 h-6 bg-zinc-800 rounded flex items-center justify-center transition-opacity ${cardType === 'visa' ? 'opacity-100 ring-1 ring-orange-500' : 'opacity-40'}`}>
                            <span className="text-[10px] font-bold text-white italic">VISA</span>
                        </div>
                        <div className={`w-10 h-6 bg-zinc-800 rounded flex items-center justify-center transition-opacity ${cardType === 'mastercard' ? 'opacity-100 ring-1 ring-orange-500' : 'opacity-40'}`}>
                            <span className="text-[10px] font-bold text-white italic">MC</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Card Holder */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400 ml-1">Kart Üzerindeki İsim</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                name="cardHolderName"
                                value={formData.cardHolderName}
                                onChange={handleInputChange}
                                className={`w-full bg-zinc-950 border ${errors.cardHolderName ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all`}
                                placeholder="AD SOYAD"
                                autoComplete="cc-name"
                            />
                        </div>
                        {errors.cardHolderName && <p className="text-xs text-red-500 mt-1 ml-1">{errors.cardHolderName}</p>}
                    </div>

                    {/* Card Number */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400 ml-1">Kart Numarası</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                name="cardNumber"
                                value={formData.cardNumber}
                                onChange={handleInputChange}
                                className={`w-full bg-zinc-950 border ${errors.cardNumber ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-mono tracking-wider`}
                                placeholder="0000 0000 0000 0000"
                                autoComplete="cc-number"
                            />
                        </div>
                        {errors.cardNumber && <p className="text-xs text-red-500 mt-1 ml-1">{errors.cardNumber}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Expiry Date */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400 ml-1">S.K.T</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type="text"
                                    name="expireDate"
                                    value={formData.expireDate}
                                    onChange={handleInputChange}
                                    className={`w-full bg-zinc-950 border ${errors.expireDate ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all`}
                                    placeholder="AA/YY"
                                    autoComplete="cc-exp"
                                />
                            </div>
                            {errors.expireDate && <p className="text-xs text-red-500 mt-1 ml-1">{errors.expireDate}</p>}
                        </div>

                        {/* CVV */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400 ml-1">CVV</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type="text"
                                    name="cvc"
                                    value={formData.cvc}
                                    onChange={handleInputChange}
                                    className={`w-full bg-zinc-950 border ${errors.cvc ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all`}
                                    placeholder="***"
                                    autoComplete="cc-csc"
                                />
                            </div>
                            {errors.cvc && <p className="text-xs text-red-500 mt-1 ml-1">{errors.cvc}</p>}
                        </div>
                    </div>

                    {/* Agreements */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-start gap-3 group cursor-pointer" onClick={() => setAgreements(prev => ({ ...prev, subscription: !prev.subscription }))}>
                            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border ${agreements.subscription ? 'bg-orange-600 border-orange-600' : 'border-white/20 bg-zinc-950'} flex items-center justify-center transition-all group-hover:border-orange-500/50`}>
                                {agreements.subscription && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed font-light">
                                <Link href="/mesafeli-satis-sozlesmesi" target="_blank" className="text-orange-500 hover:text-orange-400 underline underline-offset-2 font-normal" onClick={(e) => e.stopPropagation()}>Premium Abonelik Sözleşmesini</Link> kabul ediyorum.
                            </p>
                        </div>

                        <div className="flex items-start gap-3 group cursor-pointer" onClick={() => setAgreements(prev => ({ ...prev, preliminary: !prev.preliminary }))}>
                            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border ${agreements.preliminary ? 'bg-orange-600 border-orange-600' : 'border-white/20 bg-zinc-950'} flex items-center justify-center transition-all group-hover:border-orange-500/50`}>
                                {agreements.preliminary && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed font-light">
                                <Link href="/on-bilgilendirme-formu" target="_blank" className="text-orange-500 hover:text-orange-400 underline underline-offset-2 font-normal" onClick={(e) => e.stopPropagation()}>Premium Abonelik Ön Bilgilendirme Formunu</Link> onaylıyorum.
                            </p>
                        </div>

                        {(errors.subscription || errors.preliminary) && (
                            <p className="text-[10px] text-red-500 animate-pulse ml-1">Lütfen devam etmek için sözleşmeleri onaylayın.</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-900/10 flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                Ödemeyi Tamamla
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-4 grayscale opacity-50">
                    <img src="/iyzico-logo-pack/checkout_iyzico_ile_ode/TR/Tr_White_Horizontal/iyzico_ile_ode_horizontal_white.svg" alt="iyzico" className="h-4" />
                    <div className="w-px h-4 bg-zinc-800"></div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Secure 256-bit SSL</span>
                </div>
            </div>
        </motion.div>
    )
}
