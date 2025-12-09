import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security headers to protect against common attacks
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

export function middleware(request: NextRequest) {
    const response = NextResponse.next()

    // Add security headers to all responses
    Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
    })

    // Block access to development-only endpoints in production
    if (process.env.NODE_ENV === 'production') {
        const blockedPaths = ['/api/seed', '/api/migrate', '/api/test-courses']
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
        // Match all API routes
        '/api/:path*',
        // Match admin routes
        '/admin/:path*',
    ]
}
