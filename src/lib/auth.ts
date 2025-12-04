import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
}
