"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SearchResult {
    id: string;
    title: string;
    slug: string;
    instructor: {
        name: string;
    };
    imageUrl?: string;
}

export default function HeaderSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const router = useRouter();
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch(`/api/courses?search=${encodeURIComponent(query)}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(Array.isArray(data) ? data : data.courses || []);
                }
            } catch (error) {
                console.error("Search error", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && query.trim()) {
            setShowResults(false);
            router.push(`/courses?search=${encodeURIComponent(query)}`);
        }
    };

    return (
        <div ref={wrapperRef} className="hidden md:flex flex-col relative z-50">
            <div className="flex items-center bg-[#2a2a2a] rounded-md px-3 py-2 w-80 focus-within:ring-1 focus-within:ring-orange-500 transition-all">
                <Search className="w-4 h-4 text-gray-500 mr-2" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowResults(true);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (query) setShowResults(true); }}
                    placeholder="Hangi lezzette ustalaşmak istersin?"
                    className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
                />
                {isLoading ? (
                    <Loader2 className="w-4 h-4 text-gray-500 animate-spin ml-2" />
                ) : query && (
                    <button onClick={() => { setQuery(""); setResults([]); }} className="text-gray-500 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {showResults && (query.length >= 2) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[400px] overflow-y-auto">
                    {results.length > 0 ? (
                        <div className="py-2">
                            <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                Sonuçlar
                            </div>
                            {results.map((course) => (
                                <Link
                                    key={course.id}
                                    href={`/course/${course.id}`}
                                    onClick={() => setShowResults(false)}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a2a] transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-md bg-gray-800 overflow-hidden flex-shrink-0">
                                        <img
                                            src={course.imageUrl || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&q=80'}
                                            alt=""
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white text-sm font-medium truncate group-hover:text-orange-500 transition-colors">{course.title}</h4>
                                        <p className="text-gray-500 text-xs truncate">{course.instructor?.name || 'Gastrofolly Eğitmeni'}</p>
                                    </div>
                                </Link>
                            ))}
                            <div className="border-t border-gray-800 mt-2 pt-2 pb-1">
                                <Link
                                    href={`/courses?search=${encodeURIComponent(query)}`}
                                    className="block text-center text-xs text-orange-500 hover:text-orange-400 py-2 font-medium"
                                    onClick={() => setShowResults(false)}
                                >
                                    Tüm sonuçları gör
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500 text-sm">
                            {!isLoading && "Sonuç bulunamadı."}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
