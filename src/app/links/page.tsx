import Link from "next/link";
import Image from "next/image";
import { ChefHat, Crown, Play, Users, ArrowRight, Instagram, Globe } from "lucide-react";

export const metadata = {
    title: 'Gastrofolly x Culinora | Linkler',
    description: 'Gastrofolly takipçilerine özel Culinora fırsatları.',
};

export default function LinksPage() {
    const links = [
        {
            title: "🚀 Hemen Premium Üye Ol",
            description: "Gastrofolly takipçilerine özel indirimli fiyatla başla.",
            icon: Crown,
            href: "/subscription",
            primary: true,
            color: "bg-gradient-to-r from-orange-600 to-red-600"
        },
        {
            title: "🎥 Ücretsiz Örnek Dersi İzle",
            description: "Profesyonel mutfağa ilk adımını at.",
            icon: Play,
            href: "/courses", // Ideally points to a specific free lesson or featured course
            primary: false,
            color: "bg-[#1a1a1a]"
        },
        {
            title: "👨‍🍳 Chef Sosyal'e Katıl",
            description: "Tabaklarını paylaş, şeflerden yorum al.",
            icon: Users,
            href: "/chef-sosyal",
            primary: false,
            color: "bg-[#1a1a1a]"
        },
        {
            title: "🏠 Culinora Ana Sayfa",
            description: "Türkiye'nin en kapsamlı gastronomi platformu.",
            icon: Globe,
            href: "/",
            primary: false,
            color: "bg-[#1a1a1a]"
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-orange-900/20 to-transparent pointer-events-none" />

            {/* Profile Section */}
            <div className="relative z-10 flex flex-col items-center mb-8 text-center max-w-md w-full">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-800 to-black border-2 border-orange-500/50 flex items-center justify-center mb-4 shadow-xl shadow-orange-900/20">
                    <ChefHat className="w-12 h-12 text-white" />
                    {/* Note: If user has a specific logo, we could use Image here instead */}
                </div>

                <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                    Gastrofolly <span className="text-gray-500 text-sm font-normal">x</span> Culinora
                </h1>
                <p className="text-gray-400 text-sm px-6">
                    Gastrofolly takipçilerine özel fırsatlarla gastronomi dünyasına adım at.
                </p>
            </div>

            {/* Links Stack */}
            <div className="w-full max-w-md space-y-4 relative z-10">
                {links.map((link, index) => (
                    <Link
                        key={index}
                        href={link.href}
                        className={`
              block w-full p-4 rounded-xl border border-white/10 transition-all duration-300 transform hover:scale-[1.02] hover:border-orange-500/30 group
              ${link.primary ? 'shadow-lg shadow-orange-900/40 border-none' : 'hover:bg-white/5'}
            `}
                    >
                        <div className={`flex items-center ${link.primary ? link.color + ' rounded-lg text-white' : 'bg-transparent'}`}>
                            <div className={`
                w-12 h-12 flex items-center justify-center rounded-lg mr-4 shrink-0
                ${link.primary ? 'bg-white/20' : 'bg-gray-900 text-orange-500'}
              `}>
                                <link.icon className="w-6 h-6" />
                            </div>

                            <div className="flex-1">
                                <h3 className={`font-bold text-sm md:text-base ${link.primary ? 'text-white' : 'text-gray-100'}`}>
                                    {link.title}
                                </h3>
                                <p className={`text-xs md:text-sm mt-0.5 ${link.primary ? 'text-orange-100' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                    {link.description}
                                </p>
                            </div>

                            <ArrowRight className={`w-5 h-5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 ${link.primary ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Social Footer */}
            <div className="mt-12 flex items-center gap-6 relative z-10">
                <a href="https://instagram.com/gastrofolly" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                    <Instagram className="w-6 h-6" />
                </a>
                <a href="/" className="text-gray-500 hover:text-white transition-colors">
                    <Globe className="w-6 h-6" />
                </a>
            </div>

            <div className="mt-8 text-xs text-gray-600">
                © 2024 Culinora. All rights reserved.
            </div>
        </div>
    );
}
