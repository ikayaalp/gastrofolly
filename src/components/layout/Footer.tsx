"use client";

import Link from "next/link";
import Image from "next/image";
import { ChefHat } from "lucide-react";
import { useEffect, useState } from "react";

interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function Footer() {
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/categories");
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data.categories || []);
                }
            } catch (error) {
                console.error("Error loading categories in footer:", error);
            }
        };
        fetchCategories();
    }, []);

    // Filter specific categories for the footer or just show the first few
    const footerCategories = categories.length > 0
        ? categories.slice(0, 4)
        : [
            { id: "temel-mutfak", name: "Temel Mutfak", slug: "temel-mutfak" },
            { id: "turk-mutfagi", name: "Türk Mutfağı", slug: "turk-mutfagi" },
            { id: "pastane", name: "Pastane", slug: "pastane" },
            { id: "dunya-mutfagi", name: "Dünya Mutfağı", slug: "dunya-mutfagi" }
        ];

    return (
        <footer className="bg-black text-white py-12 border-t border-orange-500/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <Link href="/" className="flex items-center gap-1 mb-4">
                            <div className="relative h-8 w-8">
                                <Image
                                    src="/logo.jpeg"
                                    alt="C"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-2xl font-bold uppercase italic tracking-tighter">
                                <span className="text-orange-500">ulin</span>
                                <span className="text-white">ora</span>
                            </span>
                        </Link>
                        <p className="text-gray-400">
                            Gastronomi dünyasında kendinizi geliştirin ve profesyonel bir şef olun.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold mb-4 text-orange-500">Kurslar</h4>
                        <ul className="space-y-2 text-gray-400">
                            {footerCategories.map((cat: Category) => (
                                <li key={cat.id}>
                                    <Link href={`/category/${cat.id}`} className="hover:text-white transition-colors">
                                        {cat.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold mb-4 text-orange-500">Şirket</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><Link href="/about" className="hover:text-white transition-colors">Hakkımızda</Link></li>
                            <li><Link href="/instructors" className="hover:text-white transition-colors">Eğitmenler</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">İletişim</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold mb-4 text-orange-500">Destek</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Gizlilik</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition-colors">Şartlar</Link></li>
                            <li><Link href="/iptal-iade" className="hover:text-white transition-colors">İptal ve İade</Link></li>
                            <li><Link href="/teslimat-iade" className="hover:text-white transition-colors">Teslimat ve İade</Link></li>
                            <li><Link href="/faq" className="hover:text-white transition-colors">SSS</Link></li>
                        </ul>
                    </div>
                </div>
                {/* Payment Logos */}
                <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col items-center gap-4">
                    <div className="relative h-8 w-64">
                        <Image
                            src="/iyzico-logo-pack/footer_iyzico_ile_ode/White/logo_band_white.svg"
                            alt="iyzico ile Öde - Visa, MasterCard, Troy"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <p className="text-gray-500 text-sm">&copy; 2026 Culinora. Tüm hakları saklıdır.</p>
                </div>
            </div>
        </footer>
    );
}
