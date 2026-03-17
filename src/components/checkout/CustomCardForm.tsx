"use client"

import React, { useState, useEffect, useRef } from "react"
import { CreditCard, Calendar, Lock, User, CheckCircle2, Loader2, Check, X, AlertTriangle, Wifi } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface CustomCardFormProps {
    onSuccess: (cardData: any) => void
    loading: boolean
    errorMessage?: string
}

/* ─── Mini helpers ─────────────────────────────────────────── */
function CardChip() {
    return (
        <div className="w-10 h-8 rounded-md" style={{
            background: 'linear-gradient(135deg, #d4a942 0%, #f0c060 40%, #b8902a 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)'
        }}>
            <div className="grid grid-cols-3 grid-rows-3 gap-px p-1 h-full opacity-60">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="rounded-sm" style={{ background: 'rgba(0,0,0,0.25)' }} />
                ))}
            </div>
        </div>
    )
}

function CardLogo({ type }: { type: string }) {
    if (type === "visa") return (
        <span className="text-white font-black italic text-xl tracking-tighter" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-1px' }}>VISA</span>
    )
    if (type === "mastercard") return (
        <div className="flex items-center">
            <div className="w-7 h-7 rounded-full opacity-90" style={{ background: '#eb001b' }} />
            <div className="w-7 h-7 rounded-full -ml-3 opacity-80" style={{ background: '#f79e1b' }} />
        </div>
    )
    if (type === "troy") return (
        <span className="text-white font-black text-sm tracking-widest">TROY</span>
    )
    return <CreditCard className="w-8 h-8 text-white/40" />
}

/* ─── Live Card Preview ────────────────────────────────────── */
function LiveCard({
    name, number, expiry, cvc, cardType, flipped
}: {
    name: string; number: string; expiry: string; cvc: string; cardType: string; flipped: boolean
}) {
    const displayNumber = (number.replace(/\s/g, '') + '################').slice(0, 16)
        .replace(/(.{4})/g, '$1 ').trim()

    const gradients: Record<string, string> = {
        visa: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
        mastercard: 'linear-gradient(135deg, #1a1a1a 0%, #2d1f1f 50%, #1a0a0a 100%)',
        troy: 'linear-gradient(135deg, #0d2137 0%, #1a4a6b 50%, #0a2540 100%)',
        unknown: 'linear-gradient(135deg, #1c1c1c 0%, #2a2a2a 50%, #141414 100%)',
    }

    return (
        /* Golden ratio wrapper: height = width / φ (1.618), so paddingTop = 61.8% */
        <div className="w-full" style={{ perspective: '1200px', position: 'relative', paddingTop: '61.8%' }}>
            <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                style={{ transformStyle: 'preserve-3d', position: 'absolute', inset: 0 }}
            >
                {/* Front */}
                <div
                    className="absolute inset-0 rounded-[20px] p-7 flex flex-col justify-between overflow-hidden"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        background: gradients[cardType],
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
                    }}
                >
                    {/* Texture overlay */}
                    <div className="absolute inset-0 opacity-5" style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)',
                        backgroundSize: '6px 6px'
                    }} />
                    {/* Glow */}
                    <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20 blur-3xl"
                        style={{ background: cardType === 'visa' ? '#3b82f6' : cardType === 'mastercard' ? '#f97316' : '#22d3ee' }} />

                    {/* Top row */}
                    <div className="flex items-start justify-between relative z-10">
                        <Wifi className="w-6 h-6 text-white/50 rotate-90" />
                        <CardLogo type={cardType} />
                    </div>

                    {/* Chip */}
                    <div className="relative z-10">
                        <CardChip />
                    </div>

                    {/* Number */}
                    <div className="relative z-10">
                        <p className="font-mono text-white text-lg tracking-[0.2em] font-semibold"
                            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                            {displayNumber}
                        </p>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-end justify-between relative z-10">
                        <div>
                            <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Kart Sahibi</p>
                            <p className="text-white text-sm font-semibold uppercase tracking-wider truncate max-w-[160px]">
                                {name || 'AD SOYAD'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Son Kullanma</p>
                            <p className="text-white text-sm font-semibold font-mono">{expiry || 'AA/YY'}</p>
                        </div>
                    </div>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 rounded-[20px] overflow-hidden flex flex-col justify-center"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: gradients[cardType],
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
                    }}
                >
                    {/* Magnetic strip */}
                    <div className="w-full h-10 mt-6" style={{ background: 'rgba(0,0,0,0.8)' }} />
                    {/* Signature strip */}
                    <div className="mx-6 mt-4 flex items-center gap-3">
                        <div className="flex-1 h-10 rounded flex items-center justify-end pr-3"
                            style={{ background: 'repeating-linear-gradient(45deg, #f5f5f5 0, #f5f5f5 2px, #e0e0e0 2px, #e0e0e0 4px)' }}>
                            <span className="text-black font-mono font-bold text-base tracking-widest">{cvc || '•••'}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-white/40 text-[9px] uppercase tracking-widest">CVV</p>
                        </div>
                    </div>
                    <div className="flex justify-end px-6 mt-4">
                        <CardLogo type={cardType} />
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

