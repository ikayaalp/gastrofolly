import React from "react"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChefHat, Clock, ArrowLeft, Calendar, Tag, Share2 } from "lucide-react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import UserDropdown from "@/components/ui/UserDropdown"
import Footer from "@/components/layout/Footer"
import { getBlogPost, blogPosts } from "@/data/blog-posts"

interface BlogPostPageProps {
    params: Promise<{
        slug: string
    }>
}

export async function generateStaticParams() {
    return blogPosts.map((post) => ({
        slug: post.slug,
    }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params
    const post = getBlogPost(slug)

    if (!post) {
        return { title: "Yazı Bulunamadı" }
    }

    return {
        title: post.title,
        description: post.description,
        keywords: post.tags,
        openGraph: {
            title: post.title,
            description: post.description,
            type: "article",
            publishedTime: post.date,
            authors: [post.author],
            tags: post.tags,
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.description,
        },
    }
}

function renderMarkdown(content: string) {
    const lines = content.trim().split('\n')
    const elements: React.ReactNode[] = []
    let inList = false
    let listItems: React.ReactNode[] = []
    let inTable = false
    let tableRows: string[][] = []
    let tableHeaders: string[] = []

    const processInlineMarkdown = (text: string): React.ReactNode[] => {
        const result: React.ReactNode[] = []
        const regex = /\*\*(.+?)\*\*/g
        let lastIndex = 0
        let match

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                result.push(text.substring(lastIndex, match.index))
            }
            result.push(<strong key={match.index} className="text-white font-semibold">{match[1]}</strong>)
            lastIndex = regex.lastIndex
        }

        if (lastIndex < text.length) {
            result.push(text.substring(lastIndex))
        }

        return result.length > 0 ? result : [text]
    }

    const flushList = () => {
        if (inList && listItems.length > 0) {
            elements.push(
                <ul key={`list-${elements.length}`} className="space-y-2 mb-6 ml-4">
                    {listItems}
                </ul>
            )
            listItems = []
            inList = false
        }
    }

    const flushTable = () => {
        if (inTable && tableRows.length > 0) {
            elements.push(
                <div key={`table-${elements.length}`} className="overflow-x-auto mb-6 rounded-lg border border-gray-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-800/50">
                                {tableHeaders.map((h, i) => (
                                    <th key={i} className="px-4 py-3 text-left text-gray-300 font-semibold">{h.trim()}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.map((row, ri) => (
                                <tr key={ri} className="border-t border-gray-800">
                                    {row.map((cell, ci) => (
                                        <td key={ci} className="px-4 py-3 text-gray-400">{cell.trim()}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
            tableRows = []
            tableHeaders = []
            inTable = false
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()

        if (!trimmed) {
            flushList()
            flushTable()
            continue
        }

        // Table detection
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            if (trimmed.includes('---')) continue // separator row

            const cells = trimmed.split('|').filter(c => c.trim() !== '')

            if (!inTable) {
                inTable = true
                tableHeaders = cells
            } else {
                tableRows.push(cells)
            }
            continue
        } else if (inTable) {
            flushTable()
        }

        // Headers
        if (trimmed.startsWith('### ')) {
            flushList()
            elements.push(
                <h3 key={i} className="text-xl font-bold text-white mt-8 mb-4">
                    {processInlineMarkdown(trimmed.replace('### ', ''))}
                </h3>
            )
        } else if (trimmed.startsWith('## ')) {
            flushList()
            elements.push(
                <h2 key={i} className="text-2xl font-bold text-white mt-10 mb-4 pb-2 border-b border-gray-800">
                    {processInlineMarkdown(trimmed.replace('## ', ''))}
                </h2>
            )
        }
        // Horizontal rule
        else if (trimmed === '---') {
            flushList()
            elements.push(<hr key={i} className="border-gray-800 my-8" />)
        }
        // List items
        else if (trimmed.startsWith('- ')) {
            inList = true
            listItems.push(
                <li key={i} className="flex items-start gap-2 text-gray-300 leading-relaxed">
                    <span className="text-orange-500 mt-1.5">•</span>
                    <span>{processInlineMarkdown(trimmed.replace('- ', ''))}</span>
                </li>
            )
        }
        // Italic/emphasis paragraph
        else if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
            flushList()
            elements.push(
                <p key={i} className="text-orange-400/80 italic mb-4 mt-4 p-4 bg-orange-500/5 border-l-2 border-orange-500/30 rounded-r-lg">
                    {trimmed.replace(/^\*|\*$/g, '')}
                </p>
            )
        }
        // Regular paragraph
        else {
            flushList()
            elements.push(
                <p key={i} className="text-gray-300 leading-relaxed mb-4">
                    {processInlineMarkdown(trimmed)}
                </p>
            )
        }
    }

    flushList()
    flushTable()

    return elements
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params
    const post = getBlogPost(slug)
    const session = await getServerSession(authOptions)

    if (!post) {
        notFound()
    }

    // Find related posts
    const relatedPosts = blogPosts
        .filter(p => p.slug !== post.slug)
        .slice(0, 2)

    // JSON-LD for blog post
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.description,
        "author": {
            "@type": "Organization",
            "name": "Culinora"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Culinora",
            "url": "https://culinora.net"
        },
        "datePublished": post.date,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://culinora.net/blog/${post.slug}`
        },
        "keywords": post.tags.join(", ")
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

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

            {/* Breadcrumb */}
            <div className="pt-20 bg-gray-900/20 border-b border-gray-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-gray-400 hover:text-orange-500 transition-colors">Ana Sayfa</Link>
                        <span className="text-gray-600">/</span>
                        <Link href="/blog" className="text-gray-400 hover:text-orange-500 transition-colors">Blog</Link>
                        <span className="text-gray-600">/</span>
                        <span className="text-gray-300 truncate">{post.title}</span>
                    </div>
                </div>
            </div>

            {/* Article */}
            <article className="py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Article Header */}
                    <header className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                {post.category}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
                            {post.title}
                        </h1>

                        <p className="text-xl text-gray-400 leading-relaxed mb-6">
                            {post.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 pb-6 border-b border-gray-800">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
                                    <ChefHat className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-gray-300 font-medium">{post.author}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(post.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                <span>{post.readTime} okuma</span>
                            </div>
                        </div>
                    </header>

                    {/* Article Content */}
                    <div className="prose-custom">
                        {renderMarkdown(post.content)}
                    </div>

                    {/* Tags */}
                    <div className="mt-12 pt-6 border-t border-gray-800">
                        <div className="flex items-center gap-2 mb-3">
                            <Tag className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500 font-medium">Etiketler</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                                <span key={tag} className="text-sm text-gray-400 bg-gray-800/50 border border-gray-700 px-3 py-1.5 rounded-lg hover:border-orange-500/30 transition-colors">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </article>

            {/* Related Posts */}
            <section className="py-12 border-t border-gray-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold mb-8">Diğer Yazılar</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {relatedPosts.map((related) => (
                            <Link
                                key={related.slug}
                                href={`/blog/${related.slug}`}
                                className="group bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300"
                            >
                                <span className="text-xs text-orange-400 font-medium">{related.category}</span>
                                <h3 className="text-lg font-bold text-white mt-2 mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                                    {related.title}
                                </h3>
                                <p className="text-gray-400 text-sm line-clamp-2">{related.description}</p>
                                <div className="flex items-center gap-1 mt-4 text-orange-500 text-sm font-medium">
                                    Devamını Oku <ArrowLeft className="h-4 w-4 rotate-180" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-2xl p-8 text-center">
                        <h2 className="text-2xl font-bold mb-3">Mutfak becerilerinizi geliştirin</h2>
                        <p className="text-gray-400 mb-6">Profesyonel şeflerden video derslerle öğrenin.</p>
                        <Link
                            href="/courses"
                            className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                        >
                            Kursları Keşfet
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
