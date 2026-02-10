import { Metadata } from "next"
import Link from "next/link"
import { ChefHat, Clock, ArrowRight, BookOpen, Tag } from "lucide-react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import UserDropdown from "@/components/ui/UserDropdown"
import Footer from "@/components/layout/Footer"
import { blogPosts } from "@/data/blog-posts"

export const metadata: Metadata = {
    title: "Chef Sosyal Blog",
    description: "Gastronomi dünyasının en güncel trendleri, profesyonel şef ipuçları, tarifler ve mutfak becerileri hakkında blog yazıları.",
    keywords: ["gastronomi blog", "mutfak ipuçları", "şef tarifleri", "yemek blogu", "aşçılık eğitimi"],
}

const categoryColors: Record<string, string> = {
    "Kariyer": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Tarifler": "bg-green-500/20 text-green-400 border-green-500/30",
    "Eğitim": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "İpuçları": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Trendler": "bg-orange-500/20 text-orange-400 border-orange-500/30",
}

export default async function BlogPage() {
    const session = await getServerSession(authOptions)

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <Link href={session?.user ? "/home" : "/"} className="flex items-center space-x-2">
                            <ChefHat className="h-8 w-8 text-orange-500" />
                            <span className="text-2xl font-bold text-white">Culinora</span>
                        </Link>
                        <nav className="hidden md:flex space-x-8">
                            <Link href={session?.user ? "/home" : "/"} className="text-gray-300 hover:text-orange-500">
                                Ana Sayfa
                            </Link>
                            <Link href="/courses" className="text-gray-300 hover:text-orange-500">
                                Kurslar
                            </Link>
                            <Link href="/blog" className="text-orange-500">
                                Blog
                            </Link>
                            <Link href="/about" className="text-gray-300 hover:text-orange-500">
                                Hakkımızda
                            </Link>
                            <Link href="/contact" className="text-gray-300 hover:text-orange-500">
                                İletişim
                            </Link>
                        </nav>
                        <div className="flex items-center space-x-4">
                            {session?.user ? (
                                <UserDropdown />
                            ) : (
                                <>
                                    <Link href="/auth/signin" className="text-gray-300 hover:text-orange-500 transition-colors">
                                        Giriş Yap
                                    </Link>
                                    <Link href="/auth/signup" className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                                        Kayıt Ol
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="pt-28 pb-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-orange-600/10 via-transparent to-transparent" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
                            <BookOpen className="h-4 w-4 text-orange-500" />
                            <span className="text-sm text-orange-400 font-medium">Chef Sosyal Blog</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            Gastronomi Dünyasından
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500"> Yazılar</span>
                        </h1>
                        <p className="text-xl text-gray-400 leading-relaxed">
                            Profesyonel şef ipuçları, trendler, tarifler ve kariyer rehberleri.
                            Mutfak tutkunları için hazırlanmış içerikler.
                        </p>
                    </div>
                </div>
            </section>

            {/* Blog Posts Grid */}
            <section className="pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogPosts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="group bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/5"
                            >
                                {/* Category & Read Time */}
                                <div className="p-6 pb-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[post.category] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                                            {post.category}
                                        </span>
                                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span>{post.readTime}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 pt-2">
                                    <h2 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors line-clamp-2">
                                        {post.title}
                                    </h2>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">
                                        {post.description}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {post.tags.slice(0, 3).map((tag) => (
                                            <span key={tag} className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                                        <span className="text-sm text-gray-500">
                                            {new Date(post.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                        <span className="flex items-center gap-1 text-orange-500 text-sm font-medium group-hover:gap-2 transition-all">
                                            Oku <ArrowRight className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-2xl p-8 md:p-12 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">
                            Okumakla kalmayın, <span className="text-orange-400">uygulayın!</span>
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                            Profesyonel şeflerden video derslerle gastronomi becerilerinizi geliştirin.
                            İlk dersiniz ücretsiz.
                        </p>
                        <Link
                            href="/courses"
                            className="inline-flex items-center gap-2 bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                        >
                            Kursları Keşfet <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
