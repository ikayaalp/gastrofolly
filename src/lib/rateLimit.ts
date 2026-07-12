import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

/**
 * Simple in-memory rate limiter for API routes
 * Fallback when Upstash Redis is not configured
 */

interface RateLimitEntry {
    count: number
    resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key)
        }
    }
}, 5 * 60 * 1000)

interface RateLimitOptions {
    /** Maximum number of requests allowed in the window */
    maxRequests: number
    /** Time window in seconds */
    windowSeconds: number
}

export interface RateLimitResult {
    success: boolean
    remaining: number
    resetIn: number // seconds until reset
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

const isUpstashConfigured = Boolean(redisUrl && redisToken)

if (!isUpstashConfigured) {
    console.warn("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. Using in-memory rate limiter fallback.")
}

// Module-level cache for ratelimit instances
const ratelimiters = new Map<string, Ratelimit>()

let redis: Redis | null = null
if (isUpstashConfigured) {
    redis = new Redis({
        url: redisUrl!,
        token: redisToken!,
    })
}

function getOrCreateRatelimiter(options: RateLimitOptions): Ratelimit {
    const key = `${options.maxRequests}:${options.windowSeconds}`
    let limiter = ratelimiters.get(key)
    if (!limiter) {
        limiter = new Ratelimit({
            redis: redis!,
            limiter: Ratelimit.slidingWindow(options.maxRequests, `${options.windowSeconds} s`),
            analytics: true,
        })
        ratelimiters.set(key, limiter)
    }
    return limiter
}

function fallbackCheckRateLimit(identifier: string, options: RateLimitOptions): RateLimitResult {
    const now = Date.now()
    const key = `${identifier}`
    const entry = rateLimitStore.get(key)

    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + options.windowSeconds * 1000,
        })
        return {
            success: true,
            remaining: options.maxRequests - 1,
            resetIn: options.windowSeconds,
        }
    }

    entry.count++

    if (entry.count > options.maxRequests) {
        return {
            success: false,
            remaining: 0,
            resetIn: Math.ceil((entry.resetTime - now) / 1000),
        }
    }

    return {
        success: true,
        remaining: options.maxRequests - entry.count,
        resetIn: Math.ceil((entry.resetTime - now) / 1000),
    }
}

/**
 * Check rate limit for a given identifier (IP or user ID)
 */
export async function checkRateLimit(
    identifier: string,
    options: RateLimitOptions
): Promise<RateLimitResult> {
    if (!isUpstashConfigured || !redis) {
        return fallbackCheckRateLimit(identifier, options)
    }

    try {
        const limiter = getOrCreateRatelimiter(options)
        const { success, remaining, reset } = await limiter.limit(identifier)
        
        return {
            success,
            remaining,
            resetIn: Math.ceil((reset - Date.now()) / 1000),
        }
    } catch (error) {
        // Fail-open: if Redis is down, allow the request and log
        console.error("Rate limiter Redis error:", error)
        return {
            success: true,
            remaining: 1,
            resetIn: 0,
        }
    }
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }
    const realIp = request.headers.get('x-real-ip')
    if (realIp) {
        return realIp
    }
    return 'unknown'
}

// Preset configurations for common use cases
export const RATE_LIMITS = {
    /** Auth endpoints: 5 requests per minute */
    AUTH: { maxRequests: 5, windowSeconds: 60 },
    /** Email verification: 10 attempts per 15 minutes */
    VERIFY: { maxRequests: 10, windowSeconds: 900 },
    /** Password reset: 3 requests per 15 minutes */
    RESET: { maxRequests: 3, windowSeconds: 900 },
    /** AI chat: 20 requests per minute */
    AI_CHAT: { maxRequests: 20, windowSeconds: 60 },
    /** Forum post creation: 5 per minute */
    FORUM_POST: { maxRequests: 5, windowSeconds: 60 },
    /** Upload: 10 per minute */
    UPLOAD: { maxRequests: 10, windowSeconds: 60 },
    /** General API: 60 requests per minute */
    GENERAL: { maxRequests: 60, windowSeconds: 60 },
} as const
