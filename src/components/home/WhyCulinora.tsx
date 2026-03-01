"use client";
import { Award, Smartphone, FileText, Users } from "lucide-react";
import { motion } from "framer-motion";

const features = [
    {
        icon: <Award className="w-8 h-8 text-orange-500" />,
        title: "Dijital Sertifika",
        description: "Tamamladığınız her kurs için CV'nize değer katacak, doğrulanabilir başarı sertifikası kazanın."
    },
    {
        icon: <Smartphone className="w-8 h-8 text-orange-500" />,
        title: "Mobil Öğrenme",
        description: "Android ve iOS uygulamalarımızla dersleri indirin, mutfakta internete ihtiyaç duymadan izleyin."
    },
    {
        icon: <FileText className="w-8 h-8 text-orange-500" />,
        title: "Özel Reçeteler",
        description: "Şeflerin gizli reçetelerine ve teknik dökümanlarına her derste PDF olarak kolayca ulaşın."
    },
    {
        icon: <Users className="w-8 h-8 text-orange-500" />,
        title: "Şef Topluluğu",
        description: "Diğer şef adaylarıyla etkileşime girin, tabaklarınızı paylaşın ve geri bildirim alın."
    }
];

export default function WhyCulinora() {
    return (
        <section className="py-24 bg-black border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Neden <span className="text-orange-500">Culinora?</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Sadece bir video platformu değil, profesyonel bir gastronomi ekosistemi.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="p-8 bg-gray-900/40 border border-gray-800 rounded-2xl hover:border-orange-500/30 transition-all group"
                        >
                            <div className="mb-6 p-3 bg-gray-800 rounded-xl w-fit group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-orange-500 transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
