"use client";

import Link from "next/link";
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
                        <Link href="/" className="flex items-center space-x-2 mb-4">
                            <ChefHat className="h-8 w-8 text-orange-500" />
                            <span className="text-2xl font-bold text-white uppercase italic tracking-tighter">Culinora</span>
                        </Link>
                        <p className="text-gray-400">
                            Gastronomi dünyasında kendinizi geliştirin ve profesyonel bir şef olun.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold mb-4 uppercase italic text-orange-500">Kurslar</h4>
                        <ul className="space-y-2 text-gray-400">
                            {footerCategories.map((cat) => (
                                <li key={cat.id}>
                                    <Link href={`/category/${cat.id}`} className="hover:text-white transition-colors">
                                        {cat.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold mb-4 uppercase italic text-orange-500">Şirket</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><Link href="/about" className="hover:text-white transition-colors">Hakkımızda</Link></li>
                            <li><Link href="/instructors" className="hover:text-white transition-colors">Eğitmenler</Link></li>
                            <li><Link href="/careers" className="hover:text-white transition-colors">Kariyer</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">İletişim</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold mb-4 uppercase italic text-orange-500">Destek</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><Link href="/help" className="hover:text-white transition-colors">Yardım Merkezi</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Gizlilik</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition-colors">Şartlar</Link></li>
                            <li><Link href="/faq" className="hover:text-white transition-colors">SSS</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
                    <p>&copy; 2026 Culinora. Tüm hakları saklıdır.</p>
                </div>
            </div>
        </footer>
    );
}
