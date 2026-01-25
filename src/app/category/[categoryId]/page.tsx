"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChefHat, Search, ChevronDown, Play, Users, Star, BookOpen, ArrowLeft, Filter, SlidersHorizontal, Clock } from "lucide-react";

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
    lessonCount: number;
    enrollmentCount: number;
    averageRating: number;
    reviewCount: number;
}

export default function CategoryPage() {
    const params = useParams();
    const categoryId = params.categoryId as string;

    const [category, setCategory] = useState<Category | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"newest" | "popular" | "rating">("newest");

    // Fetch all categories for sidebar
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/categories");
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data.categories || []);

                    // Find current category from API data
                    const current = data.categories?.find((c: Category) => c.id === categoryId);
                    if (current) setCategory(current);
                }
            } catch (error) {
                console.error("Error loading categories:", error);
            }
        };
        fetchCategories();
    }, [categoryId]);

    // Fetch courses for this category
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/categories/${categoryId}/courses`);
                const data = await response.json();
                setCourses(data.courses || []);
            } catch (error) {
                console.error("Error loading courses:", error);
                setCourses([]);
            } finally {
                setLoading(false);
            }
        };
        if (categoryId) fetchCourses();
    }, [categoryId]);

    // Filter and sort courses
    const filteredCourses = courses
        .filter(course =>
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (course.instructor?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === "popular") return b.enrollmentCount - a.enrollmentCount;
            if (sortBy === "rating") return b.averageRating - a.averageRating;
            return 0; // newest is default/fallback
        });

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-gray-800">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <ChefHat className="h-6 w-6 text-orange-500" />
                            <span className="text-lg font-extrabold text-white tracking-tight">Culinora</span>
                        </Link>



                        <div className="flex items-center gap-4">
                            <Link href="/auth/signin" className="text-gray-400 hover:text-white text-xs font-medium uppercase tracking-wide transition-colors">
                                Giriş Yap
                            </Link>
                            <Link
                                href="/auth/signup"
                                className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wide px-5 py-2 rounded-full transition-colors"
                            >
                                Kayıt Ol
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="pt-20 pb-12">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6">

                    {/* Compact Breadcrumb/Back */}
                    <Link href="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-white text-xs font-medium mb-4 transition-colors">
                        <ArrowLeft className="w-3 h-3" />
                        Ana Sayfa
                    </Link>

                    {/* Category Title - Cleaner */}
                    <div className="mb-6 border-b border-gray-800 pb-4">
                        <h1 className="text-3xl font-light text-white mb-2">
                            {category?.name || "Kategori"} <span className="font-bold text-orange-500">Eğitimleri</span>
                        </h1>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12">

                        {/* Sidebar - NeoSkola Style (Clean List) */}
                        <aside className="lg:w-56 flex-shrink-0">

                            {/* Sort */}
                            <div className="mb-8">
                                <h3 className="text-white text-sm font-bold mb-4">Sıralama</h3>
                                <div className="flex flex-col gap-1">
                                    {[
                                        { id: "newest", label: "Yeni Eklenenler" },
                                        { id: "popular", label: "En Çok İzlenenler" },
                                        { id: "rating", label: "En Yüksek Puanlı" }
                                    ].map(option => (
                                        <button
                                            key={option.id}
                                            onClick={() => setSortBy(option.id as any)}
                                            className={`text-left text-sm py-1.5 transition-colors ${sortBy === option.id ? "text-orange-500 font-medium" : "text-gray-400 hover:text-gray-200"
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div>
                                <h3 className="text-white text-sm font-bold mb-4">Kategoriler</h3>
                                <div className="flex flex-col gap-1">
                                    {categories.map((cat) => (
                                        <Link
                                            key={cat.id}
                                            href={`/category/${cat.id}`}
                                            className={`text-sm py-1.5 transition-colors ${cat.id === categoryId
                                                ? "text-orange-500 font-medium"
                                                : "text-gray-400 hover:text-gray-200"
                                                }`}
                                        >
                                            {cat.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* Course Grid - NeoSkola Style (Cards) */}
                        <main className="flex-1">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-gray-500 animate-pulse">Eğitimler yükleniyor...</p>
                                </div>
                            ) : filteredCourses.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                                    {filteredCourses.map((course) => (
                                        <Link
                                            key={course.id}
                                            href={`/course/${course.id}`}
                                            className="group block"
                                        >
                                            {/* Image Container */}
                                            <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-4 bg-gray-800">
                                                <img
                                                    src={course.imageUrl || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80'}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                                                />
                                                {/* Duration Badge */}
                                                {course.duration && (
                                                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-medium text-white flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {Math.floor(course.duration / 60)}s {course.duration % 60}dk
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div>
                                                {/* Instructor Name - Uppercase & Tracking */}
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                                    {course.instructor?.name || "Culinora Eğitmeni"}
                                                </h4>

                                                {/* Title */}
                                                <h3 className="text-white text-lg font-semibold leading-tight mb-2 group-hover:text-orange-500 transition-colors">
                                                    {course.title}
                                                </h3>

                                                {/* Rating */}
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    {course.averageRating > 0 && (
                                                        <div className="flex items-center gap-1 text-orange-400">
                                                            <Star className="w-3 h-3 fill-current" />
                                                            <span>{course.averageRating.toFixed(1)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-[#111] rounded-2xl border border-dashed border-gray-800">
                                    <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                                        <Search className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Henüz Eğitim Bulunamadı</h3>
                                    <p className="text-gray-500 text-center max-w-sm mb-6">
                                        Bu kategoride henüs yayınlanmış bir eğitim bulunmuyor.
                                    </p>
                                    <Link
                                        href="/courses"
                                        className="text-orange-500 hover:text-orange-400 font-medium flex items-center gap-2 px-6 py-2 bg-orange-500/10 rounded-full hover:bg-orange-500/20 transition-all"
                                    >
                                        Tüm kursları keşfet <ArrowLeft className="w-4 h-4 rotate-180" />
                                    </Link>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}
