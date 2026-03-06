import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security headers to protect against common attacks
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://va.vercel-scripts.com https://*.iyzipay.com https://*.iyzico.com; style-src 'self' 'unsafe-inline' https://*.iyzipay.com https://*.iyzico.com; img-src 'self' blob: data: https://*.cloudinary.com https://res.cloudinary.com https://images.unsplash.com https://via.placeholder.com https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://*.iyzipay.com https://*.iyzico.com; connect-src 'self' https://vitals.vercel-insights.com https://www.google-analytics.com https://*.cloudinary.com https://api.cloudinary.com https://*.iyzipay.com https://*.iyzico.com; font-src 'self' data: https://*.iyzipay.com https://*.iyzico.com; object-src 'none'; media-src 'self' blob: https://*.cloudinary.com https://res.cloudinary.com; frame-src 'self' https://*.iyzipay.com https://*.iyzico.com;",
}

export function middleware(request: NextRequest) {
    const response = NextResponse.next()

    // Add security headers to all responses
    Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
    })

    // Block access to development-only endpoints in production
    if (process.env.NODE_ENV === 'production') {
        const blockedPaths = ['/api/seed', '/api/migrate', '/api/test-courses', '/api/debug-db', '/api/test-email', '/api/test']
        const pathname = request.nextUrl.pathname

        if (blockedPaths.some(path => pathname.startsWith(path))) {
            return NextResponse.json(
                { error: 'This endpoint is disabled in production' },
                { status: 403 }
            )
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
