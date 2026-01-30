import Link from "next/link"
import { Home, TrendingUp, Flame, Star, Hash } from "lucide-react"

interface Category {
    id: string
    name: string
    slug: string
    color: string | null
    _count: {
        topics: number
    }
}

interface TrendHashtag {
    id: string
    name: string
    count: number
}

interface LeftSidebarProps {
    categories: Category[]
    selectedCategory: string
    trendingHashtags?: TrendHashtag[]
}

export default function LeftSidebar({ categories, selectedCategory, trendingHashtags }: LeftSidebarProps) {
    return (
        <div className="hidden md:flex flex-col w-[270px] flex-shrink-0 h-[calc(100vh-80px)] sticky top-24 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-800">

            {/* Feeds Section */}
            <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Akışlar</h3>
                <div className="space-y-1">
                    <Link
                        href="/chef-sosyal"
                        className={`flex items-center px-2 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === 'all'
                            ? 'bg-white/10 text-[#e7e9ea]'
                            : 'text-[#e7e9ea] hover:bg-white/5'
                            }`}
                    >
                        <Home className="h-5 w-5 mr-3" />
                        Ana Akış
                    </Link>
                    <Link
                        href="/chef-sosyal?sort=popular"
                        className="flex items-center px-2 py-2 rounded-lg text-sm font-medium text-[#e7e9ea] hover:bg-white/5 transition-colors"
                    >
                        <TrendingUp className="h-5 w-5 mr-3" />
                        Popüler
                    </Link>
                </div>
            </div>



            {/* Trending Hashtags Section */}
            {trendingHashtags && trendingHashtags.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center">
                        Trend Etiketler
                    </h3>
                    <div className="space-y-1">
                        {trendingHashtags.map((hashtag) => (
                            <Link
                                key={hashtag.id}
                                href={`/chef-sosyal?search=${encodeURIComponent('#' + hashtag.name)}`}
                                className="flex items-center justify-between px-2 py-1.5 rounded-lg text-sm font-medium text-[#e7e9ea] hover:bg-white/5 transition-colors group"
                            >
                                <span className="truncate flex items-center mr-2">
                                    <span className="text-orange-500 mr-1.5 opacity-70 group-hover:opacity-100 italic transition-opacity font-bold">#</span>
                                    {hashtag.name}
                                </span>
                                <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-[#71767b] group-hover:bg-white/10 transition-colors">
                                    {hashtag.count}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}





            <div className="mt-auto pt-6 border-t border-gray-800 text-xs text-gray-600 px-2 pb-4">
                <p>© 2026 Culinora</p>
                <div className="flex flex-wrap gap-2 mt-2">
                    <Link href="/privacy" className="hover:underline">Gizlilik</Link>
                    <Link href="/terms" className="hover:underline">Şartlar</Link>
                </div>
            </div>
        </div>
    )
}
