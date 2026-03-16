"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Loader2, Check, X, AlertTriangle } from "lucide-react"

interface CustomCardFormProps {
    onSuccess: (cardData: any) => void
    loading: boolean
    errorMessage?: string
}

export default function CustomCardForm({ onSuccess, loading, errorMessage }: CustomCardFormProps) {
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

    const [modalContent, setModalContent] = useState<{ title: string, url: string } | null>(null)

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

    const isFormValid = formData.cardHolderName.trim() !== "" &&
        formData.cardNumber.replace(/\s+/g, "").length === 16 &&
        formData.expireDate.length === 5 &&
        formData.cvc.length === 3 &&
        agreements.subscription &&
        agreements.preliminary

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

    // Format expiration date for live preview
    const formatPreviewDate = (date: string) => {
        if (!date) return "AA / YY";
        const parts = date.split("/");
        if (parts.length === 2) {
            return `${parts[0] || "AA"} / ${parts[1] || "YY"}`;
        }
        return date.padEnd(5, " ").replace(/(.{2})/, "$1 / ").substring(0, 7) || "AA / YY";
    }

    // Format card number for live preview (show dots for empty spaces)
    const formatPreviewNumber = (number: string) => {
        const cleanNumber = number.replace(/\s+/g, "");
        let formatted = "";
        for (let i = 0; i < 16; i++) {
            if (i > 0 && i % 4 === 0) formatted += "  ";
            if (i < cleanNumber.length) {
                formatted += cleanNumber[i];
            } else {
                formatted += "•";
            }
        }
        return formatted;
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-5xl mx-auto mt-8"
        >
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start justify-center">

                {/* Left Panel: Live Card Preview */}
                <div className="w-full lg:w-1/2 max-w-sm mx-auto flex flex-col items-center lg:items-end lg:pt-8 order-2 lg:order-1">
                    <div className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
                        {/* Premium Silver/Grey Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-300 via-zinc-400 to-zinc-500" />
                        
                        {/* Subtle noise/texture overlay (optional CSS approach) */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-black mix-blend-overlay" />

                        <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between z-10">
                            
                            {/* Top Row: Chip & Logo */}
                            <div className="flex justify-between items-start">
                                {/* SIM Chip SVG */}
                                <svg width="45" height="35" viewBox="0 0 45 35" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
                                    <rect width="45" height="35" rx="4" fill="#EADE91"/>
                                    <path d="M0 10H15M0 25H15M45 10H30M45 25H30M15 0V35M30 0V35M15 17.5H30" stroke="#7E7127" strokeWidth="1.5" strokeLinecap="round"/>
                                    <rect x="15" y="10" width="15" height="15" rx="2" stroke="#7E7127" strokeWidth="1.5" fill="none"/>
                                </svg>

                                {/* Card Type Logo (Visa/Mastercard) */}
                                <div className="h-8 flex items-center justify-end w-16">
                                    {cardType === 'visa' && (
                                        <svg viewBox="0 0 32 10" className="h-full w-auto drop-shadow-md text-white fill-current"><path d="M12.639 9.17H9.27L11.396.953h3.369L12.639 9.17zM24.237.953h-2.583c-.605 0-1.076.173-1.348.813l-4.789 8.216h3.535l.707-1.956h4.316l.403 1.956h3.111L24.237.953zM21.05 5.892l1.644-4.509 1.134 4.509h-2.778zM10.151 7.42C8.36 7.42 7.159 6.463 7.18 5.421c0-.985.998-1.522 2.213-1.84 2.115-.558 2.155-1.015 2.155-1.056.02-1.055-1.078-1.37-2.355-1.37-2.091 0-3.376.66-3.414.675l-.65-2.02S6.52.953 9.423.953c3.855 0 5.614 1.705 5.614 3.736-.021 2.375-2.454 3.126-3.791 3.511-1.258.361-1.317.756-1.317.924 0 .431.64.939 2.508.939 1.488 0 2.45-.441 2.923-.69l.643 2.05s-1.83.69-4.22.69h-1.632zM3.442.953L.044 9.17H3.45l.942-2.518h.06c1.17 0 2.221-.304 2.805-1.015.684-.812.87-1.93.87-3.03 0-1.884-1.296-2.56-2.822-2.56H3.442z"/></svg>
                                    )}
                                    {cardType === 'mastercard' && (
                                        <svg viewBox="0 0 24 15" className="h-full w-auto drop-shadow-md"><circle cx="7.5" cy="7.5" r="7.5" fill="#EB001B"/><circle cx="16.5" cy="7.5" r="7.5" fill="#F79E1B"/><path d="M12 13.91a7.48 7.48 0 0 1 0-12.82 7.48 7.48 0 0 1 0 12.82z" fill="#FF5F00"/></svg>
                                    )}
                                    {cardType === 'troy' && (
                                        <span className="text-white font-black italic drop-shadow-md text-xl">TROY</span>
                                    )}
                                </div>
                            </div>

                            {/* Middle Row: Card Number */}
                            <div className="w-full text-center mt-6 sm:mt-8">
                                <p className="text-white text-xl sm:text-[25px] font-mono tracking-[0.2em] sm:tracking-[0.25em] drop-shadow-md font-medium">
                                    {formatPreviewNumber(formData.cardNumber)}
                                </p>
                            </div>

                            {/* Bottom Row: Name & Expiry */}
                            <div className="flex justify-between items-end mt-4 sm:mt-6 mb-1">
                                <div className="flex flex-col">
                                    <span className="text-white/60 text-[8px] sm:text-[10px] uppercase tracking-widest mb-1.5 font-medium">Cardholder Name</span>
                                    <span className="text-white text-sm sm:text-base font-medium tracking-widest drop-shadow-md uppercase truncate max-w-[180px] sm:max-w-[200px]">
                                        {formData.cardHolderName || "AD VE SOYAD"}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-white/60 text-[8px] sm:text-[10px] uppercase tracking-widest mb-1.5 font-medium">Valid Thru</span>
                                    <span className="text-white text-sm sm:text-base font-mono tracking-widest drop-shadow-md">
                                        {formatPreviewDate(formData.expireDate)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:flex w-full mt-12 items-center justify-center gap-6 grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                        <img src="/iyzico-logo-pack/checkout_iyzico_ile_ode/TR/Tr_White_Horizontal/iyzico_ile_ode_horizontal_white.svg" alt="iyzico" className="h-4" />
                        <div className="w-px h-6 bg-zinc-700"></div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Secure 256-bit SSL</span>
                    </div>
                </div>

                {/* Right Panel: Input Form */}
                <div className="w-full lg:w-1/2 max-w-sm mx-auto flex flex-col order-1 lg:order-2">
                    
                    <div className="text-center lg:text-left mb-10">
                        <h2 className="text-2xl font-semibold text-white tracking-wide">Kart Bilgileri</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                        {/* Card Number */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-medium text-zinc-400 tracking-wide">Kart Numarası</label>
                            <input
                                type="text"
                                name="cardNumber"
                                value={formData.cardNumber}
                                onChange={handleInputChange}
                                className={`w-full bg-black border-b sm:border sm:rounded-md ${errors.cardNumber ? 'border-red-500' : 'border-zinc-800 focus:border-white'} py-3 px-0 sm:px-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-0 transition-colors font-mono tracking-widest text-lg`}
                                placeholder="0000 0000 0000 0000"
                                autoComplete="cc-number"
                                maxLength={19}
                            />
                            {errors.cardNumber && <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>}
                        </div>

                        {/* Card Holder */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-medium text-zinc-400 tracking-wide">Kart Üzerindeki İsim</label>
                            <input
                                type="text"
                                name="cardHolderName"
                                value={formData.cardHolderName}
                                onChange={handleInputChange}
                                className={`w-full bg-black border-b sm:border sm:rounded-md ${errors.cardHolderName ? 'border-red-500' : 'border-zinc-800 focus:border-white'} py-3 px-0 sm:px-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-0 transition-colors text-lg uppercase`}
                                placeholder="AD SOYAD"
                                autoComplete="cc-name"
                            />
                            {errors.cardHolderName && <p className="text-xs text-red-500 mt-1">{errors.cardHolderName}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-8 sm:gap-4">
                            {/* Expiry Date */}
                            <div className="space-y-2">
                                <label className="text-[13px] font-medium text-zinc-400 tracking-wide pt-2 sm:pt-0">Son Geçerlilik Tarihi</label>
                                <input
                                    type="text"
                                    name="expireDate"
                                    value={formData.expireDate}
                                    onChange={handleInputChange}
                                    className={`w-full bg-black border-b sm:border sm:rounded-md ${errors.expireDate ? 'border-red-500' : 'border-zinc-800 focus:border-white'} py-3 px-0 sm:px-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-0 transition-colors text-lg text-center sm:text-left tracking-widest`}
                                    placeholder="AA / YY"
                                    autoComplete="cc-exp"
                                    maxLength={5}
                                />
                                {errors.expireDate && <p className="text-xs text-red-500 mt-1 text-center sm:text-left">{errors.expireDate}</p>}
                            </div>

                            {/* CVV */}
                            <div className="space-y-2">
                                <label className="text-[13px] font-medium text-zinc-400 tracking-wide pt-2 sm:pt-0">CVV</label>
                                <input
                                    type="text"
                                    name="cvc"
                                    value={formData.cvc}
                                    onChange={handleInputChange}
                                    className={`w-full bg-black border-b sm:border sm:rounded-md ${errors.cvc ? 'border-red-500' : 'border-zinc-800 focus:border-white'} py-3 px-0 sm:px-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-0 transition-colors font-mono text-lg text-center sm:text-left tracking-widest`}
                                    placeholder="***"
                                    autoComplete="cc-csc"
                                    maxLength={4}
                                />
                                {errors.cvc && <p className="text-xs text-red-500 mt-1 text-center sm:text-left">{errors.cvc}</p>}
                            </div>
                        </div>

                        {/* Agreements */}
                        <div className="space-y-4 pt-6">
                            <div className="flex items-start gap-3 group cursor-pointer" onClick={() => setAgreements(prev => ({ ...prev, subscription: !prev.subscription }))}>
                                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-[4px] border ${agreements.subscription ? 'bg-white border-white' : 'border-zinc-600 bg-black'} flex items-center justify-center transition-all`}>
                                    {agreements.subscription && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                                </div>
                                <p className="text-[13px] text-zinc-300 leading-relaxed">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setModalContent({ title: "Premium Abonelik Sözleşmesi", url: "/mesafeli-satis-sozlesmesi" }) }}
                                        className="text-white hover:text-zinc-300 font-medium underline underline-offset-4 decoration-zinc-600 transition-colors"
                                    >
                                        Premium Abonelik Sözleşmesini
                                    </button> kabul ediyorum.
                                </p>
                            </div>

                            <div className="flex items-start gap-3 group cursor-pointer" onClick={() => setAgreements(prev => ({ ...prev, preliminary: !prev.preliminary }))}>
                                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-[4px] border ${agreements.preliminary ? 'bg-white border-white' : 'border-zinc-600 bg-black'} flex items-center justify-center transition-all`}>
                                    {agreements.preliminary && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                                </div>
                                <p className="text-[13px] text-zinc-300 leading-relaxed">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setModalContent({ title: "Premium Abonelik Ön Bilgilendirme Formunu", url: "/on-bilgilendirme-formu" }) }}
                                        className="text-white hover:text-zinc-300 font-medium underline underline-offset-4 decoration-zinc-600 transition-colors"
                                    >
                                        Premium Abonelik Ön Bilgilendirme Formunu
                                    </button> onaylıyorum.
                                </p>
                            </div>

                            {(errors.subscription || errors.preliminary) && (
                                <p className="text-[11px] text-red-500 mt-2 font-medium">Satın alma işlemini tamamlamak için sözleşmeleri onaylamanız gerekmektedir.</p>
                            )}
                        </div>

                        {/* Payment Error Banner */}
                        <AnimatePresence>
                            {errorMessage && (
                                <motion.div
                                    key="error-banner"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-red-500 mb-0.5">İşlem Başarısız</p>
                                            <p className="text-[13px] text-red-400/90 leading-relaxed">{errorMessage}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading || !isFormValid}
                            className={`w-full py-4 rounded-lg font-bold text-[15px] transition-all flex items-center justify-center gap-2 mt-8 ${
                                isFormValid && !loading 
                                ? 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                                : 'bg-transparent border border-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                            ) : (
                                "Ödemeyi Tamamla"
                            )}
                        </button>

                    </form>
                </div>
            </div>

            {/* Agreement Modal */}
            <AnimatePresence>
                {modalContent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.98, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.98, opacity: 0, y: 10 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-black border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                                <h3 className="text-lg font-medium text-white tracking-wide">{modalContent.title}</h3>
                                <button
                                    onClick={() => setModalContent(null)}
                                    className="p-2 text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-0 bg-white">
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
