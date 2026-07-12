import { redirect, notFound } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, User, Bot } from "lucide-react"

export default async function AiConversationDetailPage({
  params
}: {
  params: Promise<{ conversationId: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  const { conversationId } = await params

  const conversation = await prisma.aiConversation.findUnique({
    where: { id: conversationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      messages: {
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  })

  if (!conversation) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/ai-conversations"
          className="p-2 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 hover:text-white hover:border-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            {conversation.title}
          </h1>
          <p className="text-gray-400 mt-1 text-sm flex items-center gap-2">
            {conversation.user.name || 'İsimsiz'} ({conversation.user.email}) ile Culi arasındaki konuşma
          </p>
        </div>
      </div>

      <div className="bg-black border border-gray-800 rounded-xl overflow-hidden flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {conversation.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p>Bu konuşmada hiç mesaj yok.</p>
            </div>
          ) : (
            conversation.messages.map((message) => {
              const isUser = message.role === 'user'
              
              return (
                <div key={message.id} className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-orange-900/20">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
                    isUser 
                      ? 'bg-gray-800 text-white rounded-tr-sm' 
                      : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-sm'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    <div className={`text-[10px] mt-2 opacity-50 ${isUser ? 'text-right' : 'text-left'}`}>
                      {new Date(message.createdAt).toLocaleString('tr-TR', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-1 border border-gray-700">
                      {conversation.user.image ? (
                        <img src={conversation.user.image} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
        
        <div className="p-4 border-t border-gray-800 bg-gray-900/30 text-center text-xs text-gray-500">
          Bu alan salt okunurdur. Konuşmaya müdahale edilemez.
        </div>
      </div>
    </div>
  )
}
