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
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                            }`}
                    >
                        <Home className="h-5 w-5 mr-3" />
                        Ana Akış
                    </Link>
                    <Link
                        href="/chef-sosyal?sort=popular"
                        className="flex items-center px-2 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors"
                    >
                        <TrendingUp className="h-5 w-5 mr-3" />
                        Popüler
                    </Link>
                </div>
            </div>

            {/* Topics / Categories Section */}
            <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Konular</h3>
                <div className="space-y-1">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/chef-sosyal?category=${category.slug}`}
                            className={`flex items-center px-2 py-2 rounded-lg text-sm font-medium transition-colors group ${selectedCategory === category.slug
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                                }`}
                        >
                            <span
                                className="w-5 h-5 rounded-full flex items-center justify-center mr-3 text-xs font-bold shrink-0"
                                style={{ backgroundColor: `${category.color || '#6b7280'}20`, color: category.color || '#6b7280' }}
                            >
                                #
                            </span>
                            <span className="truncate">{category.name}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Trending Hashtags Section */}
            {trendingHashtags && trendingHashtags.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center">
                        <Flame className="h-3 w-3 mr-1 text-orange-500" />
                        Trend Etiketler
                    </h3>
                    <div className="space-y-1">
                        {trendingHashtags.map((hashtag) => (
                            <Link
                                key={hashtag.id}
                                href={`/chef-sosyal?search=${encodeURIComponent('#' + hashtag.name)}`}
                                className="flex items-center justify-between px-2 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors group"
                            >
                                <span className="truncate flex items-center mr-2">
                                    <span className="text-orange-500 mr-1.5 opacity-70 group-hover:opacity-100 italic transition-opacity">#</span>
                                    {hashtag.name}
                                </span>
                                <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 group-hover:bg-gray-700 transition-colors">
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
