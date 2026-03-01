"use client";

import { useEffect, useState } from "react";
import Link from "next/link"
import Image from "next/image";
import { ChefHat, Search, Star, ArrowLeft, Clock } from "lucide-react";
import HeaderSearch from "@/components/layout/HeaderSearch";
import UserDropdown from "@/components/ui/UserDropdown";
import { useSession } from "next-auth/react";
import { getOptimizedMediaUrl } from "@/lib/utils";
import Footer from "@/components/layout/Footer";

interface Category {
    id: string;
    name: string;
    slug: string;
    courseCount: number;
}

interface Course {
    id: string;
    title: string;
    description: string;
    price: number;
    imageUrl?: string;
    level: string;
    duration?: number;
    instructor: {
        id: string;
        name: string;
        image?: string;
    };
    category: {
        id: string;
        name: string;
    };
    lessonCount: number;
    enrollmentCount: number;
    averageRating: number;
}

export default function CoursesPageClient() {
    const { data: session } = useSession();
    const [categories, setCategories] = useState<Category[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<"newest" | "popular" | "rating">("newest");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [categoriesRes, coursesRes] = await Promise.all([
                    fetch("/api/categories"),
                    fetch("/api/courses")
                ]);

                if (categoriesRes.ok) {
                    const catData = await categoriesRes.json();
                    setCategories(catData.categories || []);
                }

                if (coursesRes.ok) {
                    const courseData = await coursesRes.json();
                    setCourses(courseData || []);
                }
            } catch (error) {
                console.error("Error loading courses:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredCourses = courses
        .filter(course => selectedCategoryId === "all" || course.category.id === selectedCategoryId)
        .sort((a, b) => {
            if (sortBy === "popular") return (b.enrollmentCount || 0) - (a.enrollmentCount || 0);
            if (sortBy === "rating") return (b.averageRating || 0) - (a.averageRating || 0);
            return 0; // Default: createdAt desc (from API)
        });

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800/50">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-6">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="relative w-9 h-9">

                                  <Image

                                    src="/logo.jpeg"

                                    alt="C"

                                    fill

                                    className="object-contain"

                                  />

                                </div>
                                <span className="text-xl font-bold tracking-tight">
                                  <span className="text-orange-500">ulin</span>
                                  <span className="text-white">ora</span>
                                </span>
                            </Link>
                            <div className="hidden md:block">
                                <HeaderSearch />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {session ? (
                                <UserDropdown />
                            ) : (
                                <>
                                    <Link href="/auth/signin" className="text-gray-400 hover:text-white text-sm transition-colors">
                                        Giriş yap
                                    </Link>
                                    <Link
                                        href="/auth/signup"
                                        className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
                                    >
                                        Kayıt Ol
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="pt-24 pb-12">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6">

                    <Link href="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-white text-xs font-medium mb-6 transition-colors">
                        <ArrowLeft className="w-3 h-3" />
                        Ana Sayfa
                    </Link>

                    <div className="mb-8 border-b border-gray-800 pb-6">
                        <h1 className="text-4xl font-light text-white mb-2">
                            Tüm <span className="font-bold text-orange-500">Eğitimler</span>
                        </h1>
                        <p className="text-gray-500">Culinora kütüphanesindeki tüm profesyonel gastronomi eğitimlerini keşfedin.</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Sidebar */}
                        <aside className="lg:w-64 flex-shrink-0">
                            {/* Sorting */}


                            {/* Category Filter */}
                            <div>
                                <h3 className="text-white text-sm font-bold mb-4 uppercase tracking-wider">Kategoriler</h3>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => setSelectedCategoryId("all")}
                                        className={`text-left text-sm py-1 transition-colors ${selectedCategoryId === "all" ? "text-orange-500 font-bold" : "text-gray-400 hover:text-gray-200"}`}
                                    >
                                        Tüm Kategoriler
                                    </button>
                                    {categories.filter(cat => courses.some(course => course.category && course.category.id === cat.id)).map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategoryId(cat.id)}
                                            className={`text-left text-sm py-1 transition-colors ${selectedCategoryId === cat.id ? "text-orange-500 font-bold" : "text-gray-400 hover:text-gray-200"}`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* Content */}
                        <main className="flex-1">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-gray-500">Kütüphane taranıyor...</p>
                                </div>
                            ) : filteredCourses.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                                    {filteredCourses.map((course) => (
                                        <Link
                                            key={course.id}
                                            href={`/course/${course.id}`}
                                            className="group block"
                                        >
                                            <div className="relative aspect-[1.45/1] rounded-xl overflow-hidden mb-4 bg-gray-900 border border-gray-800 shadow-xl">
                                                <img
                                                    src={getOptimizedMediaUrl(course.imageUrl || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80', 'IMAGE')}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                                                />
                                                {course.duration && (
                                                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {Math.floor(course.duration / 60)}s {course.duration % 60}dk
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-extrabold text-orange-500 uppercase tracking-[0.2em] mb-2">
                                                    {course.category?.name || "GENEL"}
                                                </h4>
                                                <h3 className="text-white text-lg font-bold leading-snug mb-2 group-hover:text-orange-500 transition-colors line-clamp-2">
                                                    {course.title}
                                                </h3>
                                                <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                                                    <span>{course.instructor?.name || "culinora"}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-[#111] rounded-2xl border border-gray-800">
                                    <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Eğitim Bulunamadı</h3>
                                    <p className="text-gray-500">Seçtiğiniz kriterlere uygun eğitim bulunmuyor.</p>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
