"use client";

import { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
    {
        question: "Eğitimler sonunda sertifika veriliyor mu?",
        answer: "Evet! Başarıyla tamamladığınız her eğitim için isminize özel, doğrulanabilir dijital başarı sertifikası alırsınız. Bu sertifikaları CV'nize ekleyebilir veya LinkedIn profilinizde paylaşabilirsiniz."
    },
    {
        question: "Bireysel kurs satın alabilir miyim, yoksa üyelik mi gerekli?",
        answer: "Culinora'da bireysel kurs satışı bulunmamaktadır. Tüm içeriklerimiz abonelik sistemi ile yönetilmektedir. Tek bir üyelik ile platformdaki tüm eğitimlere sınırsız erişim sağlayabilirsiniz."
    },
    {
        question: "Eğitimlere ne kadar süreyle erişebilirim?",
        answer: "Premium aboneliğiniz olduğu sürece kütüphanedeki tüm içeriklere dilediğiniz zaman, dilediğiniz yerden ulaşabilirsiniz."
    },
    {
        question: "Mobil cihazlardan izleyebilir miyim?",
        answer: "Evet! Culinora'yı tüm cihazlarınızdan takip edebilirsiniz. Web platformumuzun yanı sıra hem Android hem de iOS (iPhone) mobil uygulamalarımız üzerinden eğitimlerinize dilediğiniz her yerde devam edebilirsiniz."
    },
    {
        question: "Şeflerle iletişim kurabilir miyim?",
        answer: "Evet, aklınıza takılan soruları şeflerimize e-posta yoluyla iletebilirsiniz. Eğitmenlerimiz en kısa sürede sorularınızı yanıtlayacaktır."
    }
];

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-20 bg-black border-t border-gray-800 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent opacity-50 pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 text-orange-500 text-sm font-semibold mb-6">
                        <HelpCircle className="w-4 h-4" />
                        <span>Merak Ettikleriniz</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Sıkça Sorulan <span className="text-orange-500">Sorular</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Culinora deneyimi hakkında aklınıza takılan tüm soruların cevapları burada.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`border transition-all duration-300 rounded-2xl ${openIndex === index
                                ? "bg-[#111] border-orange-500/30"
                                : "bg-black border-gray-800 hover:border-gray-700"
                                }`}
                        >
                            <button
                                onClick={() => setOpenIndex(requestIndex => requestIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                            >
                                <span className={`text-lg font-semibold transition-colors ${openIndex === index ? "text-white" : "text-gray-300"
                                    }`}>
                                    {faq.question}
                                </span>
                                <div className={`p-2 rounded-full transition-colors ${openIndex === index ? "bg-orange-500 text-white" : "bg-gray-800 text-gray-400 group-hover:text-white"
                                    }`}>
                                    {openIndex === index ? (
                                        <Minus className="w-5 h-5" />
                                    ) : (
                                        <Plus className="w-5 h-5" />
                                    )}
                                </div>
                            </button>

                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-6 pt-0 text-gray-400 leading-relaxed">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
