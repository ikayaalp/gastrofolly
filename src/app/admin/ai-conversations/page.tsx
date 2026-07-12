import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Search, MessageSquare, ChevronRight, User } from "lucide-react"

export default async function AiConversationsPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  const { search } = await searchParams
  const query = search || ""

  const conversations = await prisma.aiConversation.findMany({
    where: query ? {
      user: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } }
        ]
      }
    } : undefined,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      _count: {
        select: { messages: true }
      }
    },
    orderBy: {
      updatedAt: "desc"
    },
    take: 50
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-orange-500" />
            Culi Geçmişi
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Kullanıcıların Culi asistanı ile olan son konuşmalarını görüntüleyin (Salt Okunur).
          </p>
        </div>
      </div>

      <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-900/30">
          <h3 className="text-lg font-medium text-white">Son 50 Konuşma</h3>
          <form method="GET" className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              name="search"
              defaultValue={query}
              placeholder="Kullanıcı adı veya email ara..." 
              className="bg-black border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 w-full transition-colors"
            />
            {query && (
              <Link href="/admin/ai-conversations" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">
                Temizle
              </Link>
            )}
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-800 text-xs uppercase text-gray-500">
                <th className="py-4 px-6 font-medium">Kullanıcı</th>
                <th className="py-4 px-6 font-medium">Başlık</th>
                <th className="py-4 px-6 font-medium text-center">Mesaj Sayısı</th>
                <th className="py-4 px-6 font-medium text-right">Son Etkileşim</th>
                <th className="py-4 px-6 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {conversations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                    {query ? "Aranan kritere uygun konuşma bulunamadı." : "Henüz hiçbir konuşma yok."}
                  </td>
                </tr>
              ) : (
                conversations.map((conv) => (
                  <tr key={conv.id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {conv.user.image ? (
                          <img src={conv.user.image} alt="" className="w-8 h-8 rounded-full border border-gray-700" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{conv.user.name || 'İsimsiz'}</p>
                          <p className="text-xs text-gray-500">{conv.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-300 font-medium line-clamp-1">{conv.title}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                        {conv._count.messages}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-sm text-gray-400">
                      {new Date(conv.updatedAt).toLocaleString('tr-TR', { 
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link 
                        href={`/admin/ai-conversations/${conv.id}`}
                        className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