/* ─── Input Field Component ────────────────────────────────── */
function CardInput({
    label, name, value, onChange, placeholder, icon: Icon, error, type = "text",
    autoComplete, className = '', onFocus, onBlur, inputMode
}: {
    label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder: string; icon: any; error?: string; type?: string; autoComplete?: string
    className?: string; onFocus?: () => void; onBlur?: () => void; inputMode?: any
}) {
    const [focused, setFocused] = useState(false)
    const hasValue = value.length > 0

    return (
        <div className={`relative ${className}`}>
            {/* Input container */}
            <div className={`relative rounded-xl transition-all duration-200 ${error
                ? 'shadow-[0_0_0_1.5px_#ef4444]'
                : focused
                    ? 'shadow-[0_0_0_1.5px_#f97316,0_0_16px_rgba(249,115,22,0.12)]'
                    : 'shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'
                }`}
                style={{ background: 'rgba(255,255,255,0.04)' }}>

                {/* Floating Label */}
                <label
                    htmlFor={name}
                    className="absolute left-10 transition-all duration-200 pointer-events-none select-none"
                    style={{
                        top: focused || hasValue ? '6px' : '50%',
                        transform: focused || hasValue ? 'translateY(0) scale(0.75)' : 'translateY(-50%) scale(1)',
                        transformOrigin: 'left center',
                        color: error ? '#ef4444' : focused ? '#f97316' : 'rgba(255,255,255,0.35)',
                        fontSize: '14px',
                        fontWeight: 500,
                        zIndex: 1
                    }}
                >
                    {label}
                </label>

                {/* Icon */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                    <Icon className="w-4 h-4" style={{ color: error ? '#ef4444' : focused ? '#f97316' : 'rgba(255,255,255,0.25)' }} />
                </div>

                <input
                    id={name}
                    name={name}
                    type={type}
                    inputMode={inputMode}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    placeholder=""
                    onFocus={() => { setFocused(true); onFocus?.() }}
                    onBlur={() => { setFocused(false); onBlur?.() }}
                    className="w-full bg-transparent rounded-xl py-5 pt-6 pb-2 pl-10 pr-4 text-white text-sm font-medium focus:outline-none transition-all"
                    style={{ caretColor: '#f97316' }}
                />
            </div>

            {/* Error message */}
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-1 text-xs text-red-400 mt-1.5 ml-1"
                    >
                        <AlertTriangle className="w-3 h-3" />
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ─── Main Component ───────────────────────────────────────── */
export default function CustomCardForm({ onSuccess, loading, errorMessage }: CustomCardFormProps) {
    const [formData, setFormData] = useState({ cardHolderName: "", cardNumber: "", expireDate: "", cvc: "" })
    const [localSubmit, setLocalSubmit] = useState(false)
    const [agreements, setAgreements] = useState({ subscription: false, preliminary: false })
    const [modalContent, setModalContent] = useState<{ title: string, url: string } | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [cardType, setCardType] = useState<"visa" | "mastercard" | "troy" | "unknown">("unknown")
    const [cardFlipped, setCardFlipped] = useState(false)

    useEffect(() => { if (!loading) setLocalSubmit(false) }, [loading])

    useEffect(() => {
        const num = formData.cardNumber.replace(/\s+/g, "")
        if (num.startsWith("4")) setCardType("visa")
        else if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) setCardType("mastercard")
        else if (num.startsWith("9792")) setCardType("troy")
        else setCardType("unknown")
    }, [formData.cardNumber])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target
        if (name === "cardNumber") {
            value = value.replace(/\D/g, "").substring(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ")
        } else if (name === "expireDate") {
            value = value.replace(/\D/g, "").substring(0, 4)
            if (value.length > 2) value = value.substring(0, 2) + "/" + value.substring(2)
        } else if (name === "cvc") {
            value = value.replace(/\D/g, "").substring(0, 3)
        }
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n })
    }

    const validate = () => {
        const e: Record<string, string> = {}
        if (!formData.cardHolderName.trim()) e.cardHolderName = "Kart üzerindeki isim gereklidir"
        if (formData.cardNumber.replace(/\s+/g, "").length < 16) e.cardNumber = "Geçersiz kart numarası"
        if (formData.expireDate.length < 5) e.expireDate = "Geçersiz tarih"
        if (formData.cvc.length < 3) e.cvc = "Geçersiz CVV"
        if (!agreements.subscription) e.subscription = "x"
        if (!agreements.preliminary) e.preliminary = "x"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const isFormValid = formData.cardHolderName.trim() !== "" &&
        formData.cardNumber.replace(/\s+/g, "").length === 16 &&
        formData.expireDate.length === 5 &&
        formData.cvc.length === 3 &&
        agreements.subscription && agreements.preliminary

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (loading || localSubmit) return
        if (validate()) {
            setLocalSubmit(true)
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
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md mx-auto"
        >
            {/* Card Preview */}
            <div className="mb-6 px-2">
                <LiveCard
                    name={formData.cardHolderName}
                    number={formData.cardNumber}
                    expiry={formData.expireDate}
                    cvc={formData.cvc}
                    cardType={cardType}
                    flipped={cardFlipped}
                />
            </div>

            {/* Form Container */}
            <div className="rounded-2xl overflow-hidden"
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
                }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(249,115,22,0.15)' }}>
                            <Lock className="w-3.5 h-3.5 text-orange-400" />
                        </div>
                        <span className="text-sm font-semibold text-white">Güvenli Ödeme</span>
                    </div>
                    {/* Card type indicators */}
                    <div className="flex items-center gap-2">
                        {(['visa', 'mastercard'] as const).map(t => (
                            <div key={t}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all duration-200 ${cardType === t
                                    ? 'text-white ring-1 ring-orange-500'
                                    : 'text-white/25'
                                    }`}
                                style={{ background: cardType === t ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)' }}
                            >
                                {t === 'visa' ? 'VISA' : 'MC'}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Card Holder */}
                    <CardInput
                        label="Kart Üzerindeki İsim"
                        name="cardHolderName"
                        value={formData.cardHolderName}
                        onChange={handleInputChange}
                        placeholder=""
                        icon={User}
                        error={errors.cardHolderName}
                        autoComplete="cc-name"
                    />

                    {/* Card Number */}
                    <CardInput
                        label="Kart Numarası"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        placeholder=""
                        icon={CreditCard}
                        error={errors.cardNumber}
                        autoComplete="cc-number"
                        inputMode="numeric"
                    />

                    {/* Expiry + CVV */}
                    <div className="grid grid-cols-2 gap-3">
                        <CardInput
                            label="Son Kullanma"
                            name="expireDate"
                            value={formData.expireDate}
                            onChange={handleInputChange}
                            placeholder=""
                            icon={Calendar}
                            error={errors.expireDate}
                            autoComplete="cc-exp"
                            inputMode="numeric"
                        />
                        <CardInput
                            label="CVV / CVC"
                            name="cvc"
                            value={formData.cvc}
                            onChange={handleInputChange}
                            placeholder=""
                            icon={Lock}
                            error={errors.cvc}
                            autoComplete="cc-csc"
                            inputMode="numeric"
                            onFocus={() => setCardFlipped(true)}
                            onBlur={() => setCardFlipped(false)}
                        />
                    </div>

                    {/* Agreements */}
                    <div className="space-y-3 pt-1">
                        {[
                            {
                                key: 'subscription' as const,
                                label: 'Premium Abonelik Sözleşmesini',
                                url: '/mesafeli-satis-sozlesmesi',
                                title: 'Premium Abonelik Sözleşmesi',
                                suffix: ' kabul ediyorum.'
                            },
                            {
                                key: 'preliminary' as const,
                                label: 'Premium Abonelik Ön Bilgilendirme Formunu',
                                url: '/on-bilgilendirme-formu',
                                title: 'Premium Abonelik Ön Bilgilendirme Formu',
                                suffix: ' onaylıyorum.'
                            }
                        ].map(({ key, label, url, title, suffix }) => (
                            <div
                                key={key}
                                className="flex items-start gap-3 cursor-pointer group"
                                onClick={() => setAgreements(prev => ({ ...prev, [key]: !prev[key] }))}
                            >
                                <div className={`mt-0.5 flex-shrink-0 w-4.5 h-4.5 rounded transition-all duration-200 flex items-center justify-center
                                    ${agreements[key]
                                        ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                                        : 'group-hover:border-orange-500/50'
                                    }`}
                                    style={{
                                        width: '18px', height: '18px',
                                        border: agreements[key] ? '1.5px solid #f97316' : '1.5px solid rgba(255,255,255,0.15)',
                                        background: agreements[key] ? '#f97316' : 'rgba(255,255,255,0.04)'
                                    }}>
                                    {agreements[key] && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed select-none">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setModalContent({ title, url }) }}
                                        className="text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors"
                                    >
                                        {label}
                                    </button>
                                    {suffix}
                                </p>
                            </div>
                        ))}

                        <AnimatePresence>
                            {(errors.subscription || errors.preliminary) && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-xs text-red-400 ml-1"
                                >
                                    Devam etmek için sözleşmeleri onaylayın.
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Error Banner */}
                    <AnimatePresence>
                        {errorMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="flex items-start gap-3 rounded-xl p-4"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
                            >
                                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-red-400 mb-0.5">Ödeme Reddedildi</p>
                                    <p className="text-xs text-red-400/70 leading-relaxed">{errorMessage}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={loading || localSubmit || !isFormValid}
                        className="relative overflow-hidden w-full text-white font-bold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 mt-2"
                        style={{
                            background: isFormValid && !loading && !localSubmit
                                ? 'linear-gradient(135deg, #f97316, #dc2626)'
                                : 'rgba(255,255,255,0.06)',
                            color: isFormValid && !loading && !localSubmit ? 'white' : 'rgba(255,255,255,0.25)',
                            boxShadow: isFormValid && !loading && !localSubmit ? '0 8px 32px rgba(249,115,22,0.35)' : 'none',
                            cursor: isFormValid && !loading && !localSubmit ? 'pointer' : 'not-allowed'
                        }}
                    >
                        {/* Shimmer on hover */}
                        {isFormValid && (
                            <span className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
                        )}
                        {(loading || localSubmit) ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                Ödemeyi Tamamla
                            </>
                        )}
                    </button>

                    {/* Trust Badges */}
                    <div className="flex items-center justify-center gap-3 pt-1">
                        <Lock className="w-3.5 h-3.5 text-zinc-600" />
                        <span className="text-[10px] text-zinc-600 uppercase tracking-widest">256-bit SSL Şifreli</span>
                        <div className="w-px h-3 bg-zinc-800" />
                        <img src="/iyzico-logo-pack/checkout_iyzico_ile_ode/TR/Tr_White_Horizontal/iyzico_ile_ode_horizontal_white.svg"
                            alt="iyzico" className="h-3 opacity-25" />
                    </div>
                </form>
            </div>

            {/* Agreement Modal */}
            <AnimatePresence>
                {modalContent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
                        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
                        onClick={() => setModalContent(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(249,115,22,0.15)' }}
                        >
                            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                                <h3 className="text-lg font-bold text-zinc-900">{modalContent.title}</h3>
                                <button
                                    onClick={() => setModalContent(null)}
                                    className="w-8 h-8 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <iframe
                                    src={modalContent.url}
                                    className="w-full h-[70vh] border-none"
                                    title={modalContent.title}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
