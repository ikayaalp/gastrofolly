import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit"
import { generateUniqueUsername } from "@/lib/generateUsername"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Her seferinde hesap seçim ekranını ve izin onayını göster
      authorization: {
        params: {
          prompt: "consent select_account",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Brute-force koruması: ayni e-posta icin dakikada 5 deneme sinirlanir.
        // IP degil e-posta ile sinirliyoruz cunku NextAuth'un authorize
        // callback'i request nesnesine guvenilir sekilde erismiyor; bir
        // hesabin sifresini hizli denemekle bombalama en pratik senaryo.
        const rateLimitKey = `login:${credentials.email.trim().toLowerCase()}`
        if (!checkRateLimit(rateLimitKey, RATE_LIMITS.AUTH).success) {
          throw new Error("Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin.")
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        // Email doğrulanmış mı kontrol et
        if (!user.emailVerified) {
          return null
        }

        // Şifre kontrolü
        if (!user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        
        // Generate new session ID on login
        const newSessionId = randomUUID()
        token.sessionId = newSessionId
        
        // Save to DB and check username
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        let dataToUpdate: any = { currentSessionId: newSessionId }
        
        if (dbUser && !dbUser.username) {
          const newUsername = await generateUniqueUsername(dbUser.name, dbUser.email)
          dataToUpdate.username = newUsername
          token.username = newUsername
        } else if (dbUser) {
          token.username = dbUser.username
        }

        await prisma.user.update({
          where: { id: user.id },
          data: dataToUpdate
        })
      }
      if (trigger === "update" && session?.user) {
        token.name = session.user.name
        token.picture = session.user.image
      }
      return token
    },
    async session({ session, token }) {
      if (token && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role

        // Abonelik durumunu taze çek
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            subscriptionPlan: true,
            subscriptionEndDate: true,
            subscriptionCancelled: true,
            phoneNumber: true,
            referralCode: true,
            currentSessionId: true,
            username: true,
          }
        })

        if (user) {
          // Single-device login check
          if (user.currentSessionId && token.sessionId !== user.currentSessionId) {
            console.log(`[NextAuth] Kicking out old session for user: ${user.id}`);
            // Return session with error flag so client can show toast before logging out
            (session as any).error = 'ConcurrentLogin';
          }

          // Lazy cleanup
          if (user.subscriptionPlan === 'Premium' && user.subscriptionEndDate && new Date(user.subscriptionEndDate) < new Date()) {
              await prisma.user.update({
                  where: { id: user.id },
                  data: { subscriptionPlan: null, subscriptionEndDate: null }
              })
              ;(session as any).user.subscriptionPlan = null
          } else {
              ;(session as any).user.subscriptionPlan = user.subscriptionPlan
              ;(session as any).user.subscriptionEndDate = user.subscriptionEndDate
              ;(session as any).user.subscriptionCancelled = user.subscriptionCancelled
          }
          ;(session as any).user.phoneNumber = user.phoneNumber
          ;(session as any).user.referralCode = user.referralCode
          session.user.username = user.username
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Çıkış yapıldığında ana sayfaya yönlendir
      if (url === baseUrl || url === "/") {
        return baseUrl
      }
      // Login sonrası home sayfasına yönlendir
      if (url.startsWith("/") && url !== "/auth/signin" && url !== "/auth/signup") {
        return `${baseUrl}/home`
      }
      // Eğer callback URL varsa ve auth sayfası değilse, home'a yönlendir
      if (url.startsWith(baseUrl) && !url.includes("/auth/")) {
        return `${baseUrl}/home`
      }
      return `${baseUrl}/home`
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/",
  },
  events: {
    async signIn({ user, account }) {
      // Google ile girişte emailVerified null ise doğrulanmış olarak işaretle
      if (account?.provider === 'google' && !(user as any).emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() }
        })
      }
    }
  }
}
