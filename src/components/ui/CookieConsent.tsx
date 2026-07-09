"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const CONSENT_KEY = "culinora-cookie-consent"
type ConsentValue = "accepted" | "rejected"

function loadAnalytics(measurementId: string) {
    if (document.getElementById("ga-script-tag")) return // zaten yüklü

    const script1 = document.createElement("script")
    script1.id = "ga-script-tag"
    script1.async = true
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script1)

    const script2 = document.createElement("script")
    script2.id = "ga-inline-config"
    script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}');
    `
    document.head.appendChild(script2)
}

/**
 * KVKK/GDPR uyumu için çerez onay banner'ı. Google Analytics (gtag), izleme
 * amaçlı bir çerez/script olduğu için kullanıcı açıkça onay vermeden
 * yüklenmemeli — bu component hem banner'ı gösterir hem de onay verilirse
 * analytics script'lerini dinamik olarak enjekte eder.
 */
export default function CookieConsent() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem(CONSENT_KEY) as ConsentValue | null
        const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

        if (stored === "accepted" && measurementId) {
            loadAnalytics(measurementId)
        } else if (!stored) {
            setVisible(true)
        }
    }, [])

    const handleChoice = (value: ConsentValue) => {
        localStorage.setItem(CONSENT_KEY, value)
        setVisible(false)

        const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
        if (value === "accepted" && measurementId) {
            loadAnalytics(measurementId)
        }
    }

    if (!visible) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6">
            <div className="max-w-3xl mx-auto bg-[#151515] border border-gray-800 rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <p className="text-sm text-gray-300 flex-1">
                    Sitemizde deneyiminizi iyileştirmek ve kullanım istatistiklerini analiz etmek için çerezler
                    kullanıyoruz. Detaylar için{" "}
                    <Link href="/privacy" className="text-orange-500 hover:underline">
                        Gizlilik Politikası
                    </Link>
                    &apos;nı inceleyebilirsiniz.
                </p>
                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                    <button
                        onClick={() => handleChoice("rejected")}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium text-gray-300 border border-gray-700 hover:bg-white/5 transition-colors"
                    >
                        Reddet
                    </button>
                    <button
                        onClick={() => handleChoice("accepted")}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                    >
                        Kabul Et
                    </button>
                </div>
            </div>
        </div>
    )
}
